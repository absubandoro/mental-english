import {
  Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsBoolean, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { Repository } from 'typeorm';
import { Post as PostEntity, PostType } from '../entities';
import { ADMIN_ROLES, assertBranch, Auth, AuthUser, CurrentUser, requireBranch, scopeBranch } from '../common/auth';
import { clean, paginate, randomSuffix, slugify } from '../common/util';

export class PostDto {
  @IsString() @MinLength(3) title: string;
  @IsString() content: string;
  @IsOptional() @IsEnum(PostType) type?: PostType;
  @IsOptional() @IsString() excerpt?: string;
  @IsOptional() @IsString() coverUrl?: string;
  @IsOptional() @IsString() videoUrl?: string;
  @IsOptional() @IsBoolean() published?: boolean;
  @IsOptional() @IsUUID() branchId?: string;
}

export interface PostQuery {
  page?: string;
  limit?: string;
  q?: string;
  branchId?: string;
  type?: PostType;
}

@Injectable()
export class PostsService {
  constructor(@InjectRepository(PostEntity) private repo: Repository<PostEntity>) {}

  async list(query: PostQuery, opts: { publishedOnly: boolean; branchId?: string }) {
    const { page, limit, skip } = paginate(query);
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoin('p.author', 'a')
      .addSelect(['a.id', 'a.name', 'a.avatarUrl'])
      .leftJoinAndSelect('p.branch', 'b')
      .orderBy('p.createdAt', 'DESC')
      .skip(skip)
      .take(limit);
    if (opts.publishedOnly) qb.andWhere('p.published = true');
    const branchId = opts.branchId ?? query.branchId;
    if (branchId) qb.andWhere('p.branchId = :branchId', { branchId });
    if (query.type) qb.andWhere('p.type = :type', { type: query.type });
    if (query.q) qb.andWhere('(p.title ILIKE :q OR a.name ILIKE :q)', { q: `%${query.q}%` });
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async bySlug(slug: string) {
    const post = await this.repo
      .createQueryBuilder('p')
      .leftJoin('p.author', 'a')
      .addSelect(['a.id', 'a.name', 'a.avatarUrl'])
      .leftJoinAndSelect('p.branch', 'b')
      .where('p.slug = :slug AND p.published = true', { slug })
      .getOne();
    if (!post) throw new NotFoundException('Artikel tidak ditemukan');
    return post;
  }

  async get(id: string) {
    const post = await this.repo.findOne({ where: { id }, relations: { branch: true } });
    if (!post) throw new NotFoundException('Artikel tidak ditemukan');
    return post;
  }

  async create(user: AuthUser, dto: PostDto) {
    const branchId = requireBranch(user, dto.branchId);
    return this.repo.save(
      this.repo.create({ ...dto, branchId, authorId: user.id, slug: `${slugify(dto.title)}-${randomSuffix()}` }),
    );
  }

  async update(user: AuthUser, id: string, dto: Partial<PostDto>) {
    const post = await this.get(id);
    assertBranch(user, post.branchId);
    const patch = clean(dto);
    if (patch.branchId) patch.branchId = requireBranch(user, patch.branchId);
    await this.repo.update(id, patch);
    return this.get(id);
  }

  async remove(user: AuthUser, id: string) {
    const post = await this.get(id);
    assertBranch(user, post.branchId);
    await this.repo.delete(id);
    return { ok: true };
  }
}

/** Publik: daftar & detail blog/vlog, bisa filter cabang + cari judul/author */
@Controller('posts')
export class PostsController {
  constructor(private svc: PostsService) {}
  @Get() list(@Query() q: PostQuery) {
    return this.svc.list(q, { publishedOnly: true });
  }
  @Get(':slug') get(@Param('slug') slug: string) {
    return this.svc.bySlug(slug);
  }
}

@Controller('admin/posts')
@Auth(...ADMIN_ROLES)
export class AdminPostsController {
  constructor(private svc: PostsService) {}
  @Get() list(@CurrentUser() u: AuthUser, @Query() q: PostQuery) {
    return this.svc.list(q, { publishedOnly: false, branchId: scopeBranch(u, q.branchId) });
  }
  @Get(':id') get(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.get(id).then((p) => (assertBranch(u, p.branchId), p));
  }
  @Post() create(@CurrentUser() u: AuthUser, @Body() dto: PostDto) {
    return this.svc.create(u, dto);
  }
  @Patch(':id') update(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: PostDto) {
    return this.svc.update(u, id, dto);
  }
  @Delete(':id') remove(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(u, id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([PostEntity])],
  controllers: [PostsController, AdminPostsController],
  providers: [PostsService],
})
export class PostsModule {}
