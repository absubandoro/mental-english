import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { Repository } from 'typeorm';
import { Branch, ClassRoom, Organization, Role, User } from '../entities';
import { clean } from '../common/util';
import { LoginDto, UpdateProfileDto } from './auth.dto';

const BRANCH_LOCKED_ROLES = [Role.ADMIN, Role.TEACHER, Role.FINANCE];

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Branch) private branches: Repository<Branch>,
    @InjectRepository(ClassRoom) private classes: Repository<ClassRoom>,
    private jwt: JwtService,
  ) {}

  /** Login hanya mencari akun di organisasi (lembaga) dari domain yang dibuka */
  async login(org: Organization, dto: LoginDto) {
    const user = await this.users
      .createQueryBuilder('u')
      .addSelect('u.password')
      .where('LOWER(u.email) = LOWER(:email)', { email: dto.email })
      .andWhere('u.organizationId = :org', { org: org.id })
      .getOne();
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new UnauthorizedException('Email atau password salah');
    }
    if (!user.isActive) throw new UnauthorizedException('Akun Anda dinonaktifkan');

    if (BRANCH_LOCKED_ROLES.includes(user.role)) {
      if (!dto.branchId) throw new BadRequestException('Pilih cabang untuk login sebagai admin, pengajar, atau keuangan');
      if (dto.branchId !== user.branchId) {
        throw new UnauthorizedException('Akun Anda tidak terdaftar di cabang ini');
      }
    }
    return this.issue(user);
  }

  private issue(user: User) {
    const token = this.jwt.sign({ sub: user.id, org: user.organizationId, role: user.role, branchId: user.branchId, name: user.name });
    return { token, user: this.sanitize(user) };
  }

  private sanitize(user: User) {
    const { password: _p, ...rest } = user;
    return rest;
  }

  async me(id: string) {
    const user = await this.users.findOne({
      where: { id },
      relations: { branch: true, parent: true, children: { branch: true } },
    });
    if (!user) throw new UnauthorizedException();
    const classes =
      user.role === Role.STUDENT
        ? await this.classes
            .createQueryBuilder('c')
            .innerJoin('c.students', 's', 's.id = :id', { id })
            .leftJoinAndSelect('c.teachers', 't')
            .getMany()
        : [];
    return {
      ...user,
      parent: user.parent ? { id: user.parent.id, name: user.parent.name, phone: user.parent.phone, email: user.parent.email } : null,
      classes: classes.map((c) => ({ id: c.id, name: c.name, schedule: c.schedule, teachers: c.teachers.map((t) => t.name) })),
    };
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    const { currentPassword, newPassword, ...fields } = dto;
    const patch: Partial<User> = clean(fields);
    if (newPassword) {
      const u = await this.users.createQueryBuilder('u').addSelect('u.password').where('u.id = :id', { id }).getOne();
      if (!u || !currentPassword || !(await bcrypt.compare(currentPassword, u.password))) {
        throw new BadRequestException('Password saat ini salah');
      }
      patch.password = await bcrypt.hash(newPassword, 10);
    }
    await this.users.update(id, patch);
    return this.me(id);
  }
}
