import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { User } from '../entities';
import { AuthUser } from '../common/auth';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(config: ConfigService, @InjectRepository(User) private users: Repository<User>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET') || 'dev-secret',
    });
  }

  async validate(payload: { sub: string }): Promise<AuthUser> {
    // Selalu ambil dari DB agar perubahan cabang/role/nonaktif langsung berlaku
    const user = await this.users.findOne({ where: { id: payload.sub }, select: ['id', 'role', 'branchId', 'name', 'isActive'] });
    if (!user || !user.isActive) throw new UnauthorizedException();
    return { id: user.id, role: user.role, branchId: user.branchId, name: user.name };
  }
}
