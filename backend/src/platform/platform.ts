import {
  BadRequestException, Body, CanActivate, ConflictException, Controller, createParamDecorator, Delete, ExecutionContext, Get, Injectable, Module,
  NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query, Req, UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { IsBoolean, IsEmail, IsEnum, IsOptional, IsString, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { DataSource, In, Repository } from 'typeorm';
import { Branch, LeadStatus, Organization, OrganizationDomain, PlatformAdmin, PlatformLead, Role, User } from '../entities';
import { isPlatformHost, normalizeHost, orgUrls, TenantRequest, TenantService } from '../common/tenant';
import { clean } from '../common/util';
import { addDomain, createOrganization, randomPassword, validSlug } from '../organizations/provision';

// ---------------------------------------------------------------- DTO

class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}

class UpdateMeDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() currentPassword?: string;
  @IsOptional() @IsString() @MinLength(8) newPassword?: string;
}

class CreateOrgDto {
  @IsString() @MinLength(2) @MaxLength(80) name: string;
  @IsString() @Matches(/^[a-z0-9-]{3,40}$/, { message: 'Slug: 3–40 karakter huruf kecil, angka, atau tanda -' }) slug: string;
  @IsEmail() email: string;
  @IsOptional() @IsString() @MaxLength(80) adminName?: string;
  @IsOptional() @IsString() @MaxLength(80) branchName?: string;
  @IsOptional() @IsString() @MaxLength(60) city?: string;
  @IsOptional() @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'Warna harus format hex' }) brandColor?: string;
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsString() domain?: string;
  @IsOptional() @IsString() @MaxLength(2000) notes?: string;
}

class UpdateOrgDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) name?: string;
  @IsOptional() @IsString() @Matches(/^[a-z0-9-]{3,40}$/, { message: 'Slug: 3–40 karakter huruf kecil, angka, atau tanda -' }) slug?: string;
  @IsOptional() @IsBoolean() isActive?: boolean;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(2000) notes?: string | null;
}

class DomainDto {
  @IsString() @MinLength(4) domain: string;
}

class PersonDto {
  @IsString() @MinLength(2) @MaxLength(80) name: string;
  @IsEmail() email: string;
}

class ToggleDto {
  @IsBoolean() isActive: boolean;
}

/** Form "Minta demo" di website Nofosys */
class LeadDto {
  @IsString() @MinLength(2) @MaxLength(80) name: string;
  @IsString() @MinLength(2) @MaxLength(120) institution: string;
  @Matches(/^[0-9+\-\s()]{8,20}$/, { message: 'Nomor WhatsApp tidak valid' }) phone: string;
  @IsOptional() @ValidateIf((_, v) => v !== '') @IsEmail({}, { message: 'Email tidak valid' }) email?: string;
  @IsOptional() @IsString() @MaxLength(60) city?: string;
  @IsOptional() @IsString() @MaxLength(30) size?: string;
  @IsOptional() @IsString() @MaxLength(1500) message?: string;
  /** Jebakan bot — harus kosong */
  @IsOptional() @IsString() website?: string;
}

class UpdateLeadDto {
  @IsOptional() @IsEnum(LeadStatus) status?: LeadStatus;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(2000) note?: string | null;
}

// ---------------------------------------------------------------- auth

type PlatformRequest = TenantRequest & { platformAdmin?: PlatformAdmin };

/** Hanya di domain platform + token pengelola platform (bukan token akun lembaga) */
@Injectable()
export class PlatformGuard implements CanActivate {
  constructor(
    private jwt: JwtService,
    @InjectRepository(PlatformAdmin) private admins: Repository<PlatformAdmin>,
  ) {}

  async canActivate(ctx: ExecutionContext) {
    const req = ctx.switchToHttp().getRequest<PlatformRequest>();
    assertPlatformHost(req);
    const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '');
    let payload: { sub?: string; kind?: string };
    try {
      payload = await this.jwt.verifyAsync(token);
    } catch {
      throw new UnauthorizedException();
    }
    if (payload.kind !== 'platform' || !payload.sub) throw new UnauthorizedException();
    const admin = await this.admins.findOneBy({ id: payload.sub });
    if (!admin?.isActive) throw new UnauthorizedException();
    req.platformAdmin = admin;
    return true;
  }
}

function assertPlatformHost(req: TenantRequest) {
  if (!req.platform) throw new NotFoundException('Panel platform hanya tersedia di domain platform');
}

const Me = createParamDecorator((_: unknown, ctx: ExecutionContext) => ctx.switchToHttp().getRequest<PlatformRequest>().platformAdmin!);

const STAFF = [Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER, Role.FINANCE];

// ---------------------------------------------------------------- service

@Injectable()
export class PlatformService {
  constructor(
    private ds: DataSource,
    private jwt: JwtService,
    private tenants: TenantService,
    @InjectRepository(PlatformAdmin) private admins: Repository<PlatformAdmin>,
    @InjectRepository(Organization) private orgs: Repository<Organization>,
    @InjectRepository(OrganizationDomain) private domains: Repository<OrganizationDomain>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Branch) private branches: Repository<Branch>,
    @InjectRepository(PlatformLead) private leads: Repository<PlatformLead>,
  ) {}

  // ----- permintaan demo

  async submitLead(dto: LeadDto) {
    if (dto.website) return { ok: true }; // bot
    const phone = dto.phone.trim();
    // Cegah kiriman ganda dalam 10 menit
    const recent = await this.leads
      .createQueryBuilder('l')
      .where('l.phone = :phone AND l.createdAt > :since', { phone, since: new Date(Date.now() - 10 * 60_000) })
      .getExists();
    if (!recent) {
      const { website: _w, ...rest } = dto;
      await this.leads.save(this.leads.create({ ...rest, phone, email: dto.email || null, city: dto.city || null, size: dto.size || null, message: dto.message || null }));
    }
    return { ok: true };
  }

  listLeads(status?: string) {
    return this.leads.find({
      where: status && status in LeadStatus ? { status: status as LeadStatus } : {},
      order: { createdAt: 'DESC' },
      take: 200,
    });
  }

  async leadCounts() {
    const rows = await this.leads.createQueryBuilder('l').select('l.status', 'status').addSelect('COUNT(*)', 'n').groupBy('l.status').getRawMany();
    return Object.fromEntries(rows.map((r) => [r.status, Number(r.n)])) as Partial<Record<LeadStatus, number>>;
  }

  async updateLead(id: string, dto: UpdateLeadDto) {
    const r = await this.leads.update(id, clean(dto) as Partial<PlatformLead>);
    if (!r.affected) throw new NotFoundException('Permintaan tidak ditemukan');
    return this.leads.findOneBy({ id });
  }

  private present(a: PlatformAdmin) {
    return { id: a.id, name: a.name, email: a.email, isActive: a.isActive, lastLoginAt: a.lastLoginAt, createdAt: a.createdAt };
  }

  async login(dto: LoginDto) {
    const a = await this.admins.createQueryBuilder('a').addSelect('a.password').where('LOWER(a.email) = LOWER(:e)', { e: dto.email }).getOne();
    if (!a || !(await bcrypt.compare(dto.password, a.password))) throw new UnauthorizedException('Email atau password salah');
    if (!a.isActive) throw new UnauthorizedException('Akun pengelola dinonaktifkan');
    await this.admins.update(a.id, { lastLoginAt: new Date() });
    return { token: this.jwt.sign({ sub: a.id, kind: 'platform' }, { expiresIn: '12h' }), admin: this.present(a) };
  }

  async updateMe(me: PlatformAdmin, dto: UpdateMeDto) {
    const patch: Partial<PlatformAdmin> = {};
    if (dto.name) patch.name = dto.name;
    if (dto.newPassword) {
      const a = await this.admins.createQueryBuilder('a').addSelect('a.password').where('a.id = :id', { id: me.id }).getOne();
      if (!a || !dto.currentPassword || !(await bcrypt.compare(dto.currentPassword, a.password))) throw new BadRequestException('Password saat ini salah');
      patch.password = await bcrypt.hash(dto.newPassword, 10);
    }
    if (Object.keys(patch).length) await this.admins.update(me.id, patch);
    return this.present((await this.admins.findOneBy({ id: me.id }))!);
  }

  /** Jumlah cabang / pelajar aktif / staf per organisasi */
  private async counts(orgIds: string[]) {
    const empty = { branches: 0, students: 0, staff: 0, parents: 0 };
    const map = new Map<string, typeof empty>(orgIds.map((id) => [id, { ...empty }]));
    if (!orgIds.length) return map;
    const b = await this.branches
      .createQueryBuilder('b')
      .select('b.organizationId', 'org')
      .addSelect('COUNT(*)', 'n')
      .where('b.organizationId IN (:...orgIds)', { orgIds })
      .groupBy('b.organizationId')
      .getRawMany();
    b.forEach((r) => (map.get(r.org)!.branches = Number(r.n)));
    const u = await this.users
      .createQueryBuilder('u')
      .select('u.organizationId', 'org')
      .addSelect('u.role', 'role')
      .addSelect('COUNT(*)', 'n')
      .where('u.organizationId IN (:...orgIds) AND u.isActive = true', { orgIds })
      .groupBy('u.organizationId')
      .addGroupBy('u.role')
      .getRawMany();
    for (const r of u) {
      const c = map.get(r.org)!;
      if (r.role === Role.STUDENT) c.students += Number(r.n);
      else if (r.role === Role.PARENT) c.parents += Number(r.n);
      else c.staff += Number(r.n);
    }
    return map;
  }

  async stats() {
    const [orgs, active, branches, students, staff, parents] = await Promise.all([
      this.orgs.count(),
      this.orgs.countBy({ isActive: true }),
      this.branches.count(),
      this.users.countBy({ role: Role.STUDENT, isActive: true }),
      this.users.countBy({ role: In(STAFF), isActive: true }),
      this.users.countBy({ role: Role.PARENT, isActive: true }),
    ]);
    const since = new Date(Date.now() - 30 * 86400_000);
    const newOrgs = await this.orgs.createQueryBuilder('o').where('o.createdAt >= :since', { since }).getCount();
    const newLeads = await this.leads.countBy({ status: LeadStatus.BARU });
    return { orgs, active, inactive: orgs - active, branches, students, staff, parents, newOrgs, newLeads };
  }

  async list(q: { q?: string; status?: string }) {
    const qb = this.orgs.createQueryBuilder('o').leftJoinAndSelect('o.domains', 'd').orderBy('o.createdAt', 'ASC');
    if (q.q) qb.andWhere('(o.name ILIKE :q OR o.slug ILIKE :q OR o.email ILIKE :q OR d.domain ILIKE :q)', { q: `%${q.q}%` });
    if (q.status === 'aktif') qb.andWhere('o.isActive = true');
    if (q.status === 'nonaktif') qb.andWhere('o.isActive = false');
    const list = await qb.getMany();
    const counts = await this.counts(list.map((o) => o.id));
    return list.map((o) => ({
      id: o.id,
      slug: o.slug,
      name: o.name,
      logoUrl: o.logoUrl,
      brandColor: o.brandColor,
      email: o.email,
      isActive: o.isActive,
      createdAt: o.createdAt,
      domains: o.domains.map((d) => d.domain),
      urls: orgUrls(o.slug, o.domains.map((d) => d.domain)),
      ...counts.get(o.id)!,
    }));
  }

  async detail(id: string) {
    const o = await this.orgs.createQueryBuilder('o').addSelect('o.notes').leftJoinAndSelect('o.domains', 'd').where('o.id = :id', { id }).getOne();
    if (!o) throw new NotFoundException('Lembaga tidak ditemukan');
    const [branches, admins, counts] = await Promise.all([
      this.branches.find({ where: { organizationId: id }, order: { createdAt: 'ASC' }, select: ['id', 'name', 'city', 'createdAt'] }),
      this.users.find({ where: { organizationId: id, role: Role.SUPER_ADMIN }, order: { createdAt: 'ASC' }, select: ['id', 'name', 'email', 'isActive', 'createdAt'] }),
      this.counts([id]),
    ]);
    const pd = normalizeHost(process.env.PLATFORM_DOMAIN);
    return {
      ...o,
      domains: o.domains.sort((a, b) => a.domain.localeCompare(b.domain)).map((d) => ({ id: d.id, domain: d.domain, createdAt: d.createdAt })),
      urls: orgUrls(o.slug, o.domains.map((d) => d.domain)),
      /** Tujuan CNAME untuk domain kustom klien */
      cnameTarget: pd || null,
      ...counts.get(id)!,
      branches,
      admins,
    };
  }

  async create(dto: CreateOrgDto) {
    const r = await createOrganization(this.ds, { ...dto, domain: dto.domain || undefined });
    this.tenants.clear();
    return { id: r.org.id, slug: r.org.slug, email: r.admin.email, password: r.password, urls: orgUrls(r.org.slug, dto.domain ? [normalizeHost(dto.domain)] : []) };
  }

  async update(id: string, dto: UpdateOrgDto) {
    const o = await this.orgs.findOneBy({ id });
    if (!o) throw new NotFoundException('Lembaga tidak ditemukan');
    const patch = clean(dto) as Partial<Organization>;
    if (dto.slug && dto.slug !== o.slug) {
      patch.slug = validSlug(dto.slug);
      if (await this.orgs.existsBy({ slug: patch.slug })) throw new ConflictException(`Slug "${patch.slug}" sudah dipakai`);
    }
    if (dto.notes === null || dto.notes === '') patch.notes = null;
    await this.orgs.update(id, patch);
    this.tenants.clear();
    return this.detail(id);
  }

  async addDomain(id: string, domain: string) {
    if (!(await this.orgs.existsBy({ id }))) throw new NotFoundException('Lembaga tidak ditemukan');
    if (isPlatformHost(normalizeHost(domain))) throw new BadRequestException('Domain ini milik platform');
    await addDomain(this.ds, id, domain);
    this.tenants.clear();
    return this.detail(id);
  }

  async removeDomain(id: string, domainId: string) {
    const r = await this.domains.delete({ id: domainId, organizationId: id });
    if (!r.affected) throw new NotFoundException('Domain tidak ditemukan');
    this.tenants.clear();
    return this.detail(id);
  }

  /** Tambah Super Admin lembaga (mis. pemilik kedua) */
  async addOrgAdmin(id: string, dto: PersonDto) {
    if (!(await this.orgs.existsBy({ id }))) throw new NotFoundException('Lembaga tidak ditemukan');
    const email = dto.email.toLowerCase();
    if (await this.users.existsBy({ organizationId: id, email })) throw new ConflictException('Email sudah terdaftar di lembaga ini');
    const password = randomPassword();
    await this.users.save(this.users.create({ organizationId: id, name: dto.name, email, role: Role.SUPER_ADMIN, password: await bcrypt.hash(password, 10) }));
    return { email, password };
  }

  /** Reset password Super Admin lembaga (klien lupa password) */
  async resetOrgAdmin(id: string, userId: string) {
    const u = await this.users.findOneBy({ id: userId, organizationId: id, role: Role.SUPER_ADMIN });
    if (!u) throw new NotFoundException('Super Admin tidak ditemukan');
    const password = randomPassword();
    await this.users.update(u.id, { password: await bcrypt.hash(password, 10), isActive: true });
    return { email: u.email, password };
  }

  async listAdmins() {
    return (await this.admins.find({ order: { createdAt: 'ASC' } })).map((a) => this.present(a));
  }

  async addAdmin(dto: PersonDto) {
    const email = dto.email.toLowerCase();
    if (await this.admins.existsBy({ email })) throw new ConflictException('Email sudah terdaftar');
    const password = randomPassword();
    await this.admins.save(this.admins.create({ name: dto.name, email, password: await bcrypt.hash(password, 10) }));
    return { email, password };
  }

  async toggleAdmin(me: PlatformAdmin, id: string, isActive: boolean) {
    if (id === me.id && !isActive) throw new BadRequestException('Tidak dapat menonaktifkan akun sendiri');
    const r = await this.admins.update(id, { isActive });
    if (!r.affected) throw new NotFoundException('Pengelola tidak ditemukan');
    return this.listAdmins();
  }
}

// ---------------------------------------------------------------- controller

@Controller('platform')
export class PlatformAuthController {
  constructor(private svc: PlatformService) {}

  @Post('auth/login') login(@Req() req: TenantRequest, @Body() dto: LoginDto) {
    assertPlatformHost(req);
    return this.svc.login(dto);
  }

  /** Publik: form "Minta demo" di website Nofosys */
  @Post('leads') lead(@Req() req: TenantRequest, @Body() dto: LeadDto) {
    assertPlatformHost(req);
    return this.svc.submitLead(dto);
  }
}

@Controller('platform')
@UseGuards(PlatformGuard)
export class PlatformController {
  constructor(private svc: PlatformService) {}

  @Get('auth/me') me(@Me() me: PlatformAdmin) {
    return { id: me.id, name: me.name, email: me.email };
  }
  @Patch('auth/me') updateMe(@Me() me: PlatformAdmin, @Body() dto: UpdateMeDto) {
    return this.svc.updateMe(me, dto);
  }

  @Get('stats') stats() {
    return this.svc.stats();
  }

  @Get('orgs') list(@Query() q: { q?: string; status?: string }) {
    return this.svc.list(q);
  }
  @Post('orgs') create(@Body() dto: CreateOrgDto) {
    return this.svc.create(dto);
  }
  @Get('orgs/:id') detail(@Param('id', ParseUUIDPipe) id: string) {
    return this.svc.detail(id);
  }
  @Patch('orgs/:id') update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateOrgDto) {
    return this.svc.update(id, dto);
  }
  @Post('orgs/:id/domains') addDomain(@Param('id', ParseUUIDPipe) id: string, @Body() dto: DomainDto) {
    return this.svc.addDomain(id, dto.domain);
  }
  @Delete('orgs/:id/domains/:domainId') removeDomain(@Param('id', ParseUUIDPipe) id: string, @Param('domainId', ParseUUIDPipe) domainId: string) {
    return this.svc.removeDomain(id, domainId);
  }
  @Post('orgs/:id/admins') addOrgAdmin(@Param('id', ParseUUIDPipe) id: string, @Body() dto: PersonDto) {
    return this.svc.addOrgAdmin(id, dto);
  }
  @Post('orgs/:id/admins/:userId/reset-password') resetOrgAdmin(@Param('id', ParseUUIDPipe) id: string, @Param('userId', ParseUUIDPipe) userId: string) {
    return this.svc.resetOrgAdmin(id, userId);
  }

  @Get('leads') leads(@Query('status') status?: string) {
    return this.svc.listLeads(status);
  }
  @Get('leads/counts') leadCounts() {
    return this.svc.leadCounts();
  }
  @Patch('leads/:id') updateLead(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateLeadDto) {
    return this.svc.updateLead(id, dto);
  }

  @Get('admins') admins() {
    return this.svc.listAdmins();
  }
  @Post('admins') addAdmin(@Body() dto: PersonDto) {
    return this.svc.addAdmin(dto);
  }
  @Patch('admins/:id') toggleAdmin(@Me() me: PlatformAdmin, @Param('id', ParseUUIDPipe) id: string, @Body() dto: ToggleDto) {
    return this.svc.toggleAdmin(me, id, dto.isActive);
  }
}

@Module({
  imports: [
    TypeOrmModule.forFeature([PlatformAdmin, PlatformLead, Organization, OrganizationDomain, User, Branch]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (c: ConfigService) => ({ secret: c.get<string>('JWT_SECRET') || 'dev-secret' }),
    }),
  ],
  controllers: [PlatformAuthController, PlatformController],
  providers: [PlatformService, PlatformGuard],
})
export class PlatformModule {}
