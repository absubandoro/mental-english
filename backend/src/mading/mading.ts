import {
  Body, Controller, Delete, ForbiddenException, Get, Injectable, Module, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';
import { Repository } from 'typeorm';
import { Mading, Organization, Role, User } from '../entities';
import { MediaField, MediaDto } from '../common/media';
import { ADMIN_ROLES, assertBranch, Auth, AuthUser, CurrentUser, scopeBranch } from '../common/auth';
import { CurrentOrg } from '../common/tenant';
import { clean, paginate } from '../common/util';

export class MadingDto {
  @IsString() @MinLength(3) title: string;
  @IsString() content: string;
  @IsOptional() @IsString() imageUrl?: string;
  @IsOptional() @IsString() category?: string;
  @MediaField() media?: MediaDto[];
}

export class MadingModerationDto {
  @IsBoolean() published: boolean;
}

export interface MadingQuery {
  page?: string;
  limit?: string;
  q?: string;
  branchId?: string;
  category?: string;
}

@Injectable()
export class MadingService {
  constructor(
    @InjectRepository(Mading) private repo: Repository<Mading>,
    @InjectRepository(User) private users: Repository<User>,
  ) {}

  async list(query: MadingQuery, opts: { publishedOnly?: boolean; orgId?: string; branchIds?: string[]; authorId?: string } = {}) {
    const { page, limit, skip } = paginate(query);
    const qb = this.repo
      .createQueryBuilder('m')
      .leftJoin('m.author', 'a')
      .addSelect(['a.id', 'a.name', 'a.avatarUrl'])
      .leftJoinAndSelect('m.branch', 'b')
      .orderBy('m.createdAt', 'DESC')
      .skip(skip)
      .take(limit);
    if (opts.publishedOnly) qb.andWhere('m.published = true');
    if (opts.orgId) qb.andWhere('b.organizationId = :org', { org: opts.orgId });
    if (opts.branchIds) qb.andWhere('m.branchId IN (:...branchIds)', { branchIds: opts.branchIds });
    else if (query.branchId) qb.andWhere('m.branchId = :branchId', { branchId: query.branchId });
    if (opts.authorId) qb.andWhere('m.authorId = :authorId', { authorId: opts.authorId });
    if (query.category) qb.andWhere('m.category = :category', { category: query.category });
    if (query.q) qb.andWhere('(m.title ILIKE :q OR a.name ILIKE :q)', { q: `%${query.q}%` });
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async get(id: string, publishedOnly = false, orgId?: string) {
    const qb = this.repo
      .createQueryBuilder('m')
      .leftJoin('m.author', 'a')
      .addSelect(['a.id', 'a.name', 'a.avatarUrl'])
      .leftJoinAndSelect('m.branch', 'b')
      .where('m.id = :id', { id });
    if (publishedOnly) qb.andWhere('m.published = true');
    if (orgId) qb.andWhere('b.organizationId = :org', { org: orgId });
    const m = await qb.getOne();
    if (!m) throw new NotFoundException('Mading tidak ditemukan');
    return m;
  }

  async create(user: AuthUser, dto: MadingDto) {
    const author = await this.users.findOneBy({ id: user.id });
    if (!author?.branchId) throw new ForbiddenException('Akun belum terhubung ke cabang');
    return this.repo.save(this.repo.create({ ...dto, authorId: user.id, branchId: author.branchId }));
  }

  private async own(user: AuthUser, id: string) {
    const m = await this.get(id);
    if (m.authorId !== user.id) throw new ForbiddenException('Bukan mading milik Anda');
    return m;
  }

  async update(user: AuthUser, id: string, dto: Partial<MadingDto>) {
    await this.own(user, id);
    await this.repo.update(id, clean(dto));
    return this.get(id);
  }

  async remove(user: AuthUser, id: string) {
    const m = await this.get(id);
    if (ADMIN_ROLES.includes(user.role)) assertBranch(user, m.branchId);
    else if (m.authorId !== user.id) throw new ForbiddenException('Bukan mading milik Anda');
    await this.repo.delete(id);
    return { ok: true };
  }

  async moderate(user: AuthUser, id: string, published: boolean) {
    const m = await this.get(id);
    assertBranch(user, m.branchId);
    await this.repo.update(id, { published });
    return this.get(id);
  }
}

/** Publik */
@Controller('mading')
export class MadingController {
  constructor(private svc: MadingService) {}
  @Get() list(@CurrentOrg() org: Organization, @Query() q: MadingQuery) {
    return this.svc.list(q, { publishedOnly: true, orgId: org.id });
  }
  @Get(':id') get(@CurrentOrg() org: Organization, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.get(id, true, org.id);
  }
}

/** Halaman mading pelajar */
@Controller('student/mading')
@Auth(Role.STUDENT)
export class StudentMadingController {
  constructor(private svc: MadingService) {}
  @Get() list(@CurrentUser() u: AuthUser, @Query() q: MadingQuery) {
    return this.svc.list(q, { authorId: u.id });
  }
  @Post() create(@CurrentUser() u: AuthUser, @Body() dto: MadingDto) {
    return this.svc.create(u, dto);
  }
  @Patch(':id') update(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: MadingDto) {
    return this.svc.update(u, id, dto);
  }
  @Delete(':id') remove(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(u, id);
  }
}

/** Moderasi mading oleh admin cabang */
@Controller('admin/mading')
@Auth(...ADMIN_ROLES)
export class AdminMadingController {
  constructor(private svc: MadingService) {}
  @Get() list(@CurrentUser() u: AuthUser, @Query() q: MadingQuery) {
    return this.svc.list(q, { orgId: u.organizationId, branchIds: scopeBranch(u, q.branchId) });
  }
  @Patch(':id') moderate(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: MadingModerationDto) {
    return this.svc.moderate(u, id, dto.published);
  }
  @Delete(':id') remove(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(u, id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Mading, User])],
  controllers: [MadingController, StudentMadingController, AdminMadingController],
  providers: [MadingService],
  exports: [MadingService],
})
export class MadingModule {}
