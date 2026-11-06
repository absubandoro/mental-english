'use client';

import { ArrowUpRight, LayoutDashboard, LogIn, LogOut, MapPin, Newspaper, Palette, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth';
import { ROLE_HOME, ROLE_LABEL } from '@/lib/format';

interface Tile {
  href: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export function LandingMenu() {
  const { user, logout, loading } = useAuth();

  const tiles: Tile[] = [
    {
      href: '/blog',
      title: 'Blog & Vlog',
      desc: 'Tips belajar, cerita kelas, dan video kegiatan dari setiap cabang.',
      icon: <Newspaper className="size-6" />,
      className: 'sm:col-span-2 bg-gradient-to-br from-brand-500/25 via-brand-500/10 to-transparent',
    },
    {
      href: '/mading',
      title: 'Mading',
      desc: 'Majalah dinding karya pelajar.',
      icon: <Palette className="size-6" />,
      className: 'bg-gradient-to-br from-navy-500/40 to-transparent',
    },
    {
      href: '/lokasi',
      title: 'Lokasi Kami',
      desc: 'Temukan cabang terdekat.',
      icon: <MapPin className="size-6" />,
      className: 'bg-gradient-to-br from-navy-500/40 to-transparent',
    },
  ];

  if (user) {
    tiles.push(
      {
        href: ROLE_HOME[user.role],
        title: 'Dashboard Saya',
        desc: `Masuk sebagai ${ROLE_LABEL[user.role]} — ${user.name}`,
        icon: <LayoutDashboard className="size-6" />,
        className: 'bg-brand-500 text-white hover:bg-brand-400',
      },
      { href: '/', title: 'Keluar', desc: 'Akhiri sesi di perangkat ini.', icon: <LogOut className="size-6" />, onClick: logout },
    );
  } else {
    tiles.push(
      {
        href: '/login',
        title: 'Masuk',
        desc: 'Pelajar, orang tua, pengajar & admin.',
        icon: <LogIn className="size-6" />,
        className: 'bg-brand-500 text-white hover:bg-brand-400',
      },
      { href: '/daftar', title: 'Daftar', desc: 'Buat akun orang tua atau pelajar.', icon: <UserPlus className="size-6" /> },
    );
  }

  return (
    <nav aria-label="Menu utama" className={`grid gap-3 sm:grid-cols-2 ${loading ? 'opacity-90' : ''}`}>
      {tiles.map((t) => (
        <Link
          key={t.title}
          href={t.href}
          onClick={(e) => {
            if (t.onClick) {
              e.preventDefault();
              t.onClick();
            }
          }}
          className={`group relative flex min-h-32 flex-col justify-between overflow-hidden rounded-3xl border border-white/10 p-5 transition hover:-translate-y-0.5 hover:border-brand-300/40 ${
            t.className ?? 'bg-white/[0.03] hover:bg-white/[0.06]'
          }`}
        >
          <div className="flex items-start justify-between">
            <span className="rounded-2xl bg-white/10 p-2.5 ring-1 ring-white/10">{t.icon}</span>
            <ArrowUpRight className="size-5 opacity-50 transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100" />
          </div>
          <div className="mt-6">
            <h2 className="font-display text-xl font-bold">{t.title}</h2>
            <p className="mt-1 text-sm opacity-75">{t.desc}</p>
          </div>
        </Link>
      ))}
    </nav>
  );
}
