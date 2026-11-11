'use client';

import { Building2, LayoutDashboard, LogOut, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BrandMark } from '@/components/Logo';
import { useOrg } from '@/components/OrgProvider';
import { Avatar, Spinner } from '@/components/ui';
import { PlatformAuthProvider, usePlatformAuth } from '@/lib/platform';

const NAV = [
  { href: '/platform', label: 'Ringkasan', icon: LayoutDashboard },
  { href: '/platform/lembaga', label: 'Lembaga', icon: Building2 },
  { href: '/platform/pengelola', label: 'Pengelola & Akun', icon: ShieldCheck },
];

export function PlatformShell({ children }: { children: React.ReactNode }) {
  const org = useOrg();
  // Panel hanya ada di domain platform (mis. nofosys.id / platform.localhost), tidak di domain lembaga
  if (!org.platform) {
    return (
      <main className="bg-mesh flex min-h-dvh items-center justify-center p-6 text-center">
        <div className="card max-w-md p-8">
          <h1 className="font-display text-2xl font-bold text-white">Halaman tidak tersedia</h1>
          <p className="mt-2 text-sm text-slate-400">Panel pengelola hanya dapat dibuka dari domain platform.</p>
          <Link href="/" className="mt-5 inline-block text-sm text-brand-300 hover:underline">
            Kembali ke beranda
          </Link>
        </div>
      </main>
    );
  }
  return (
    <PlatformAuthProvider>
      <Frame>{children}</Frame>
    </PlatformAuthProvider>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  const { admin, loading, logout } = usePlatformAuth();
  const path = usePathname();
  const org = useOrg();
  if (path === '/platform/masuk') return <>{children}</>;
  if (loading || !admin) return <Spinner />;
  const active = (href: string) => (href === '/platform' ? path === href : path.startsWith(href));

  return (
    <div className="bg-mesh min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-white/5 bg-ink-900/80 p-4 backdrop-blur lg:flex">
        <Link href="/platform" className="flex items-center gap-2.5 px-2 py-1">
          <BrandMark size={36} />
          <div>
            <div className="font-display text-lg leading-none font-bold text-white">{org.name}</div>
            <div className="mt-1 text-[11px] tracking-wider text-brand-300 uppercase">Panel pengelola</div>
          </div>
        </Link>
        <nav className="mt-8 flex-1 space-y-1">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${active(n.href) ? 'bg-brand-500/15 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
            >
              <n.icon className={`size-[18px] ${active(n.href) ? 'text-brand-300' : ''}`} /> {n.label}
            </Link>
          ))}
        </nav>
        <div className="flex items-center gap-3 rounded-xl bg-white/[0.03] p-3">
          <Avatar name={admin.name} size={34} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-medium text-white">{admin.name}</div>
            <div className="truncate text-xs text-slate-500">{admin.email}</div>
          </div>
          <button onClick={logout} className="rounded-lg p-2 text-slate-400 hover:bg-rose-500/10 hover:text-rose-300" aria-label="Keluar">
            <LogOut className="size-4" />
          </button>
        </div>
      </aside>

      {/* HP: bar atas + tab bawah */}
      <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-white/5 bg-ink-950/85 px-4 pt-[env(safe-area-inset-top)] backdrop-blur-xl lg:hidden">
        <BrandMark size={30} />
        <div className="flex-1 font-display font-bold text-white">{org.name} · Panel</div>
        <button onClick={logout} className="rounded-lg p-2 text-slate-400" aria-label="Keluar">
          <LogOut className="size-5" />
        </button>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-3 border-t border-white/10 bg-ink-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
        {NAV.map((n) => (
          <Link key={n.href} href={n.href} className={`flex flex-col items-center gap-1 py-2.5 text-[11px] ${active(n.href) ? 'text-brand-300' : 'text-slate-400'}`}>
            <n.icon className="size-5" /> {n.label.split(' ')[0]}
          </Link>
        ))}
      </nav>

      <main className="mx-auto max-w-6xl px-4 pt-5 pb-28 sm:px-6 lg:pt-8 lg:pb-12 lg:pl-[calc(16rem+1.5rem)] xl:max-w-none xl:pr-10">{children}</main>
    </div>
  );
}
