'use client';

import { AtSign, Globe, Mail, MessageCircle, Palette, Save } from 'lucide-react';
import { useState } from 'react';
import { useOrg } from '@/components/OrgProvider';
import { Button, Empty, ErrorBox, Field, ImageField, PageHeader } from '@/components/ui';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { brandShades, initials, splitName, type Org } from '@/lib/org';

const PRESETS = ['#3d8ccf', '#2563eb', '#7c3aed', '#db2777', '#dc2626', '#ea580c', '#d97706', '#16a34a', '#0d9488', '#0891b2'];

type Form = Omit<Org, 'id' | 'slug'>;

const toForm = (o: Org): Form => ({
  name: o.name,
  tagline: o.tagline ?? '',
  description: o.description ?? '',
  logoUrl: o.logoUrl ?? '',
  brandColor: o.brandColor,
  photos: { welcome: o.photos.welcome ?? '', holiday: o.photos.holiday ?? '', team: o.photos.team ?? '' },
  whatsapp: o.whatsapp ?? '',
  email: o.email ?? '',
  instagram: o.instagram ?? '',
  website: o.website ?? '',
});

/** Super Admin: identitas lembaga — nama, logo, warna, foto landing, kontak. Berlaku di seluruh website lembaga ini. */
export default function IdentitasLembaga() {
  const { user } = useAuth();
  const org = useOrg();
  const [form, setForm] = useState<Form>(() => toForm(org));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (user?.role !== 'SUPER_ADMIN') return <Empty title="Hanya super admin yang dapat mengubah identitas lembaga" />;

  const set = (k: keyof Form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm({ ...form, [k]: e.target.value });
  const setPhoto = (k: keyof Form['photos']) => (url: string) => setForm({ ...form, photos: { ...form.photos, [k]: url } });
  const shades = brandShades(/^#[0-9a-f]{6}$/i.test(form.brandColor) ? form.brandColor : '#3d8ccf');
  const [first, rest] = splitName(form.name || 'Nama Lembaga');
  const hero = form.photos.welcome || form.photos.holiday || form.photos.team;

  return (
    <>
      <PageHeader title="Identitas Lembaga" desc="Nama, logo, warna, foto, dan kontak yang tampil di seluruh website, aplikasi HP, rapor, dan preview link." />
      <form
        className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError(null);
          try {
            await api('/org', { method: 'PATCH', body: form });
            // Muat ulang agar logo, warna, dan judul baru langsung berlaku di semua halaman
            window.location.reload();
          } catch (er) {
            setError((er as Error).message);
            setBusy(false);
          }
        }}
      >
        <div className="space-y-6">
          <ErrorBox message={error} />
          <section className="card space-y-4 p-5 sm:p-6">
            <h2 className="font-display text-lg font-bold text-white">Nama & logo</h2>
            <Field label="Nama lembaga">
              <input className="input" required minLength={2} maxLength={80} value={form.name} onChange={set('name')} />
            </Field>
            <Field label="Tagline" hint="Kalimat singkat di landing page, mis. “Build Your Mental Focus!”">
              <input className="input" maxLength={120} value={form.tagline ?? ''} onChange={set('tagline')} />
            </Field>
            <Field label="Deskripsi singkat" hint="Tampil di landing page dan preview link saat dibagikan (WhatsApp, dll.)">
              <textarea className="input min-h-24" maxLength={600} value={form.description ?? ''} onChange={set('description')} />
            </Field>
            <ImageField label="Logo (persegi, min. 512×512 px, PNG/JPG)" value={form.logoUrl ?? ''} onChange={(url) => setForm({ ...form, logoUrl: url })} />
          </section>

          <section className="card space-y-4 p-5 sm:p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-white">
              <Palette className="size-5 text-brand-300" /> Warna merek
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {PRESETS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setForm({ ...form, brandColor: c })}
                  className={`size-9 rounded-full ring-offset-2 ring-offset-ink-900 transition ${form.brandColor.toLowerCase() === c ? 'ring-2 ring-white' : 'hover:scale-110'}`}
                  style={{ background: c }}
                  aria-label={`Warna ${c}`}
                />
              ))}
              <label className="ml-1 flex items-center gap-2 text-sm text-slate-300">
                <input type="color" value={form.brandColor} onChange={set('brandColor')} className="size-9 cursor-pointer rounded-lg border-0 bg-transparent" />
                <input className="input w-28 font-mono" value={form.brandColor} onChange={set('brandColor')} pattern="#[0-9a-fA-F]{6}" />
              </label>
            </div>
          </section>

          <section className="card space-y-4 p-5 sm:p-6">
            <div>
              <h2 className="font-display text-lg font-bold text-white">Foto landing page</h2>
              <p className="text-sm text-slate-400">Foto kegiatan untuk latar & kartu menu di beranda dan kolase blog. Gunakan foto landscape, min. 1600 px.</p>
            </div>
            <ImageField label="Foto utama" value={form.photos.welcome ?? ''} onChange={setPhoto('welcome')} />
            <ImageField label="Foto kegiatan" value={form.photos.holiday ?? ''} onChange={setPhoto('holiday')} />
            <ImageField label="Foto tim / pelajar" value={form.photos.team ?? ''} onChange={setPhoto('team')} />
          </section>

          <section className="card grid gap-4 p-5 sm:grid-cols-2 sm:p-6">
            <h2 className="font-display text-lg font-bold text-white sm:col-span-2">Kontak</h2>
            <Field label="WhatsApp">
              <input className="input" inputMode="tel" placeholder="0812…" value={form.whatsapp ?? ''} onChange={set('whatsapp')} />
            </Field>
            <Field label="Email">
              <input className="input" type="email" value={form.email ?? ''} onChange={set('email')} />
            </Field>
            <Field label="Instagram">
              <input className="input" placeholder="@namalembaga" value={form.instagram ?? ''} onChange={set('instagram')} />
            </Field>
            <Field label="Website lain (opsional)">
              <input className="input" placeholder="https://…" value={form.website ?? ''} onChange={set('website')} />
            </Field>
          </section>
        </div>

        {/* Pratinjau */}
        <aside className="space-y-4 xl:sticky xl:top-6 xl:self-start">
          <p className="text-xs font-semibold tracking-[0.2em] text-slate-400 uppercase">Pratinjau</p>
          <div className="relative overflow-hidden rounded-2xl ring-1 ring-white/10" style={{ aspectRatio: '4 / 3.4' }}>
            {hero ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={hero} alt="" className="absolute inset-0 size-full object-cover" />
            ) : (
              <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${shades[600]}, #24255a 60%, #060a1a)` }} />
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/50 to-transparent" />
            <div className="relative flex h-full flex-col justify-between p-5">
              <div className="flex items-center gap-2">
                {form.logoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.logoUrl} alt="" className="size-9 rounded-full object-cover" />
                ) : (
                  <span className="flex size-9 items-center justify-center rounded-full text-xs font-bold text-white" style={{ background: `linear-gradient(135deg, ${shades[400]}, ${shades[600]})` }}>
                    {initials(form.name || '?')}
                  </span>
                )}
                <span className="truncate font-condensed text-[11px] tracking-[0.25em] text-white uppercase">{form.name}</span>
              </div>
              <div>
                <span className="block h-0.5 w-8" style={{ background: shades[400] }} />
                {form.tagline && (
                  <p className="mt-2 text-sm font-medium" style={{ color: shades[200] }}>
                    {form.tagline}
                  </p>
                )}
                <p className="mt-1 font-condensed text-4xl leading-[0.95] font-semibold break-words text-white uppercase">
                  {first}
                  {rest && (
                    <>
                      <br />
                      {rest}
                    </>
                  )}
                </p>
                <span className="mt-4 inline-flex rounded-xl px-4 py-2 text-xs font-semibold text-white" style={{ background: shades[500] }}>
                  Daftar sekarang
                </span>
              </div>
            </div>
          </div>
          <div className="card space-y-2 p-4 text-sm text-slate-300">
            <p className="flex items-center gap-2">
              <Globe className="size-4 text-slate-500" /> {typeof window !== 'undefined' ? window.location.host : ''}
            </p>
            {form.whatsapp && (
              <p className="flex items-center gap-2">
                <MessageCircle className="size-4 text-slate-500" /> {form.whatsapp}
              </p>
            )}
            {form.email && (
              <p className="flex items-center gap-2">
                <Mail className="size-4 text-slate-500" /> {form.email}
              </p>
            )}
            {form.instagram && (
              <p className="flex items-center gap-2">
                <AtSign className="size-4 text-slate-500" /> {form.instagram}
              </p>
            )}
            <p className="pt-1 text-xs text-slate-500">Domain website diatur oleh pengelola platform.</p>
          </div>
          <Button type="submit" loading={busy} className="w-full">
            <Save className="size-4" /> Simpan identitas
          </Button>
        </aside>
      </form>
    </>
  );
}
