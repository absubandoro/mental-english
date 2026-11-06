import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { FilterBar } from '@/components/FilterBar';
import { PublicShell } from '@/components/PublicShell';
import { ServerPagination } from '@/components/ServerPagination';
import { DoodleCluster } from '@/components/CoverArt';
import { MadingNote } from '@/components/MadingNote';
import { serverGet } from '@/lib/server-api';
import type { Branch, Mading, Paged } from '@/lib/types';

export const metadata: Metadata = { title: 'Mading', description: 'Majalah dinding karya pelajar Mental English.' };
export const dynamic = 'force-dynamic';

type SP = Promise<{ q?: string; branchId?: string; page?: string }>;

export default async function MadingPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const [branches, list] = await Promise.all([serverGet<Branch[]>('/branches'), serverGet<Paged<Mading>>('/mading', { ...sp, limit: '12' })]);

  return (
    <PublicShell>
      <header className="relative mb-10 grid items-center gap-6 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-pink-500/20 via-navy-600/30 to-ink-900 p-6 sm:p-10 md:grid-cols-[1.1fr_1fr]">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-pink-300 px-3 py-1 text-xs font-bold tracking-wider text-pink-950 uppercase">
            🎨 Mading
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold text-white sm:text-5xl">
            Karya keren <span className="text-pink-300">pelajar kami</span>
          </h1>
          <p className="mt-3 max-w-xl text-slate-300">Cerita, puisi, opini, dan gambar berbahasa Inggris yang ditempel langsung oleh pelajar Mental English.</p>
        </div>
        <DoodleCluster className="mx-auto hidden w-full max-w-sm sm:block" />
      </header>
      <Suspense>
        <FilterBar branches={branches ?? []} />
      </Suspense>

      {!list ? (
        <p className="mt-10 text-center text-slate-400">Tidak dapat memuat mading. Coba lagi nanti.</p>
      ) : list.data.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-white/10 py-16 text-center text-slate-400">Belum ada karya yang cocok.</p>
      ) : (
        <div className="mt-8 rounded-3xl border border-white/10 bg-[radial-gradient(rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:18px_18px] p-5 sm:p-8">
          <div className="grid gap-x-6 gap-y-9 pt-2 sm:grid-cols-2 lg:grid-cols-3">
            {list.data.map((m, i) => (
              <Link key={m.id} href={`/mading/${m.id}`} className="group block">
                <MadingNote m={m} index={i} />
              </Link>
            ))}
          </div>
        </div>
      )}
      {list && <ServerPagination base="/mading" params={sp} page={list.page} total={list.total} limit={list.limit} />}
    </PublicShell>
  );
}
