import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Logo } from './Logo';
import { PublicTabBar } from './PublicTabBar';

/**
 * Kerangka halaman publik — tanpa header bar.
 * Desktop: tombol kembali + logo. HP: logo saja, navigasi lewat tab bar bawah ala aplikasi.
 */
export function PublicShell({ children, back = '/', backLabel = 'Beranda' }: { children: React.ReactNode; back?: string; backLabel?: string }) {
  const isRoot = back === '/';
  return (
    <div className="bg-mesh min-h-dvh">
      <div className="mx-auto max-w-6xl px-4 pt-[calc(1.25rem+env(safe-area-inset-top))] pb-10 sm:px-6 sm:pt-6 sm:pb-16">
        <div className="mb-6 flex items-center justify-between gap-4 sm:mb-8">
          <Link
            href={back}
            className={`items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-sm text-slate-300 transition hover:border-brand-300/40 hover:text-white active:scale-95 ${
              isRoot ? 'hidden sm:inline-flex' : 'inline-flex'
            }`}
          >
            <ArrowLeft className="size-4" /> {backLabel}
          </Link>
          <Logo size={34} />
        </div>
        {children}
      </div>
      <PublicTabBar />
    </div>
  );
}
