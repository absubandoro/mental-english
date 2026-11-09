'use client';

import {
  Bell, Building2, CalendarCheck, CalendarDays, ChartPie, ChevronRight, CreditCard, FileBadge, GraduationCap, Home, LayoutDashboard, LayoutGrid,
  LogOut, Megaphone, Newspaper, Palette, ReceiptText, School, ShieldCheck, User as UserIcon, UserPlus, Users, UsersRound, Wallet,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth, useRequireRole } from '@/lib/auth';
import { ROLE_LABEL } from '@/lib/format';
import type { Role } from '@/lib/types';
import { useBranches } from '@/lib/useBranches';
import { Logo } from './Logo';
import { MobileTabBar, TabBarSpacer, type TabItem } from './MobileTabBar';
import { Avatar, Modal, Spinner } from './ui';

interface NavItem {
  href: string;
  label: string;
  /** Label pendek untuk tab bar HP */
  short?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  roles?: Role[];
}

type Area = 'student' | 'parent' | 'teacher' | 'admin' | 'finance';

const NAV: Record<Area, NavItem[]> = {
  student: [
    { href: '/pelajar', label: 'Profil Saya', short: 'Profil', icon: UserIcon },
    { href: '/pelajar/mading', label: 'Mading Saya', short: 'Mading', icon: Palette },
    { href: '/pelajar/kalender', label: 'Kalender', icon: CalendarDays },
    { href: '/pelajar/rapor', label: 'Rapor', icon: FileBadge },
  ],
  parent: [
    { href: '/orang-tua', label: 'Profil Saya', short: 'Profil', icon: UserIcon },
    { href: '/orang-tua/anak', label: 'Profil Anak', short: 'Anak', icon: GraduationCap },
    { href: '/orang-tua/dashboard', label: 'Dashboard Anak', short: 'Dashboard', icon: ChartPie },
    { href: '/orang-tua/rapor', label: 'Rapor Anak', short: 'Rapor', icon: FileBadge },
    { href: '/orang-tua/kalender', label: 'Kalender', icon: CalendarDays },
    { href: '/orang-tua/mading', label: 'Mading Anak', short: 'Mading', icon: Palette },
    { href: '/orang-tua/pembayaran', label: 'Pembayaran', short: 'Bayar', icon: CreditCard },
    { href: '/orang-tua/notifikasi', label: 'Notifikasi', short: 'Notifikasi', icon: Bell },
  ],
  teacher: [
    { href: '/pengajar/sesi', label: 'Kelas Hari Ini', short: 'Hari Ini', icon: CalendarCheck },
    { href: '/pengajar/kalender', label: 'Kalender', icon: CalendarDays },
    { href: '/pengajar/rapor', label: 'Rapor', icon: FileBadge },
    { href: '/pengajar', label: 'Kelas yang Diajar', short: 'Kelas', icon: School },
    { href: '/pengajar/notifikasi', label: 'Notifikasi', icon: Bell },
    { href: '/pengajar/profil', label: 'Profil Saya', short: 'Profil', icon: UserIcon },
  ],
  admin: [
    { href: '/admin', label: 'Ringkasan', short: 'Ringkasan', icon: LayoutDashboard },
    { href: '/admin/pendaftaran', label: 'Pendaftaran Siswa', short: 'Daftar', icon: UserPlus },
    { href: '/admin/kalender', label: 'Kalender', icon: CalendarDays },
    { href: '/admin/kelas', label: 'Kelas', icon: School },
    { href: '/admin/rapor', label: 'Rapor', icon: FileBadge },
    { href: '/admin/pembayaran', label: 'Pembayaran', short: 'Bayar', icon: CreditCard },
    { href: '/admin/tagihan', label: 'Pengaturan Tagihan', short: 'Tagihan', icon: ReceiptText },
    { href: '/admin/blog', label: 'Blog & Vlog', short: 'Blog', icon: Newspaper },
    { href: '/admin/mading', label: 'Moderasi Mading', short: 'Mading', icon: Palette },
    { href: '/admin/pelajar', label: 'User Anak', short: 'Anak', icon: GraduationCap },
    { href: '/admin/orang-tua', label: 'User Orang Tua', short: 'Orang Tua', icon: UsersRound },
    { href: '/admin/pengajar', label: 'Pengajar', icon: Users },
    { href: '/admin/keuangan', label: 'User Keuangan', icon: Wallet },
    { href: '/admin/notifikasi', label: 'Push Notifikasi', short: 'Notif', icon: Megaphone },
    { href: '/admin/kotak-masuk', label: 'Kotak Masuk', icon: Bell },
    { href: '/admin/cabang', label: 'Cabang', icon: Building2, roles: ['SUPER_ADMIN'] },
    { href: '/admin/admin-cabang', label: 'Admin Cabang', icon: ShieldCheck, roles: ['SUPER_ADMIN'] },
    { href: '/admin/profil', label: 'Profil Saya', short: 'Profil', icon: UserIcon },
  ],
  finance: [
    { href: '/keuangan', label: 'Pembayaran', short: 'Bayar', icon: CreditCard },
    { href: '/keuangan/tagihan', label: 'Pengaturan Tagihan', short: 'Tagihan', icon: ReceiptText },
    { href: '/keuangan/kalender', label: 'Kalender', icon: CalendarDays },
    { href: '/keuangan/kotak-masuk', label: 'Kotak Masuk', short: 'Pesan', icon: Bell },
    { href: '/keuangan/profil', label: 'Profil Saya', short: 'Profil', icon: UserIcon },
  ],
};

/** Menu utama di tab bar HP (maks. 4 + tombol "Lainnya") */
const MOBILE_TABS: Record<Area, string[]> = {
  student: ['/pelajar/mading', '/pelajar/kalender', '/pelajar/rapor', '/pelajar'],
  parent: ['/orang-tua/dashboard', '/orang-tua/rapor', '/orang-tua/pembayaran', '/orang-tua/notifikasi'],
  teacher: ['/pengajar/sesi', '/pengajar/kalender', '/pengajar/rapor', '/pengajar'],
  admin: ['/admin', '/admin/pendaftaran', '/admin/pembayaran', '/admin/kalender'],
  finance: ['/keuangan', '/keuangan/tagihan', '/keuangan/kalender', '/keuangan/kotak-masuk'],
};

/** Halaman kotak masuk notifikasi per area */
const INBOX: Partial<Record<Area, string>> = {
  parent: '/orang-tua/notifikasi',
  teacher: '/pengajar/notifikasi',
  admin: '/admin/kotak-masuk',
  finance: '/keuangan/kotak-masuk',
};

function isActive(href: string, pathname: string) {
  return href === pathname || (href !== `/${pathname.split('/')[1]}` && pathname.startsWith(href + '/'));
}

export function DashboardShell({ area, roles, children }: { area: Area; roles: Role[]; children: React.ReactNode }) {
  const { user, ready } = useRequireRole(roles);
  const { logout, activeBranchId, setActiveBranchId } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [sheet, setSheet] = useState(false);
  const [unread, setUnread] = useState(0);
  const [pendingPay, setPendingPay] = useState(0);
  const [newEnroll, setNewEnroll] = useState(0);
  const { branches } = useBranches();

  useEffect(() => setSheet(false), [pathname]);

  useEffect(() => {
    if (!ready) return;
    const load = () => {
      if (INBOX[area]) api<{ unread: number }>('/notifications/unread-count').then((r) => setUnread(r.unread)).catch(() => undefined);
      const q = activeBranchId ? { branchId: activeBranchId } : undefined;
      if (area === 'admin' || area === 'finance')
        api<{ count: number }>('/admin/payments/pending-count', { query: q }).then((r) => setPendingPay(r.count)).catch(() => undefined);
      if (area === 'admin') api<{ count: number }>('/admin/enrollments/new-count', { query: q }).then((r) => setNewEnroll(r.count)).catch(() => undefined);
    };
    load();
    const t = setInterval(load, 30000);
    window.addEventListener('me:notifications', load);
    return () => {
      clearInterval(t);
      window.removeEventListener('me:notifications', load);
    };
  }, [ready, area, activeBranchId, pathname]);

  if (!ready || !user) {
    return (
      <div className="bg-mesh flex min-h-dvh items-center justify-center">
        <Spinner />
      </div>
    );
  }

  const items = NAV[area].filter((i) => !i.roles || i.roles.includes(user.role));
  const branchName = branches.find((b) => b.id === (user.branchId ?? activeBranchId))?.name;
  const current = items.find((i) => isActive(i.href, pathname));
  const badgeFor = (href: string) => {
    if (href === INBOX[area]) return unread;
    if (href === '/admin/pembayaran' || href === '/keuangan') return pendingPay;
    if (href === '/admin/pendaftaran') return newEnroll;
    return 0;
  };
  const doLogout = () => {
    logout();
    router.replace('/login');
  };

  const tabHrefs = MOBILE_TABS[area];
  const tabs: TabItem[] = tabHrefs
    .map((h) => items.find((i) => i.href === h))
    .filter((i): i is NavItem => !!i)
    .map((i) => ({ key: i.href, href: i.href, label: i.short ?? i.label, icon: i.icon, active: isActive(i.href, pathname) && !sheet, badge: badgeFor(i.href) }));
  const moreItems = items.filter((i) => !tabHrefs.includes(i.href));
  tabs.push({
    key: 'more',
    label: 'Lainnya',
    icon: LayoutGrid,
    onClick: () => setSheet(true),
    active: sheet || (!!current && !tabHrefs.includes(current.href)),
  });

  const userCard = (
    <div className="rounded-2xl border border-white/8 bg-white/[0.03] p-3">
      <div className="flex items-center gap-3">
        <Avatar name={user.name} src={user.avatarUrl} size={40} />
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
  );

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="px-5 pt-5 pb-4">
        <Logo size={36} />
      </div>
      <div className="mx-4 mb-4">{userCard}</div>
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-3" aria-label="Menu dashboard">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href, pathname);
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
              {badgeFor(href) > 0 && <span className="rounded-full bg-brand-500 px-1.5 text-[11px] font-bold text-white">{badgeFor(href)}</span>}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-0.5 border-t border-white/5 p-3">
        <Link href="/" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-white/5 hover:text-white">
          <Home className="size-[18px]" /> Halaman Utama
        </Link>
        <button onClick={doLogout} className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:bg-rose-500/10 hover:text-rose-300">
          <LogOut className="size-[18px]" /> Keluar
        </button>
      </div>
    </div>
  );

  const row = 'flex items-center gap-3.5 px-4 py-3.5 text-[15px] text-slate-200 active:bg-white/5';

  return (
    <div className="bg-mesh min-h-dvh">
      {/* Desktop: sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-white/5 bg-ink-900/80 backdrop-blur lg:block">{sidebar}</aside>

      <div className="lg:pl-64">
        {/* HP: app bar atas */}
        <header className="sticky top-0 z-30 border-b border-white/5 bg-ink-950/85 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
          <div className="flex h-14 items-center gap-3 px-4">
            <Link href="/" aria-label="Halaman utama" className="shrink-0">
              <Image src="/logo.png" alt="" width={32} height={32} className="rounded-full" />
            </Link>
            <div className="min-w-0 flex-1">
              <div className="truncate text-[15px] leading-tight font-semibold text-white">{current?.label ?? 'Mental English'}</div>
              <div className="truncate text-[11px] leading-tight text-slate-400">{branchName ?? ROLE_LABEL[user.role]}</div>
            </div>
            {INBOX[area] && (
              <Link href={INBOX[area]!} className="relative flex size-10 items-center justify-center rounded-full text-slate-300 active:bg-white/10" aria-label="Notifikasi">
                <Bell className="size-[22px]" />
                {unread > 0 && <span className="absolute top-2 right-2 size-2.5 rounded-full bg-rose-500 ring-2 ring-ink-950" />}
              </Link>
            )}
            <button onClick={() => setSheet(true)} className="shrink-0 rounded-full active:scale-95" aria-label="Akun & menu">
              <Avatar name={user.name} src={user.avatarUrl} size={34} />
            </button>
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-4 pt-5 pb-6 sm:px-6 lg:py-10">
          {children}
          <TabBarSpacer />
        </main>
      </div>

      {/* HP: tab bar bawah + sheet "Lainnya" */}
      <MobileTabBar items={tabs} label="Menu utama" />
      <Modal open={sheet} onClose={() => setSheet(false)} title="Menu">
        <div className="space-y-4">
          {userCard}
          {moreItems.length > 0 && (
            <div className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03]">
              {moreItems.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className={row} onClick={() => setSheet(false)}>
                  <span className={`flex size-9 items-center justify-center rounded-xl ${isActive(href, pathname) ? 'bg-brand-500 text-white' : 'bg-brand-500/15 text-brand-200'}`}>
                    <Icon className="size-[18px]" />
                  </span>
                  <span className="flex-1">{label}</span>
                  <ChevronRight className="size-4 text-slate-500" />
                </Link>
              ))}
            </div>
          )}
          <div className="divide-y divide-white/5 overflow-hidden rounded-2xl border border-white/8 bg-white/[0.03]">
            <Link href="/" className={row}>
              <span className="flex size-9 items-center justify-center rounded-xl bg-white/5 text-slate-300">
                <Home className="size-[18px]" />
              </span>
              <span className="flex-1">Halaman Utama</span>
              <ChevronRight className="size-4 text-slate-500" />
            </Link>
            <button onClick={doLogout} className={`${row} w-full text-left text-rose-300`}>
              <span className="flex size-9 items-center justify-center rounded-xl bg-rose-500/10">
                <LogOut className="size-[18px]" />
              </span>
              <span className="flex-1">Keluar</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
