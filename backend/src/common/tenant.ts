import {
  createParamDecorator, ExecutionContext, ForbiddenException, Global, Injectable, Module, NestMiddleware, NotFoundException,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import type { NextFunction, Request, Response } from 'express';
import { Repository } from 'typeorm';
import { Organization, OrganizationDomain } from '../entities';

/** Subdomain di domain platform yang tidak dipakai sebagai slug organisasi */
const RESERVED = new Set(['www', 'app', 'api', 'admin', 'mail', 'platform']);
const TTL_MS = 60_000;

export function normalizeHost(raw: string | undefined | null): string {
  return (raw || '').split(',')[0].trim().toLowerCase().replace(/:\d+$/, '').replace(/\.$/, '');
}

/** Host yang dibuka pengunjung. Website mengirim X-Tenant-Host; Nginx meneruskan Host asli. */
export function requestHost(req: Request): string {
  return normalizeHost((req.headers['x-tenant-host'] as string) || (req.headers['x-forwarded-host'] as string) || req.headers.host);
}

export type TenantRequest = Request & { org?: Organization | null; platform?: boolean };

export const PLATFORM_NAME = process.env.PLATFORM_NAME || 'Nofosys';

/**
 * Domain platform Nofosys sendiri (website produk + panel pengelola), bukan milik lembaga mana pun:
 * PLATFORM_DOMAIN, www.PLATFORM_DOMAIN, platform.PLATFORM_DOMAIN, dan platform.localhost (lokal).
 */
export function isPlatformHost(host: string): boolean {
  const pd = normalizeHost(process.env.PLATFORM_DOMAIN);
  if (host === 'platform.localhost') return true;
  return !!pd && (host === pd || host === `www.${pd}` || host === `platform.${pd}`);
}

/** Alamat website lembaga: subdomain platform (atau <slug>.localhost saat lokal) + domain kustom */
export function orgUrls(slug: string, domains: string[] = []): string[] {
  const pd = normalizeHost(process.env.PLATFORM_DOMAIN);
  return [pd ? `https://${slug}.${pd}` : `http://${slug}.localhost:3000`, ...domains.map((d) => (pd ? `https://${d}` : `http://${d}`))];
}

/**
 * Menentukan organisasi (klien) dari domain:
 * 1. <slug>.PLATFORM_DOMAIN  (mis. bimbel-kamu.nofosys.id)
 * 2. <slug>.localhost        (pengembangan lokal)
 * 3. domain kustom terdaftar (organization_domains)
 * 4. DEFAULT_ORG (slug) — untuk instalasi satu lembaga / localhost
 */
@Injectable()
export class TenantService {
  private cache = new Map<string, { org: Organization | null; at: number }>();

  constructor(
    @InjectRepository(Organization) private orgs: Repository<Organization>,
    @InjectRepository(OrganizationDomain) private domains: Repository<OrganizationDomain>,
  ) {}

  /** Slug dari host, bila host berupa subdomain platform / localhost */
  slugFromHost(host: string): string | null {
    const platform = normalizeHost(process.env.PLATFORM_DOMAIN);
    for (const base of [platform, 'localhost'].filter(Boolean)) {
      if (host.endsWith('.' + base)) {
        const sub = host.slice(0, -(base.length + 1));
        if (sub && !sub.includes('.') && !RESERVED.has(sub)) return sub;
      }
    }
    return null;
  }

  async resolve(host: string): Promise<Organization | null> {
    const hit = this.cache.get(host);
    if (hit && Date.now() - hit.at < TTL_MS) return hit.org;
    let org: Organization | null = null;
    const slug = this.slugFromHost(host);
    if (slug) org = await this.orgs.findOneBy({ slug });
    if (!org && host) {
      const d = await this.domains.findOne({ where: { domain: host }, relations: { organization: true } });
      org = d?.organization ?? null;
    }
    if (!org && process.env.DEFAULT_ORG) org = await this.orgs.findOneBy({ slug: process.env.DEFAULT_ORG });
    this.cache.set(host, { org, at: Date.now() });
    return org;
  }

  /** Panggil setelah data organisasi / domain berubah */
  clear() {
    this.cache.clear();
  }
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private tenants: TenantService) {}
  async use(req: TenantRequest, _res: Response, next: NextFunction) {
    try {
      const host = requestHost(req);
      req.platform = isPlatformHost(host);
      req.org = req.platform ? null : await this.tenants.resolve(host);
      next();
    } catch (e) {
      next(e);
    }
  }
}

/** Organisasi dari domain yang sedang dibuka. Error 404 bila domain tidak dikenal. */
export function orgOf(req: TenantRequest): Organization {
  const org = req.org;
  if (!org) throw new NotFoundException('Lembaga tidak ditemukan untuk domain ini');
  if (!org.isActive) throw new ForbiddenException('Layanan lembaga ini sedang tidak aktif');
  return org;
}

export const CurrentOrg = createParamDecorator((_: unknown, ctx: ExecutionContext): Organization => orgOf(ctx.switchToHttp().getRequest()));

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrganizationDomain])],
  providers: [TenantService, TenantMiddleware],
  exports: [TenantService, TenantMiddleware],
})
export class TenantModule {}
