import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { FilterBar } from '@/components/FilterBar';
import { PublicShell } from '@/components/PublicShell';
import { ServerPagination } from '@/components/ServerPagination';
import { Avatar } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { serverGet } from '@/lib/server-api';
import type { Branch, Mading, Paged } from '@/lib/types';

export const metadata: Metadata = { title: 'Mading', description: 'Majalah dinding karya pelajar Mental English.' };
export const dynamic = 'force-dynamic';

type SP = Promise<{ q?: string; branchId?: string; page?: string }>;
const TINTS = ['from-brand-500/25', 'from-navy-500/50', 'from-sky-400/20', 'from-indigo-500/25'];

export default async function MadingPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const [branches, list] = await Promise.all([serverGet<Branch[]>('/branches'), serverGet<Paged<Mading>>('/mading', { ...sp, limit: '12' })]);

  return (
    <PublicShell>
      <header className="mb-8">
        <p className="text-sm font-semibold tracking-[0.2em] text-brand-300 uppercase">Mading</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold text-white sm:text-5xl">Karya pelajar kami</h1>
        <p className="mt-3 max-w-2xl text-slate-400">Tulisan, cerita, dan puisi berbahasa Inggris karya pelajar Mental English.</p>
      </header>
      <Suspense>
        <FilterBar branches={branches ?? []} />
      </Suspense>

      {!list ? (
        <p className="mt-10 text-center text-slate-400">Tidak dapat memuat mading. Coba lagi nanti.</p>
      ) : list.data.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-white/10 py-16 text-center text-slate-400">Belum ada karya yang cocok.</p>
      ) : (
        <div className="mt-8 columns-1 gap-5 sm:columns-2 lg:columns-3 [&>*]:mb-5">
          {list.data.map((m, i) => (
            <Link
              key={m.id}
              href={`/mading/${m.id}`}
              className={`card group block break-inside-avoid overflow-hidden bg-gradient-to-br ${TINTS[i % TINTS.length]} to-transparent transition hover:border-brand-300/30`}
            >
              {m.imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.imageUrl} alt="" className="w-full object-cover" />
              )}
              <div className="p-5">
                <span className="text-xs font-semibold tracking-wider text-brand-300 uppercase">{m.category}</span>
                <h2 className="mt-1 font-display text-xl font-bold text-white group-hover:text-brand-200">{m.title}</h2>
                <p className="mt-2 line-clamp-4 text-sm text-slate-300">{m.content}</p>
                <div className="mt-4 flex items-center gap-2.5 text-xs text-slate-400">
                  <Avatar name={m.author?.name ?? '?'} src={m.author?.avatarUrl} size={28} />
                  <div>
                    <div className="font-medium text-slate-200">{m.author?.name}</div>
                    <div>
                      {m.branch?.city ?? m.branch?.name} · {formatDate(m.createdAt, { day: 'numeric', month: 'short' })}
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
      {list && <ServerPagination base="/mading" params={sp} page={list.page} total={list.total} limit={list.limit} />}
    </PublicShell>
  );
}
