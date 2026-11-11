'use client';

import { ArrowLeft, ExternalLink, Globe, KeyRound, Plus, Power, Save, Trash2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { use, useEffect, useState } from 'react';
import { Badge, Button, ErrorBox, Field, Modal, Spinner } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { papi, usePlatformApi, type OrgDetail } from '@/lib/platform';
import { CopyButton, Credentials, OrgAvatar, StatusBadge } from '../../parts';
import { slugify } from '../../slug';

export default function PlatformOrgDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: o, loading, error, setData } = usePlatformApi<OrgDetail>(`/orgs/${id}`);
  const [form, setForm] = useState({ name: '', slug: '', notes: '' });
  const [domain, setDomain] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [creds, setCreds] = useState<{ title: string; email: string; password: string } | null>(null);
  const [adding, setAdding] = useState(false);
  const [person, setPerson] = useState({ name: '', email: '' });

  useEffect(() => {
    if (o) setForm({ name: o.name, slug: o.slug, notes: o.notes ?? '' });
  }, [o]);

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setErr(null);
    try {
      await fn();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (loading && !o) return <Spinner />;
  if (!o) return <ErrorBox message={error || 'Lembaga tidak ditemukan'} />;
  const main = o.urls[o.urls.length - 1];

  return (
    <>
      <Link href="/platform/lembaga" className="mb-4 inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="size-4" /> Semua lembaga
      </Link>

      <div className="card flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
        <OrgAvatar o={o} size={64} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">{o.name}</h1>
            <StatusBadge active={o.isActive} />
          </div>
          <p className="mt-1 text-sm text-slate-400">
            {o.tagline || 'Belum mengisi tagline'} · terdaftar {formatDate(o.createdAt)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={main} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-100 hover:bg-white/10">
            Buka website <ExternalLink className="size-4" />
          </a>
          <Button
            variant={o.isActive ? 'danger' : 'primary'}
            loading={busy === 'toggle'}
            onClick={() => {
              if (o.isActive && !window.confirm(`Nonaktifkan ${o.name}? Website & login lembaga ini akan ditutup sampai diaktifkan lagi.`)) return;
              run('toggle', async () => setData(await papi<OrgDetail>(`/orgs/${id}`, { method: 'PATCH', body: { isActive: !o.isActive } })));
            }}
          >
            <Power className="size-4" /> {o.isActive ? 'Nonaktifkan' : 'Aktifkan'}
          </Button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          ['Cabang', o.branches.length],
          ['Pelajar aktif', o.students],
          ['Orang tua', o.parents],
          ['Staf', o.staff],
        ].map(([k, v]) => (
          <div key={k} className="card p-4">
            <div className="text-xs tracking-wider text-slate-400 uppercase">{k}</div>
            <div className="mt-1 font-display text-2xl font-bold text-white">{v}</div>
          </div>
        ))}
      </div>

      <div className="mt-4">
        <ErrorBox message={err} />
      </div>

      <div className="mt-4 grid gap-4 xl:grid-cols-2">
        {/* Alamat & domain */}
        <section className="card space-y-4 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-white">
            <Globe className="size-5 text-brand-300" /> Alamat website
          </h2>
          <ul className="space-y-2">
            {o.urls.map((u, i) => {
              const d = i > 0 ? o.domains[i - 1] : null;
              return (
                <li key={u} className="flex items-center gap-2 rounded-xl bg-white/[0.03] px-3 py-2">
                  <a href={u} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate font-mono text-sm text-brand-200 hover:underline">
                    {u.replace(/^https?:\/\//, '')}
                  </a>
                  <Badge tone={d ? 'navy' : 'slate'}>{d ? 'Domain sendiri' : 'Subdomain'}</Badge>
                  {d && (
                    <button
                      className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
                      aria-label={`Hapus ${d.domain}`}
                      onClick={() =>
                        window.confirm(`Hapus domain ${d.domain}?`) &&
                        run('dom', async () => setData(await papi<OrgDetail>(`/orgs/${id}/domains/${d.id}`, { method: 'DELETE' })))
                      }
                    >
                      <Trash2 className="size-4" />
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              run('dom', async () => {
                setData(await papi<OrgDetail>(`/orgs/${id}/domains`, { method: 'POST', body: { domain } }));
                setDomain('');
              });
            }}
          >
            <input className="input font-mono" placeholder="belajar.namalembaga.com" value={domain} onChange={(e) => setDomain(e.target.value)} required />
            <Button type="submit" loading={busy === 'dom'}>
              <Plus className="size-4" /> Tambah
            </Button>
          </form>
          <div className="rounded-xl bg-amber-500/5 p-4 text-sm text-slate-300 ring-1 ring-amber-400/20">
            <p className="font-medium text-amber-200">Agar domain sendiri aktif:</p>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>
                Klien menambahkan record DNS{' '}
                <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">CNAME → {o.cnameTarget || 'domain platform'}</code> (atau A → IP server).
              </li>
              <li>Tambahkan domain di server_name Nginx, lalu terbitkan HTTPS: <code className="rounded bg-white/10 px-1.5 py-0.5 text-xs">sudo certbot --nginx -d DOMAIN</code></li>
            </ol>
          </div>
        </section>

        {/* Pengaturan */}
        <section className="card space-y-4 p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-white">Pengaturan</h2>
          <Field label="Nama lembaga">
            <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </Field>
          <Field label="Slug (subdomain)" hint={form.slug !== o.slug ? '⚠️ Mengubah slug mengganti alamat subdomain; alamat lama tidak berlaku lagi.' : undefined}>
            <input className="input font-mono" value={form.slug} onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })} />
          </Field>
          <Field label="Catatan internal" hint="Hanya terlihat oleh pengelola platform">
            <textarea className="input min-h-28" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Paket, kontak PIC, tanggal trial / tagihan, dll." />
          </Field>
          <Button
            loading={busy === 'save'}
            onClick={() => run('save', async () => setData(await papi<OrgDetail>(`/orgs/${id}`, { method: 'PATCH', body: { ...form, notes: form.notes || null } })))}
          >
            <Save className="size-4" /> Simpan
          </Button>
          <p className="text-xs text-slate-500">Logo, warna, foto, dan kontak diatur sendiri oleh Super Admin lembaga di menu Identitas Lembaga.</p>
        </section>

        {/* Super admin */}
        <section className="card space-y-4 p-5 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-display text-lg font-bold text-white">Super Admin lembaga</h2>
            <Button variant="secondary" size="sm" onClick={() => (setPerson({ name: '', email: '' }), setAdding(true))}>
              <UserPlus className="size-3.5" /> Tambah
            </Button>
          </div>
          <ul className="divide-y divide-white/5">
            {o.admins.map((a) => (
              <li key={a.id} className="flex items-center gap-3 py-3">
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-white">{a.name}</div>
                  <div className="truncate text-xs text-slate-400">{a.email}</div>
                </div>
                <CopyButton text={a.email} label="Email" />
                <Button
                  variant="secondary"
                  size="sm"
                  loading={busy === a.id}
                  onClick={() =>
                    window.confirm(`Buat password baru untuk ${a.email}? Password lama tidak berlaku lagi.`) &&
                    run(a.id, async () => {
                      const r = await papi<{ email: string; password: string }>(`/orgs/${id}/admins/${a.id}/reset-password`, { method: 'POST' });
                      setCreds({ title: `Password baru untuk ${a.name}.`, ...r });
                    })
                  }
                >
                  <KeyRound className="size-3.5" /> Reset password
                </Button>
              </li>
            ))}
          </ul>
        </section>

        {/* Cabang */}
        <section className="card space-y-3 p-5 sm:p-6">
          <h2 className="font-display text-lg font-bold text-white">Cabang</h2>
          <ul className="divide-y divide-white/5">
            {o.branches.map((b) => (
              <li key={b.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="text-white">{b.name}</span>
                <span className="text-slate-400">{b.city || '—'}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-slate-500">Cabang dikelola oleh Super Admin lembaga.</p>
        </section>
      </div>

      <Modal open={!!creds} onClose={() => setCreds(null)} title="Password baru">
        {creds && <Credentials title={creds.title} url={main} email={creds.email} password={creds.password} />}
      </Modal>
      <Modal open={adding} onClose={() => setAdding(false)} title="Tambah Super Admin">
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            run('add', async () => {
              const r = await papi<{ email: string; password: string }>(`/orgs/${id}/admins`, { method: 'POST', body: person });
              setAdding(false);
              setCreds({ title: `Akun Super Admin untuk ${person.name} dibuat.`, ...r });
              setData(await papi<OrgDetail>(`/orgs/${id}`));
            });
          }}
        >
          <Field label="Nama">
            <input className="input" required minLength={2} value={person.name} onChange={(e) => setPerson({ ...person, name: e.target.value })} />
          </Field>
          <Field label="Email">
            <input className="input" type="email" required value={person.email} onChange={(e) => setPerson({ ...person, email: e.target.value })} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => setAdding(false)}>
              Batal
            </Button>
            <Button type="submit" loading={busy === 'add'}>
              Buat akun
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
