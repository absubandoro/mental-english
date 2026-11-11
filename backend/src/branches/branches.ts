import { Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { Repository } from 'typeorm';
import { Branch, Organization, Role } from '../entities';
import { Auth, AuthUser, CurrentUser } from '../common/auth';
import { CurrentOrg } from '../common/tenant';
import { clean, slugify } from '../common/util';

export class BranchDto {
  @IsString() @MinLength(2) name: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() openHours?: string;
  @IsOptional() @IsString() mapQuery?: string;
}

@Injectable()
export class BranchesService {
  constructor(@InjectRepository(Branch) private repo: Repository<Branch>) {}

  list(orgId: string) {
    return this.repo.find({ where: { organizationId: orgId }, order: { createdAt: 'ASC', name: 'ASC' } });
  }

  async get(orgId: string, id: string) {
    const b = await this.repo.findOneBy({ id, organizationId: orgId });
    if (!b) throw new NotFoundException('Cabang tidak ditemukan');
    return b;
  }

  private async uniqueSlug(orgId: string, name: string, exceptId?: string) {
    const base = slugify(name) || 'cabang';
    let slug = base;
    for (let i = 2; ; i++) {
      const other = await this.repo.findOneBy({ organizationId: orgId, slug });
      if (!other || other.id === exceptId) return slug;
      slug = `${base}-${i}`;
    }
  }

  async create(orgId: string, dto: BranchDto) {
    return this.repo.save(this.repo.create({ ...dto, organizationId: orgId, slug: await this.uniqueSlug(orgId, dto.name) }));
  }

  async update(orgId: string, id: string, dto: Partial<BranchDto>) {
    await this.get(orgId, id);
    await this.repo.update(id, { ...clean(dto), ...(dto.name ? { slug: await this.uniqueSlug(orgId, dto.name, id) } : {}) });
    return this.get(orgId, id);
  }

  async remove(orgId: string, id: string) {
    await this.repo.delete(await this.get(orgId, id).then((b) => b.id));
    return { ok: true };
  }
}

@Controller('branches')
export class BranchesController {
  constructor(private svc: BranchesService) {}

  /** Publik: cabang milik lembaga dari domain yang dibuka */
  @Get() list(@CurrentOrg() org: Organization) {
    return this.svc.list(org.id);
  }

  @Get(':id') get(@CurrentOrg() org: Organization, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.get(org.id, id);
  }

  @Post() @Auth(Role.SUPER_ADMIN) create(@CurrentUser() u: AuthUser, @Body() dto: BranchDto) {
    return this.svc.create(u.organizationId, dto);
  }

  @Patch(':id') @Auth(Role.SUPER_ADMIN) update(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: BranchDto) {
    return this.svc.update(u.organizationId, id, dto);
  }

  @Delete(':id') @Auth(Role.SUPER_ADMIN) remove(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(u.organizationId, id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Branch])],
  controllers: [BranchesController],
  providers: [BranchesService],
})
export class BranchesModule {}
