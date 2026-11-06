import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Logo } from './Logo';

/** Kerangka halaman publik — tanpa header bar, hanya tombol kembali ke beranda */
export function PublicShell({ children, back = '/', backLabel = 'Beranda' }: { children: React.ReactNode; back?: string; backLabel?: string }) {
  return (
    <div className="bg-mesh min-h-dvh">
      <div className="mx-auto max-w-6xl px-4 pt-6 pb-16 sm:px-6">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link
            href={back}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-sm text-slate-300 transition hover:border-brand-300/40 hover:text-white"
          >
            <ArrowLeft className="size-4" /> {backLabel}
          </Link>
          <Logo size={34} />
        </div>
        {children}
      </div>
    </div>
  );
}
