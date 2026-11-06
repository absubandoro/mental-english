import { Calendar, MapPin, PlayCircle } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { FilterBar } from '@/components/FilterBar';
import { PublicShell } from '@/components/PublicShell';
import { ServerPagination } from '@/components/ServerPagination';
import { formatDate, youtubeId } from '@/lib/format';
import { serverGet } from '@/lib/server-api';
import type { Branch, Paged, Post } from '@/lib/types';

export const metadata: Metadata = { title: 'Blog & Vlog', description: 'Artikel dan vlog kegiatan Mental English dari setiap cabang.' };
export const dynamic = 'force-dynamic';

type SP = Promise<{ q?: string; branchId?: string; type?: string; page?: string }>;

export default async function BlogPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const [branches, posts] = await Promise.all([
    serverGet<Branch[]>('/branches'),
    serverGet<Paged<Post>>('/posts', { ...sp, limit: '9' }),
  ]);

  return (
    <PublicShell>
      <header className="mb-8">
        <p className="text-sm font-semibold tracking-[0.2em] text-brand-300 uppercase">Blog & Vlog</p>
        <h1 className="mt-2 font-display text-4xl font-extrabold text-white sm:text-5xl">Cerita dari kelas kami</h1>
        <p className="mt-3 max-w-2xl text-slate-400">Tips belajar, kegiatan outdoor, dan momen seru pelajar Mental English.</p>
      </header>
      <Suspense>
        <FilterBar
          branches={branches ?? []}
          extra={{ name: 'type', placeholder: 'Semua tipe', options: [{ value: 'BLOG', label: 'Blog' }, { value: 'VLOG', label: 'Vlog' }] }}
        />
      </Suspense>

      {!posts ? (
        <p className="mt-10 text-center text-slate-400">Tidak dapat memuat artikel. Coba lagi nanti.</p>
      ) : posts.data.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed border-white/10 py-16 text-center text-slate-400">Belum ada artikel yang cocok.</p>
      ) : (
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.data.map((p) => {
            const yt = youtubeId(p.videoUrl);
            const cover = p.coverUrl || (yt ? `https://img.youtube.com/vi/${yt}/hqdefault.jpg` : null);
            return (
              <Link key={p.id} href={`/blog/${p.slug}`} className="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-brand-300/30">
                <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-brand-500/30 via-navy-600/40 to-ink-900">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src="/logo.png" alt="" className="absolute top-1/2 left-1/2 size-28 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 transition duration-500 group-hover:scale-110 group-hover:opacity-50" />
                  )}
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-ink-950/80 px-2.5 py-1 text-xs font-semibold text-brand-200 backdrop-blur">
                    {p.type === 'VLOG' && <PlayCircle className="size-3.5" />} {p.type === 'VLOG' ? 'Vlog' : 'Blog'}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <h2 className="font-display text-lg leading-snug font-bold text-white group-hover:text-brand-200">{p.title}</h2>
                  {p.excerpt && <p className="mt-2 line-clamp-2 text-sm text-slate-400">{p.excerpt}</p>}
                  <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-4 text-xs text-slate-500">
                    <span>oleh {p.author?.name}</span>
                    <span className="inline-flex items-center gap-1"><Calendar className="size-3.5" />{formatDate(p.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    {p.branch && <span className="inline-flex items-center gap-1"><MapPin className="size-3.5" />{p.branch.city ?? p.branch.name}</span>}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
      {posts && <ServerPagination base="/blog" params={sp} page={posts.page} total={posts.total} limit={posts.limit} />}
    </PublicShell>
  );
}
