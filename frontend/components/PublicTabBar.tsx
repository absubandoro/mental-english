'use client';

import { Home, LayoutDashboard, MapPin, Newspaper, Palette, UserRound } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { ROLE_HOME } from '@/lib/format';
import { MobileTabBar, TabBarSpacer } from './MobileTabBar';

/** Tab bar bawah untuk halaman publik di HP */
export function PublicTabBar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const on = (p: string) => (p === '/' ? pathname === '/' : pathname === p || pathname.startsWith(p + '/'));
  return (
    <>
      <TabBarSpacer />
      <MobileTabBar
        label="Menu utama"
        items={[
          { key: 'home', href: '/', label: 'Beranda', icon: Home, active: on('/') },
          { key: 'blog', href: '/blog', label: 'Blog', icon: Newspaper, active: on('/blog') },
          { key: 'mading', href: '/mading', label: 'Mading', icon: Palette, active: on('/mading') },
          { key: 'lokasi', href: '/lokasi', label: 'Lokasi', icon: MapPin, active: on('/lokasi') },
          user
            ? { key: 'akun', href: ROLE_HOME[user.role], label: 'Dashboard', icon: LayoutDashboard, active: false }
            : { key: 'akun', href: '/login', label: 'Akun', icon: UserRound, active: on('/login') || on('/daftar') },
        ]}
      />
    </>
  );
}
