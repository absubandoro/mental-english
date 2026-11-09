'use client';

import { ArrowRight, ChevronLeft, ChevronRight, LayoutDashboard, LogIn, LogOut, MapPin, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/lib/auth';
import { PublicTabBar } from './PublicTabBar';
import { ROLE_HOME, ROLE_LABEL } from '@/lib/format';

interface Card {
  key: string;
  href: string;
  caption: string;
  title: string;
  /** Foto kartu sekaligus background saat kartu aktif */
  photo: string;
  /** Kartu tanpa foto memakai gradasi + ikon */
  icon?: React.ReactNode;
  onClick?: () => void;
}

const PHOTOS = {
  welcome: '/landing/welcome.jpg',
  holiday: '/landing/holiday.jpg',
  team: '/landing/team.jpg',
};

const AUTOPLAY_MS = 6000;

/** Landing: satu section — background foto + menu berupa kartu carousel (tanpa header bar) */
export function LandingHero({ cities }: { cities: string[] }) {
  const { user, logout } = useAuth();
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const track = useRef<HTMLDivElement>(null);

  const cards: Card[] = [
    { key: 'blog', href: '/blog', caption: 'Artikel · Video kegiatan', title: 'Blog & Vlog', photo: PHOTOS.holiday },
    { key: 'mading', href: '/mading', caption: 'Karya pelajar', title: 'Mading', photo: PHOTOS.team },
    { key: 'lokasi', href: '/lokasi', caption: `${cities.length || ''} cabang`.trim(), title: 'Lokasi Kami', photo: PHOTOS.welcome },
    ...(user
      ? [
          {
            key: 'dashboard',
            href: ROLE_HOME[user.role],
            caption: ROLE_LABEL[user.role],
            title: 'Dashboard Saya',
            photo: PHOTOS.welcome,
            icon: <LayoutDashboard className="size-10" />,
          },
          { key: 'logout', href: '/', caption: user.name, title: 'Keluar', photo: PHOTOS.team, icon: <LogOut className="size-10" />, onClick: logout },
        ]
      : [
          { key: 'login', href: '/login', caption: 'Pelajar · Orang tua · Pengajar', title: 'Masuk', photo: PHOTOS.welcome, icon: <LogIn className="size-10" /> },
          { key: 'daftar', href: '/daftar', caption: 'Pendaftaran siswa baru', title: 'Daftar Siswa', photo: PHOTOS.holiday, icon: <UserPlus className="size-10" /> },
        ]),
  ];
  const total = cards.length;
  const backgrounds = [...new Set(cards.map((c) => c.photo))];

  const go = useCallback((i: number) => setActive(((i % total) + total) % total), [total]);

  // Geser track agar kartu aktif berada paling kiri
  useEffect(() => {
    const el = track.current;
    const card = el?.children[active] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: 'smooth' });
  }, [active]);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => go(active + 1), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [active, paused, go]);

  const current = cards[Math.min(active, total - 1)];

  return (
    <main className="relative isolate flex min-h-dvh flex-col overflow-hidden bg-ink-950">
      {/* Background foto, berganti mengikuti kartu aktif */}
      <div aria-hidden className="absolute inset-0 -z-10">
        {backgrounds.map((src) => (
          <div key={src} className={`absolute inset-0 transition-opacity duration-1000 ${current.photo === src ? 'opacity-100' : 'opacity-0'}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className={`size-full object-cover ${current.photo === src ? 'animate-kenburns' : ''}`} key={current.photo === src ? active : 'idle'} />
          </div>
        ))}
        <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/50 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-transparent to-ink-950/40" />
        <div className="absolute inset-0 bg-navy-700/25 mix-blend-multiply" />
      </div>

      {/* Logo — tanpa header bar */}
      <div className="mx-auto w-full max-w-7xl px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] sm:px-8 sm:pt-6">
        <Link href="/" className="inline-flex items-center gap-3" aria-label="Mental English">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" width={44} height={44} className="rounded-full ring-2 ring-white/20" />
          <span className="font-condensed text-sm font-medium tracking-[0.3em] text-white uppercase">Mental English</span>
        </Link>
      </div>

      <section className="mx-auto grid w-full max-w-7xl flex-1 items-end gap-10 px-4 pt-12 pb-8 sm:px-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] lg:pb-14">
        {/* Kiri: judul */}
        <div className="max-w-xl self-center lg:self-end lg:pb-24">
          <span className="block h-0.5 w-10 bg-brand-400" />
          <p className="mt-4 text-base font-medium text-brand-200 sm:text-lg">Build Your Mental Focus!</p>
          <h1 className="mt-2 font-condensed text-6xl leading-[0.95] font-semibold tracking-tight text-white uppercase sm:text-7xl xl:text-8xl">
            Mental
            <br />
            English
          </h1>
          <p className="mt-6 max-w-md text-sm leading-relaxed text-slate-300 sm:text-base">
            Kursus bahasa Inggris yang melatih keberanian berbicara, fokus, dan kepercayaan diri. Orang tua dapat memantau absensi, hasil ujian, dan
            pembayaran anak secara langsung.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link
              href={user ? ROLE_HOME[user.role] : '/daftar'}
              className="flex size-12 items-center justify-center rounded-full bg-brand-500 text-white shadow-lg shadow-brand-500/30 transition hover:scale-105 hover:bg-brand-400"
              aria-label={user ? 'Dashboard saya' : 'Daftar sekarang'}
            >
              <ArrowRight className="size-5" />
            </Link>
            <Link
              href="/lokasi"
              className="inline-flex items-center gap-2 rounded-full border border-white/30 px-5 py-2.5 text-xs font-semibold tracking-[0.15em] text-white uppercase backdrop-blur-sm transition hover:border-white hover:bg-white/10"
            >
              <MapPin className="size-4" /> Temukan cabang
            </Link>
          </div>
        </div>

        {/* Kanan: menu berupa kartu */}
        <div className="min-w-0" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)} onFocus={() => setPaused(true)} onBlur={() => setPaused(false)}>
          <nav aria-label="Menu utama">
            <div ref={track} className="no-scrollbar flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2">
              {cards.map((c, i) => (
                <Link
                  key={c.key}
                  href={c.href}
                  onClick={(e) => {
                    if (c.onClick) {
                      e.preventDefault();
                      c.onClick();
                    }
                  }}
                  onMouseEnter={() => setActive(i)}
                  className={`group relative aspect-[3/4.3] w-40 shrink-0 snap-start overflow-hidden rounded-2xl shadow-2xl shadow-black/40 ring-1 transition duration-500 sm:w-48 xl:w-52 ${
                    i === active ? 'ring-2 ring-brand-300' : 'ring-white/15 hover:ring-white/40'
                  }`}
                >
                  {c.icon ? (
                    <div className="absolute inset-0 bg-gradient-to-br from-brand-500 via-navy-500 to-navy-700">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src="/logo.png" alt="" className="absolute -top-6 -right-8 size-40 rounded-full opacity-20" />
                      <span className="absolute top-1/3 left-5 text-white/90">{c.icon}</span>
                    </div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.photo} alt="" className="absolute inset-0 size-full object-cover transition duration-700 group-hover:scale-110" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink-950/90 via-ink-950/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-4">
                    <span className="block h-px w-6 bg-white/70" />
                    <p className="mt-2 truncate text-[11px] text-slate-300">{c.caption}</p>
                    <h2 className="mt-0.5 font-condensed text-xl leading-tight font-semibold tracking-wide text-white uppercase sm:text-2xl">{c.title}</h2>
                  </div>
                </Link>
              ))}
              {/* Spacer agar kartu terakhir tetap bisa berada di kiri */}
              <div aria-hidden className="w-[40%] shrink-0" />
            </div>
          </nav>

          <div className="mt-6 flex items-center gap-4">
            <button onClick={() => go(active - 1)} className="flex size-11 items-center justify-center rounded-full border border-white/30 text-white transition hover:border-white hover:bg-white/10" aria-label="Sebelumnya">
              <ChevronLeft className="size-5" />
            </button>
            <button onClick={() => go(active + 1)} className="flex size-11 items-center justify-center rounded-full border border-white/30 text-white transition hover:border-white hover:bg-white/10" aria-label="Berikutnya">
              <ChevronRight className="size-5" />
            </button>
            <div className="relative h-px flex-1 bg-white/20">
              <div className="absolute inset-y-0 left-0 bg-brand-300 transition-all duration-500" style={{ width: `${((active + 1) / total) * 100}%` }} />
            </div>
            <span className="w-14 text-right font-condensed text-4xl font-medium text-white tabular-nums sm:text-5xl" aria-live="polite">
              {String(active + 1).padStart(2, '0')}
            </span>
          </div>
        </div>
      </section>

      <p className="mx-auto w-full max-w-7xl px-4 pb-5 text-xs text-slate-400 sm:px-8">
        © {new Date().getFullYear()} Mental English{cities.length > 0 && <> · {cities.join(' · ')}</>}
      </p>
      <PublicTabBar />
    </main>
  );
}
