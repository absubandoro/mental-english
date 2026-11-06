import { Clock, MapPin, Phone } from 'lucide-react';
import type { Metadata } from 'next';
import { PublicShell } from '@/components/PublicShell';
import { mapsEmbed } from '@/lib/format';
import { serverGet } from '@/lib/server-api';
import type { Branch } from '@/lib/types';

export const metadata: Metadata = { title: 'Lokasi Kami', description: 'Alamat dan peta seluruh cabang Mental English.' };
export const dynamic = 'force-dynamic';

export default async function LokasiPage() {
  const branches = (await serverGet<Branch[]>('/branches')) ?? [];
  return (
    <PublicShell>
      <header className="mb-10">
        <p className="text-sm font-semibold tracking-[0.2em] text-brand-300 uppercase">Lokasi Kami</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold text-white sm:text-5xl">Cabang Mental English</h1>
        <p className="mt-3 max-w-2xl text-slate-400">Kunjungi cabang terdekat untuk konsultasi dan kelas percobaan.</p>
      </header>
      {branches.length === 0 && <p className="text-slate-400">Belum ada data cabang.</p>}
      <div className="grid gap-6 lg:grid-cols-2">
        {branches.map((b) => {
          const src = mapsEmbed(b.mapQuery || b.address);
          const phone = b.phone?.replace(/\D/g, '').replace(/^0/, '62');
          return (
            <section key={b.id} className="card overflow-hidden">
              {src && (
                <iframe
                  src={src}
                  title={`Peta ${b.name}`}
                  className="aspect-[16/9] w-full border-0 grayscale-[30%] invert-[90%] hue-rotate-180"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              )}
              <div className="space-y-3 p-6">
                <h2 className="font-display text-2xl font-bold text-white">{b.name}</h2>
                {b.address && (
                  <p className="flex gap-2.5 text-sm text-slate-300">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-brand-300" /> {b.address}
                  </p>
                )}
                {b.openHours && (
                  <p className="flex gap-2.5 text-sm text-slate-300">
                    <Clock className="mt-0.5 size-4 shrink-0 text-brand-300" /> {b.openHours}
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-2">
                  {phone && (
                    <a href={`https://wa.me/${phone}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400">
                      <Phone className="size-4" /> {b.phone}
                    </a>
                  )}
                  {(b.mapQuery || b.address) && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address || b.mapQuery || b.name)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm text-slate-200 hover:bg-white/5"
                    >
                      Buka di Google Maps
                    </a>
                  )}
                </div>
              </div>
            </section>
          );
        })}
      </div>
    </PublicShell>
  );
}
