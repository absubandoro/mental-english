import { Body, Controller, Get, Injectable, Module, NotFoundException, Patch } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Type } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf, ValidateNested } from 'class-validator';
import { Repository } from 'typeorm';
import { Organization, Role } from '../entities';
import { Auth, AuthUser, CurrentUser } from '../common/auth';
import { CurrentOrg, TenantService } from '../common/tenant';
import { clean } from '../common/util';

class PhotosDto {
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() welcome?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() holiday?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() team?: string | null;
}

const opt = () => ValidateIf((_, v) => v !== null && v !== '');

/** Identitas lembaga yang bisa diubah Super Admin */
export class UpdateOrganizationDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) name?: string;
  @IsOptional() @opt() @IsString() @MaxLength(120) tagline?: string | null;
  @IsOptional() @opt() @IsString() @MaxLength(600) description?: string | null;
  @IsOptional() @opt() @IsString() logoUrl?: string | null;
  @IsOptional() @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'Warna harus format hex, mis. #3d8ccf' }) brandColor?: string;
  @IsOptional() @ValidateNested() @Type(() => PhotosDto) photos?: PhotosDto;
  @IsOptional() @opt() @Matches(/^[0-9+\-\s()]{8,20}$/, { message: 'Nomor WhatsApp tidak valid' }) whatsapp?: string | null;
  @IsOptional() @opt() @IsEmail() email?: string | null;
  @IsOptional() @opt() @IsString() @MaxLength(60) instagram?: string | null;
  @IsOptional() @opt() @IsString() @MaxLength(200) website?: string | null;
}

/** Data publik (branding) — aman ditampilkan ke siapa saja */
export function publicOrg(o: Organization) {
  return {
    id: o.id,
    slug: o.slug,
    name: o.name,
    tagline: o.tagline,
    description: o.description,
    logoUrl: o.logoUrl,
    brandColor: o.brandColor,
    photos: o.photos ?? {},
    whatsapp: o.whatsapp,
    email: o.email,
    instagram: o.instagram,
    website: o.website,
  };
}

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization) private repo: Repository<Organization>,
    private tenants: TenantService,
  ) {}

  async update(orgId: string, dto: UpdateOrganizationDto) {
    const org = await this.repo.findOneBy({ id: orgId });
    if (!org) throw new NotFoundException('Lembaga tidak ditemukan');
    const { photos, ...rest } = dto;
    const patch = clean(rest) as Partial<Organization>;
    for (const k of Object.keys(patch) as (keyof Organization)[]) if ((patch as Record<string, unknown>)[k] === '') (patch as Record<string, unknown>)[k] = null;
    if (photos) patch.photos = { ...(org.photos ?? {}), ...clean(photos) };
    await this.repo.update(orgId, patch);
    this.tenants.clear();
    return publicOrg((await this.repo.findOneBy({ id: orgId }))!);
  }
}

@Controller('org')
export class OrganizationsController {
  constructor(private svc: OrganizationsService) {}

  /** Publik: identitas lembaga dari domain yang dibuka (nama, logo, warna, foto, kontak) */
  @Get() current(@CurrentOrg() org: Organization) {
    return publicOrg(org);
  }

  @Patch() @Auth(Role.SUPER_ADMIN) update(@CurrentUser() u: AuthUser, @Body() dto: UpdateOrganizationDto) {
    return this.svc.update(u.organizationId, dto);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Organization])],
  controllers: [OrganizationsController],
  providers: [OrganizationsService],
})
export class OrganizationsModule {}
