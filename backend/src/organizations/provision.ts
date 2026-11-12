import { BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { DataSource, EntityManager } from 'typeorm';
import { Branch, Organization, OrganizationDomain, Role, User } from '../entities';
import { normalizeHost } from '../common/tenant';
import { slugify } from '../common/util';

/** Slug yang dipakai platform sendiri (subdomain) */
const RESERVED_SLUGS = new Set(['www', 'app', 'api', 'admin', 'mail', 'platform', 'nofosys', 'static', 'cdn']);

export interface NewOrganization {
  slug: string;
  name: string;
  email: string;
  adminName?: string;
  password?: string;
  branchName?: string;
  city?: string | null;
  brandColor?: string;
  domain?: string;
  notes?: string | null;
}

/** Password acak 10 karakter tanpa huruf yang mirip (0/O, 1/l/I) */
export function randomPassword() {
  const abc = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789';
  return [...randomBytes(10)].map((b) => abc[b % abc.length]).join('');
}

export function validSlug(raw: string) {
  const slug = slugify(raw);
  if (slug.length < 3) throw new BadRequestException('Slug minimal 3 karakter (huruf kecil, angka, tanda -)');
  if (RESERVED_SLUGS.has(slug)) throw new BadRequestException(`Slug "${slug}" dipakai sistem, pilih yang lain`);
  return slug;
}

/** Buat lembaga baru: organisasi + cabang pertama + akun Super Admin (+ domain kustom opsional) */
export async function createOrganization(ds: DataSource, input: NewOrganization) {
  const slug = validSlug(input.slug);
  const password = input.password || randomPassword();
  return ds.transaction(async (m) => {
    if (await m.existsBy(Organization, { slug })) throw new ConflictException(`Slug "${slug}" sudah dipakai lembaga lain`);
    const org = await m.save(
      m.create(Organization, {
        slug,
        name: input.name.trim(),
        brandColor: input.brandColor || '#3d8ccf',
        email: input.email.toLowerCase(),
        notes: input.notes ?? null,
      }),
    );
    const branchName = input.branchName?.trim() || `${org.name} Pusat`;
    const branch = await m.save(m.create(Branch, { organizationId: org.id, name: branchName, slug: slugify(branchName) || 'pusat', city: input.city || null }));
    const admin = await m.save(
      m.create(User, {
        organizationId: org.id,
        name: input.adminName?.trim() || 'Super Admin',
        email: input.email.toLowerCase(),
        role: Role.SUPER_ADMIN,
        password: await bcrypt.hash(password, 10),
      }),
    );
    if (input.domain) await addDomain(m, org.id, input.domain);
    return { org, branch, admin: { id: admin.id, name: admin.name, email: admin.email }, password };
  });
}

/** Daftarkan domain kustom (mis. belajar.bimbelkamu.com) ke lembaga */
export async function addDomain(db: EntityManager | DataSource, organizationId: string, raw: string) {
  const m = db instanceof DataSource ? db.manager : db;
  const domain = normalizeHost(raw.replace(/^https?:\/\//, '').split('/')[0]);
  if (!/^([a-z0-9-]+\.)+[a-z]{2,}$/.test(domain)) throw new BadRequestException(`Domain tidak valid: ${raw}`);
  const pd = normalizeHost(process.env.PLATFORM_DOMAIN);
  if (pd && (domain === pd || domain.endsWith('.' + pd))) {
    throw new BadRequestException(`Subdomain ${pd} sudah otomatis tersedia lewat slug; isi domain milik lembaga sendiri`);
  }
  const other = await m.findOneBy(OrganizationDomain, { domain });
  if (other && other.organizationId !== organizationId) throw new ConflictException(`Domain ${domain} sudah dipakai lembaga lain`);
  return other ?? m.save(m.create(OrganizationDomain, { domain, organizationId }));
}
