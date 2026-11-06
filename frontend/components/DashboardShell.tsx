'use client';

import {
  Bell, Building2, CalendarCheck, ChartPie, CreditCard, GraduationCap, Home, LayoutDashboard, LogOut, Megaphone, Menu, Newspaper, Palette,
  School, ShieldCheck, User as UserIcon, Users, UsersRound, X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth, useRequireRole } from '@/lib/auth';
import { ROLE_LABEL } from '@/lib/format';
import type { Role } from '@/lib/types';
import { useBranches } from '@/lib/useBranches';
import { Logo } from './Logo';
import { Avatar, Spinner } from './ui';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
}

const NAV: Record<'student' | 'parent' | 'teacher' | 'admin', NavItem[]> = {
  student: [
    { href: '/pelajar', label: 'Profil Saya', icon: UserIcon },
    { href: '/pelajar/mading', label: 'Mading Saya', icon: Palette },
  ],
  parent: [
    { href: '/orang-tua', label: 'Profil Saya', icon: UserIcon },
    { href: '/orang-tua/anak', label: 'Profil Anak', icon: GraduationCap },
    { href: '/orang-tua/dashboard', label: 'Dashboard Anak', icon: ChartPie },
    { href: '/orang-tua/mading', label: 'Mading Anak', icon: Palette },
    { href: '/orang-tua/pembayaran', label: 'Laporan Pembayaran', icon: CreditCard },
    { href: '/orang-tua/notifikasi', label: 'Notifikasi', icon: Bell },
  ],
  teacher: [
    { href: '/pengajar', label: 'Kelas yang Diajar', icon: School },
    { href: '/pengajar/sesi', label: 'Kelas Hari Ini', icon: CalendarCheck },
    { href: '/pengajar/profil', label: 'Profil Saya', icon: UserIcon },
  ],
  admin: [
    { href: '/admin', label: 'Ringkasan', icon: LayoutDashboard },
    { href: '/admin/blog', label: 'Blog & Vlog', icon: Newspaper },
    { href: '/admin/mading', label: 'Moderasi Mading', icon: Palette },
    { href: '/admin/pelajar', label: 'User Anak', icon: GraduationCap },
    { href: '/admin/orang-tua', label: 'User Orang Tua', icon: UsersRound },
    { href: '/admin/pengajar', label: 'Pengajar', icon: Users },
    { href: '/admin/kelas', label: 'Kelas', icon: School },
    { href: '/admin/pembayaran', label: 'Pembayaran', icon: CreditCard },
    { href: '/admin/notifikasi', label: 'Push Notifikasi', icon: Megaphone },
    { href: '/admin/cabang', label: 'Cabang', icon: Building2, roles: ['SUPER_ADMIN'] },
    { href: '/admin/admin-cabang', label: 'Admin Cabang', icon: ShieldCheck, roles: ['SUPER_ADMIN'] },
    { href: '/admin/profil', label: 'Profil Saya', icon: UserIcon },
  ],
};

export function DashboardShell({ area, roles, children }: { area: keyof typeof NAV; roles: Role[]; children: React.ReactNode }) {
  const { user, ready } = useRequireRole(roles);
  const { logout, activeBranchId, setActiveBranchId } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [unread, setUnread] = useState(0);
  const { branches } = useBranches();

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!ready || area !== 'parent') return;
    const load = () => api<{ unread: number }>('/notifications/unread-count').then((r) => setUnread(r.unread)).catch(() => undefined);
    load();
    const t = setInterval(load, 30000);
    window.addEventListener('me:notifications', load);
    return () => {
      clearInterval(t);
      window.removeEventListener('me:notifications', load);
    };
  }, [ready, area]);

  if (!ready || !user) {
    return (
      <div className="bg-mesh flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const items = NAV[area].filter((i) => !i.roles || i.roles.includes(user.role));
  const branchName = branches.find((b) => b.id === (user.branchId ?? activeBranchId))?.name;

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <Logo size={36} />
        <button className="rounded-lg p-1.5 text-slate-400 lg:hidden" onClick={() => setOpen(false)} aria-label="Tutup menu">
          <X className="size-5" />
        </button>
      </div>
      <div className="mx-4 mb-4 rounded-2xl border border-white/8 bg-white/[0.03] p-3">
        <div className="flex items-center gap-3">
          <Avatar name={user.name} src={user.avatarUrl} size={38} />
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-white">{user.name}</div>
            <div className="truncate text-xs text-slate-400">
              {ROLE_LABEL[user.role]}
              {user.role !== 'SUPER_ADMIN' && branchName ? ` · ${branchName}` : ''}
            </div>
          </div>
        </div>
        {user.role === 'SUPER_ADMIN' && (
          <select className="input mt-3 py-2 text-xs" value={activeBranchId ?? ''} onChange={(e) => setActiveBranchId(e.target.value || null)} aria-label="Cabang aktif">
            <option value="">Semua cabang</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Menu dashboard">
        {items.map(({ href, label, icon: Icon }) => {
          const active = href === pathname || (href !== `/${pathname.split('/')[1]}` && pathname.startsWith(href + '/'));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                active ? 'bg-brand-500/15 font-semibold text-white ring-1 ring-brand-400/25' : 'text-slate-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon className={`size-[18px] ${active ? 'text-brand-300' : ''}`} />
              <span className="flex-1">{label}</span>
              {href.endsWith('/notifikasi') && area === 'parent' && unread > 0 && (
                <span className="rounded-full bg-brand-500 px-1.5 text-[11px] font-bold text-white">{unread}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-0.5 border-t border-white/5 p-3">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
          <Home className="size-[18px]" /> Halaman Utama
        </Link>
        <button
          onClick={() => {
            logout();
            router.replace('/login');
          }}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut className="size-[18px]" /> Keluar
        </button>
      </div>
    </div>
  );

  return (
    <div className="bg-mesh min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/5 bg-ink-900/80 backdrop-blur lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-40 bg-ink-950/70 backdrop-blur-sm lg:hidden" onClick={() => setOpen(false)}>
          <aside className="h-full w-72 max-w-[85%] border-r border-white/5 bg-ink-900" onClick={(e) => e.stopPropagation()}>
            {sidebar}
          </aside>
        </div>
      )}
      <div className="lg:pl-64">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b border-white/5 bg-ink-950/80 px-4 py-3 backdrop-blur lg:hidden">
          <button onClick={() => setOpen(true)} className="rounded-lg p-1.5 text-slate-300" aria-label="Buka menu">
            <Menu className="size-6" />
          </button>
          <Logo size={30} />
          {area === 'parent' ? (
            <Link href="/orang-tua/notifikasi" className="relative rounded-lg p-1.5 text-slate-300" aria-label="Notifikasi">
              <Bell className="size-5" />
              {unread > 0 && <span className="absolute top-0.5 right-0.5 size-2 rounded-full bg-brand-400" />}
            </Link>
          ) : (
            <span className="w-8" />
          )}
        </div>
        <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:py-10">{children}</main>
      </div>
    </div>
  );
}
