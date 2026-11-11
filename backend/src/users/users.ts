import {
  BadRequestException, Body, ConflictException, Controller, Delete, ForbiddenException, Get, Injectable, Module, NotFoundException,
  Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { IsBoolean, IsEmail, IsEnum, IsInt, IsOptional, IsString, IsUUID, Min, MinLength, ValidateIf } from 'class-validator';
import { Repository } from 'typeorm';
import { Role, User } from '../entities';
import { ADMIN_ROLES, assertBranch, Auth, AuthUser, CurrentUser, requireBranch, scopeBranch } from '../common/auth';
import { clean, paginate } from '../common/util';

export class CreateUserDto {
  @IsString() @MinLength(2) name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
  @IsEnum(Role) role: Role;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() birthDate?: string;
  @IsOptional() @IsString() school?: string;
  @IsOptional() @IsString() level?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsUUID() parentId?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
  /** SPP khusus pelajar; null = ikut nominal cabang */
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsInt() @Min(0) monthlyFee?: number | null;
}

export class UpdateUserDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() @MinLength(6) password?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() birthDate?: string;
  @IsOptional() @IsString() school?: string;
  @IsOptional() @IsString() level?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsUUID() parentId?: string | null;
  @IsOptional() @IsBoolean() isActive?: boolean;
  /** SPP khusus pelajar; null = ikut nominal cabang */
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsInt() @Min(0) monthlyFee?: number | null;
}

interface UserQuery {
  role?: Role;
  q?: string;
  branchId?: string;
  parentId?: string;
  page?: string;
  limit?: string;
}

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private repo: Repository<User>) {}

  private assertManageable(actor: AuthUser, role: Role) {
    if (role === Role.SUPER_ADMIN) throw new ForbiddenException('Tidak dapat mengelola super admin');
    if (role === Role.ADMIN && actor.role !== Role.SUPER_ADMIN) {
      throw new ForbiddenException('Hanya super admin yang dapat mengelola admin cabang');
    }
  }

  async list(actor: AuthUser, q: UserQuery) {
    const { page, limit, skip } = paginate({ page: q.page, limit: q.limit ?? 20 });
    const qb = this.repo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.branch', 'b')
      .leftJoin('u.parent', 'p')
      .addSelect(['p.id', 'p.name', 'p.phone'])
      .leftJoin('u.children', 'c')
      .addSelect(['c.id', 'c.name'])
      .where('u.role != :sa', { sa: Role.SUPER_ADMIN })
      .andWhere('u.organizationId = :org', { org: actor.organizationId })
      .orderBy('u.name', 'ASC')
      .skip(skip)
      .take(limit);
    // Super admin tanpa filter cabang: semua user di organisasinya (termasuk yang belum punya cabang)
    if (!(actor.role === Role.SUPER_ADMIN && !q.branchId)) qb.andWhere('u.branchId IN (:...branchIds)', { branchIds: scopeBranch(actor, q.branchId) });
    if (q.role) qb.andWhere('u.role = :role', { role: q.role });
    if (q.parentId) qb.andWhere('u.parentId = :parentId', { parentId: q.parentId });
    if (q.q) qb.andWhere('(u.name ILIKE :q OR u.email ILIKE :q OR u.phone ILIKE :q)', { q: `%${q.q}%` });
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async get(actor: AuthUser, id: string) {
    const u = await this.repo.findOne({ where: { id }, relations: { branch: true, parent: true, children: true } });
    if (!u || u.role === Role.SUPER_ADMIN || u.organizationId !== actor.organizationId) throw new NotFoundException('User tidak ditemukan');
    if (!(actor.role === Role.SUPER_ADMIN && !u.branchId)) assertBranch(actor, u.branchId);
    return u;
  }

  private async validateParent(actor: AuthUser, parentId: string | null | undefined, branchId: string) {
    if (!parentId) return;
    const parent = await this.repo.findOneBy({ id: parentId });
    if (!parent || parent.role !== Role.PARENT || parent.organizationId !== actor.organizationId) throw new BadRequestException('Orang tua tidak valid');
    if (actor.role !== Role.SUPER_ADMIN && parent.branchId !== branchId) {
      throw new BadRequestException('Orang tua harus terdaftar di cabang yang sama');
    }
  }

  async create(actor: AuthUser, dto: CreateUserDto) {
    this.assertManageable(actor, dto.role);
    const branchId = requireBranch(actor, dto.branchId);
    const email = dto.email.toLowerCase();
    if (await this.repo.exists({ where: { email, organizationId: actor.organizationId } })) throw new ConflictException('Email sudah terdaftar');
    if (dto.role === Role.STUDENT) await this.validateParent(actor, dto.parentId, branchId);
    const saved = await this.repo.save(
      this.repo.create({
        ...dto,
        email,
        organizationId: actor.organizationId,
        branchId,
        parentId: dto.role === Role.STUDENT ? dto.parentId ?? null : null,
        password: await bcrypt.hash(dto.password, 10),
      }),
    );
    return this.get(actor, saved.id);
  }

  async update(actor: AuthUser, id: string, dto: UpdateUserDto) {
    const user = await this.get(actor, id);
    this.assertManageable(actor, user.role);
    const patch: Partial<User> = clean({ ...dto, password: undefined, parent: undefined }) as Partial<User>;
    if (dto.email) {
      patch.email = dto.email.toLowerCase();
      const other = await this.repo.findOneBy({ email: patch.email, organizationId: actor.organizationId });
      if (other && other.id !== id) throw new ConflictException('Email sudah terdaftar');
    }
    if (dto.branchId) patch.branchId = requireBranch(actor, dto.branchId);
    if (dto.password) patch.password = await bcrypt.hash(dto.password, 10);
    if (dto.parentId !== undefined && user.role === Role.STUDENT) {
      await this.validateParent(actor, dto.parentId, patch.branchId ?? user.branchId!);
    }
    await this.repo.update(id, patch);
    return this.get(actor, id);
  }

  async remove(actor: AuthUser, id: string) {
    const user = await this.get(actor, id);
    this.assertManageable(actor, user.role);
    if (user.id === actor.id) throw new BadRequestException('Tidak dapat menghapus akun sendiri');
    await this.repo.delete(id);
    return { ok: true };
  }
}

@Controller('admin/users')
@Auth(...ADMIN_ROLES)
export class AdminUsersController {
  constructor(private svc: UsersService) {}
  @Get() list(@CurrentUser() u: AuthUser, @Query() q: UserQuery) {
    return this.svc.list(u, q);
  }
  @Get(':id') get(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.get(u, id);
  }
  @Post() create(@CurrentUser() u: AuthUser, @Body() dto: CreateUserDto) {
    return this.svc.create(u, dto);
  }
  @Patch(':id') update(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateUserDto) {
    return this.svc.update(u, id, dto);
  }
  @Delete(':id') remove(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(u, id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([User])],
  controllers: [AdminUsersController],
  providers: [UsersService],
})
export class UsersModule {}
