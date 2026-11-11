/**
 * Kelola lembaga (klien) Nofosys dari terminal server. Hal yang sama bisa dilakukan lewat panel /platform.
 *
 *   node dist/org.js daftar
 *   node dist/org.js tambah --slug kursus-budi --nama "Kursus Budi" --email superadmin@kursusbudi.com \
 *        [--cabang "Kursus Budi Pusat"] [--kota Depok] [--warna "#16a34a"] [--domain belajar.kursusbudi.com]
 *   node dist/org.js domain-tambah --slug kursus-budi --domain belajar.kursusbudi.com
 *   node dist/org.js domain-hapus  --domain belajar.kursusbudi.com
 *   node dist/org.js nonaktif --slug kursus-budi      (website & login ditutup)
 *   node dist/org.js pengelola --email anda@nofosys.id [--nama "Nama"] [--password ...]
 *        (buat akun pengelola platform / reset password-nya — untuk panel /platform)
 *   node dist/org.js aktif    --slug kursus-budi
 *
 * Saat pengembangan: npx ts-node src/org.ts <perintah> ...
 * Catatan: API menyimpan cache domain 1 menit — perubahan domain/status berlaku paling lambat 1 menit.
 */
import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import { Branch, Organization, OrganizationDomain, PlatformAdmin, User } from './entities';
import { normalizeHost, orgUrls } from './common/tenant';
import { addDomain, createOrganization, randomPassword } from './organizations/provision';
import { dataSourceOptions } from './data-source';

const ds = new DataSource(dataSourceOptions);
const [cmd, ...rest] = process.argv.slice(2);
const arg = (name: string) => {
  const i = rest.indexOf(`--${name}`);
  return i >= 0 ? rest[i + 1] : undefined;
};
const need = (name: string) => {
  const v = arg(name);
  if (!v) throw new Error(`Parameter --${name} wajib diisi`);
  return v;
};

async function findOrg(slug: string) {
  const org = await ds.getRepository(Organization).findOneBy({ slug });
  if (!org) throw new Error(`Organisasi "${slug}" tidak ditemukan`);
  return org;
}

async function main() {
  await ds.initialize();
  if (!dataSourceOptions.synchronize) await ds.runMigrations();
  const orgs = ds.getRepository(Organization);

  switch (cmd) {
    case 'daftar': {
      const list = await orgs.find({ relations: { domains: true }, order: { createdAt: 'ASC' } });
      for (const o of list) {
        const [b, u] = await Promise.all([
          ds.getRepository(Branch).countBy({ organizationId: o.id }),
          ds.getRepository(User).countBy({ organizationId: o.id }),
        ]);
        const hosts = orgUrls(o.slug, o.domains.map((d) => d.domain));
        console.log(`${o.isActive ? '●' : '○'} ${o.slug.padEnd(22)} ${o.name.padEnd(26)} ${b} cabang, ${u} akun  ${hosts.join(', ')}`);
      }
      break;
    }
    case 'tambah': {
      const color = arg('warna');
      if (color && !/^#[0-9a-fA-F]{6}$/.test(color)) throw new Error('Warna harus format hex, mis. #16a34a');
      const r = await createOrganization(ds, {
        slug: need('slug'),
        name: need('nama'),
        email: need('email'),
        password: arg('password'),
        branchName: arg('cabang'),
        city: arg('kota'),
        brandColor: color,
        domain: arg('domain'),
      });
      console.log(`\nLembaga "${r.org.name}" dibuat.`);
      console.log(`  Alamat      : ${orgUrls(r.org.slug, arg('domain') ? [arg('domain')!] : []).join('  ')}`);
      console.log(`  Super Admin : ${r.admin.email}`);
      console.log(`  Password    : ${r.password}   (minta klien menggantinya lewat Profil Saya)`);
      console.log('  Lanjutkan   : login sebagai Super Admin → menu Identitas Lembaga (logo, warna, foto, kontak).');
      break;
    }
    case 'pengelola': {
      // Akun pengelola platform (panel https://PLATFORM_DOMAIN/platform)
      const email = need('email').toLowerCase();
      const password = arg('password') || randomPassword();
      const repo = ds.getRepository(PlatformAdmin);
      const existing = await repo.findOneBy({ email });
      if (existing) await repo.update(existing.id, { password: await bcrypt.hash(password, 10), isActive: true });
      else await repo.save(repo.create({ email, name: arg('nama') || 'Pengelola', password: await bcrypt.hash(password, 10) }));
      console.log(`Pengelola platform ${existing ? 'diperbarui' : 'dibuat'}: ${email}  password: ${password}`);
      break;
    }
    case 'domain-tambah': {
      const org = await findOrg(need('slug'));
      const d = await addDomain(ds, org.id, need('domain'));
      console.log(`Domain ${d.domain} → ${org.name}`);
      break;
    }
    case 'domain-hapus': {
      const r = await ds.getRepository(OrganizationDomain).delete({ domain: normalizeHost(need('domain')) });
      console.log(r.affected ? 'Domain dihapus.' : 'Domain tidak ditemukan.');
      break;
    }
    case 'aktif':
    case 'nonaktif': {
      const org = await findOrg(need('slug'));
      await orgs.update(org.id, { isActive: cmd === 'aktif' });
      console.log(`${org.name} sekarang ${cmd === 'aktif' ? 'AKTIF' : 'NONAKTIF'}.`);
      break;
    }
    default:
      console.log('Perintah: daftar | tambah | domain-tambah | domain-hapus | aktif | nonaktif | pengelola  (lihat keterangan di src/org.ts)');
  }
  await ds.destroy();
}

main().catch(async (e) => {
  console.error('Gagal:', e.message);
  await ds.destroy().catch(() => undefined);
  process.exit(1);
});
