import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Repository } from 'typeorm';
import { Branch, Role, User } from '../entities';
import { AuthUser } from '../common/auth';
import { TenantRequest } from '../common/tenant';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    config: ConfigService,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Branch) private branches: Repository<Branch>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: config.get<string>('JWT_SECRET') || 'dev-secret',
      passReqToCallback: true,
    });
  }

  async validate(req: TenantRequest, payload: { sub: string; kind?: string }): Promise<AuthUser> {
    if (payload.kind) throw new UnauthorizedException(); // token pengelola platform bukan untuk portal lembaga
    // Selalu ambil dari DB agar perubahan cabang/role/nonaktif langsung berlaku
    const user = await this.users.findOne({
      where: { id: payload.sub },
      select: ['id', 'role', 'branchId', 'name', 'isActive', 'organizationId'],
    });
    if (!user || !user.isActive) throw new UnauthorizedException();
    // Token hanya berlaku di domain lembaganya sendiri
    const org = req.org;
    if (!org || org.id !== user.organizationId) throw new UnauthorizedException('Akun tidak terdaftar di lembaga ini');
    if (!org.isActive) throw new UnauthorizedException('Layanan lembaga ini sedang tidak aktif');
    const branchIds =
      user.role === Role.SUPER_ADMIN
        ? (await this.branches.find({ where: { organizationId: org.id }, select: ['id'] })).map((b) => b.id)
        : user.branchId
          ? [user.branchId]
          : [];
    return { id: user.id, role: user.role, branchId: user.branchId, name: user.name, organizationId: user.organizationId, branchIds };
  }
}
