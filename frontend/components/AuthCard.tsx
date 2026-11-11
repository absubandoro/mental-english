import { BrandMark } from './Logo';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { PublicTabBar } from './PublicTabBar';

export function AuthCard({ title, desc, children, footer }: { title: string; desc: string; children: React.ReactNode; footer: React.ReactNode }) {
  return (
    <main className="bg-mesh flex min-h-dvh flex-col items-center justify-center px-4 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-6 sm:py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-6 hidden sm:inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="size-4" /> Beranda
        </Link>
        <div className="card p-6 sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <BrandMark size={52} />
            <div>
              <h1 className="font-display text-2xl font-bold text-white">{title}</h1>
              <p className="text-sm text-slate-400">{desc}</p>
            </div>
          </div>
          {children}
        </div>
        <p className="mt-5 text-center text-sm text-slate-400">{footer}</p>
      </div>
      <PublicTabBar />
    </main>
  );
}
