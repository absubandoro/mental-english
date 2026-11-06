import Image from 'next/image';
import { LandingMenu } from '@/components/LandingMenu';
import { serverGet } from '@/lib/server-api';
import type { Branch } from '@/lib/types';

export const dynamic = 'force-dynamic';

/** Landing page: satu section saja, semua menu ada di dalam konten (tanpa header bar) */
export default async function Home() {
  const branches = (await serverGet<Branch[]>('/branches')) ?? [];

  return (
    <main className="bg-mesh relative isolate flex min-h-dvh items-center overflow-hidden">
      {/* Bentuk "benua" seperti pada logo */}
      <svg aria-hidden className="pointer-events-none absolute -top-24 -right-40 -z-10 w-[46rem] opacity-[0.12]" viewBox="0 0 200 200">
        <path fill="#3d8ccf" d="M38 40l42-14 30 18 36-6 22 30-12 34 18 26-26 38-44-4-20 22-40-18 6-34-28-22 16-36z" />
      </svg>
      <svg aria-hidden className="pointer-events-none absolute -bottom-40 -left-32 -z-10 w-[38rem] opacity-[0.18]" viewBox="0 0 200 200">
        <path fill="#2f3071" d="M30 60l40-22 46 10 30-16 34 36-10 44 20 30-44 30-38-12-30 20-40-34 8-40z" />
      </svg>

      <section className="mx-auto grid w-full max-w-6xl items-center gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[1.05fr_1fr] lg:gap-14 lg:py-16">
        <div>
          <div className="relative mb-8 inline-block">
            <div className="absolute inset-0 -z-10 rounded-full bg-brand-500/40 blur-3xl" />
            <Image src="/logo.png" alt="Logo Mental English" width={168} height={168} priority className="animate-float-slow rounded-full shadow-2xl shadow-brand-500/20" />
          </div>
          <p className="mb-3 text-sm font-semibold tracking-[0.2em] text-brand-300 uppercase">Build your mental and focus</p>
          <h1 className="font-display text-5xl leading-[1.05] font-extrabold tracking-tight text-white sm:text-6xl">
            Mental <span className="bg-gradient-to-r from-brand-300 to-brand-500 bg-clip-text text-transparent">English</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Kursus bahasa Inggris yang melatih keberanian berbicara, fokus, dan kepercayaan diri. Orang tua dapat memantau absensi, hasil ujian, dan
            pembayaran anak secara langsung.
          </p>
          <dl className="mt-8 flex flex-wrap gap-3 text-sm">
            {[
              [String(branches.length || '—'), 'Cabang'],
              ['Belajar · Ujian · Outdoor', 'Tipe kelas'],
              ['Real-time', 'Laporan orang tua'],
            ].map(([v, l]) => (
              <div key={l} className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-2.5">
                <dt className="text-xs text-slate-400">{l}</dt>
                <dd className="font-semibold text-white">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        <div>
          <LandingMenu />
          <p className="mt-6 text-center text-xs text-slate-500 lg:text-left">
            © {new Date().getFullYear()} Mental English
            {branches.length > 0 && <> · {branches.map((b) => b.city || b.name).join(' · ')}</>}
          </p>
        </div>
      </section>
    </main>
  );
}
