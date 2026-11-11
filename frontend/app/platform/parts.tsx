'use client';

import { Check, Copy, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Badge, Button, ErrorBox, Field, Modal } from '@/components/ui';
import { initials } from '@/lib/org';
import { papi, type OrgRow } from '@/lib/platform';
import { slugify } from './slug';

export function OrgAvatar({ o, size = 40 }: { o: { name: string; logoUrl: string | null; brandColor: string }; size?: number }) {
  if (o.logoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={o.logoUrl} alt="" className="shrink-0 rounded-xl object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span className="flex shrink-0 items-center justify-center rounded-xl font-bold text-white" style={{ width: size, height: size, background: o.brandColor, fontSize: size * 0.36 }}>
      {initials(o.name)}
    </span>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return <Badge tone={active ? 'green' : 'red'}>{active ? 'Aktif' : 'Nonaktif'}</Badge>;
}

export function CopyButton({ text, label = 'Salin' }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      onClick={async () => {
        await navigator.clipboard?.writeText(text).catch(() => undefined);
        setDone(true);
        setTimeout(() => setDone(false), 1500);
      }}
    >
      {done ? <Check className="size-3.5" /> : <Copy className="size-3.5" />} {done ? 'Tersalin' : label}
    </Button>
  );
}

/** Kotak kredensial (password hanya ditampilkan sekali) */
export function Credentials({ title, url, email, password }: { title: string; url?: string; email: string; password: string }) {
  const text = [url && `Alamat: ${url}`, `Email: ${email}`, `Password: ${password}`, 'Segera ganti password lewat menu Profil Saya.'].filter(Boolean).join('\n');
  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-300">{title}</p>
      <div className="space-y-2 rounded-2xl bg-white/[0.03] p-4 font-mono text-sm ring-1 ring-white/10">
        {url && (
          <div className="flex justify-between gap-3">
            <span className="text-slate-500">Alamat</span>
            <a href={url} target="_blank" rel="noreferrer" className="truncate text-brand-300 hover:underline">
              {url}
            </a>
          </div>
        )}
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Email</span>
          <span className="truncate text-white">{email}</span>
        </div>
        <div className="flex justify-between gap-3">
          <span className="text-slate-500">Password</span>
          <span className="text-white">{password}</span>
        </div>
      </div>
      <p className="text-xs text-amber-200/90">Password hanya ditampilkan sekali. Salin dan kirimkan ke klien sekarang.</p>
      <CopyButton text={text} label="Salin semua" />
    </div>
  );
}

const COLORS = ['#3d8ccf', '#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#d97706', '#16a34a', '#0d9488'];
const EMPTY = { name: '', slug: '', email: '', adminName: '', branchName: '', city: '', brandColor: '#3d8ccf', domain: '', notes: '' };

export function CreateOrgModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: () => void }) {
  const [form, setForm] = useState(EMPTY);
  const [slugTouched, setSlugTouched] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; email: string; password: string; urls: string[] } | null>(null);
  const set = (k: keyof typeof EMPTY) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  const close = () => {
    onClose();
    setTimeout(() => (setForm(EMPTY), setSlugTouched(false), setResult(null), setError(null)), 200);
  };
  return (
    <Modal open={open} onClose={close} title={result ? 'Lembaga dibuat 🎉' : 'Lembaga baru'} wide={!result}>
      {result ? (
        <div className="space-y-4">
          <Credentials title="Website lembaga dan akun Super Admin siap dipakai. Klien bisa langsung login dan mengisi Identitas Lembaga." url={result.urls[0]} email={result.email} password={result.password} />
          <div className="flex justify-end gap-2">
            <Link href={`/platform/lembaga/${result.id}`} className="inline-flex items-center gap-1.5 rounded-xl bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-400">
              Buka detail <ExternalLink className="size-4" />
            </Link>
            <Button variant="secondary" onClick={close}>
              Selesai
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              const r = await papi<{ id: string; email: string; password: string; urls: string[] }>('/orgs', { method: 'POST', body: form });
              setResult(r);
              onCreated();
            } catch (er) {
              setError((er as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="sm:col-span-2">
            <ErrorBox message={error} />
          </div>
          <Field label="Nama lembaga">
            <input
              className="input"
              required
              minLength={2}
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value, ...(slugTouched ? {} : { slug: slugify(e.target.value) }) })}
              placeholder="mis. Kursus Budi"
            />
          </Field>
          <Field label="Slug (alamat subdomain)" hint={`Website: ${form.slug || 'slug'}.<domain platform>`}>
            <input
              className="input font-mono"
              required
              pattern="[a-z0-9\-]{3,40}"
              value={form.slug}
              onChange={(e) => (setSlugTouched(true), setForm({ ...form, slug: slugify(e.target.value) }))}
            />
          </Field>
          <Field label="Email Super Admin (pemilik)">
            <input className="input" type="email" required value={form.email} onChange={set('email')} />
          </Field>
          <Field label="Nama Super Admin (opsional)">
            <input className="input" value={form.adminName} onChange={set('adminName')} placeholder="Super Admin" />
          </Field>
          <Field label="Nama cabang pertama (opsional)">
            <input className="input" value={form.branchName} onChange={set('branchName')} placeholder={form.name ? `${form.name} Pusat` : 'Pusat'} />
          </Field>
          <Field label="Kota (opsional)">
            <input className="input" value={form.city} onChange={set('city')} />
          </Field>
          <Field label="Domain sendiri (opsional)" hint="mis. belajar.kursusbudi.com — bisa ditambahkan nanti">
            <input className="input font-mono" value={form.domain} onChange={set('domain')} />
          </Field>
          <div>
            <span className="label">Warna merek awal</span>
            <div className="flex flex-wrap gap-2 pt-1">
              {COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, brandColor: c })}
                  className={`size-8 rounded-full ring-offset-2 ring-offset-ink-900 ${form.brandColor === c ? 'ring-2 ring-white' : ''}`}
                  style={{ background: c }}
                  aria-label={c}
                />
              ))}
            </div>
          </div>
          <div className="sm:col-span-2">
            <Field label="Catatan internal (opsional)" hint="Hanya terlihat oleh pengelola platform, mis. paket, kontak PIC, tanggal trial">
              <textarea className="input min-h-20" value={form.notes} onChange={set('notes')} />
            </Field>
          </div>
          <div className="flex justify-end gap-2 sm:col-span-2">
            <Button type="button" variant="secondary" onClick={close}>
              Batal
            </Button>
            <Button type="submit" loading={busy}>
              Buat lembaga
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

export function OrgCard({ o }: { o: OrgRow }) {
  return (
    <Link href={`/platform/lembaga/${o.id}`} className="card flex flex-col p-5 transition hover:border-white/20 hover:bg-ink-800/70">
      <div className="flex items-start gap-3">
        <OrgAvatar o={o} size={44} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate font-display text-lg font-bold text-white">{o.name}</h3>
            <StatusBadge active={o.isActive} />
          </div>
          <p className="truncate font-mono text-xs text-slate-400">{o.urls[o.urls.length - 1].replace(/^https?:\/\//, '')}</p>
        </div>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
        {[
          ['Cabang', o.branches],
          ['Pelajar', o.students],
          ['Staf', o.staff],
        ].map(([k, v]) => (
          <div key={k} className="rounded-xl bg-white/[0.03] py-2">
            <dd className="font-display text-xl font-bold text-white">{v}</dd>
            <dt className="text-[11px] text-slate-500">{k}</dt>
          </div>
        ))}
      </dl>
    </Link>
  );
}
