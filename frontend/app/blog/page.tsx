import { Calendar, MapPin, PlayCircle } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { CoverArt, paletteFor } from '@/components/CoverArt';
import { FilterBar } from '@/components/FilterBar';
import { PublicShell } from '@/components/PublicShell';
import { ServerPagination } from '@/components/ServerPagination';
import { formatDate, youtubeId } from '@/lib/format';
import { getOrg } from '@/lib/org-server';
import { serverGet } from '@/lib/server-api';
import type { Branch, Paged, Post } from '@/lib/types';

export const metadata: Metadata = { title: 'Blog & Vlog', description: 'Artikel dan vlog kegiatan dari setiap cabang.' };
export const dynamic = 'force-dynamic';

type SP = Promise<{ q?: string; branchId?: string; type?: string; page?: string }>;

export default async function BlogPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const [branches, posts, org] = await Promise.all([
    serverGet<Branch[]>('/branches'),
    serverGet<Paged<Post>>('/posts', { ...sp, limit: '9' }),
    getOrg(),
  ]);
  // Kolase foto kegiatan dari foto lembaga (Identitas Lembaga)
  const collage = [
    { src: org.photos.holiday, cls: 'left-0 top-4 -rotate-6', tape: 'bg-amber-300/90' },
    { src: org.photos.team, cls: 'right-0 top-0 rotate-6', tape: 'bg-pink-300/90' },
    { src: org.photos.welcome, cls: 'left-1/2 top-16 -translate-x-1/2 rotate-2', tape: 'bg-emerald-300/90' },
  ].filter((f): f is { src: string; cls: string; tape: string } => !!f.src);

  return (
    <PublicShell>
      <header className="relative mb-10 grid items-center gap-8 overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-brand-500/25 via-navy-600/30 to-ink-900 p-6 sm:p-10 md:grid-cols-[1.1fr_1fr]">
        <div className="relative z-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-amber-300 px-3 py-1 text-xs font-bold tracking-wider text-amber-950 uppercase">
            ✨ Blog & Vlog
          </span>
          <h1 className="mt-4 font-display text-4xl font-extrabold text-white sm:text-5xl">
            Cerita seru dari <span className="text-amber-300">kelas kami</span>
          </h1>
          <p className="mt-3 max-w-xl text-slate-300">Tips belajar, kegiatan outdoor, dan momen seru pelajar {org.name} di setiap cabang.</p>
        </div>
        {/* Kolase foto kegiatan */}
        <div className="relative mx-auto hidden h-56 w-full max-w-sm sm:block">
          {collage.map((f) => (
            <div key={f.src} className={`absolute w-44 rounded-lg bg-white p-2 pb-6 shadow-2xl shadow-black/40 ${f.cls}`}>
              <span className={`absolute -top-2 left-1/2 h-5 w-14 -translate-x-1/2 rotate-3 rounded-sm ${f.tape}`} />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.src} alt="" className="aspect-[4/3] w-full rounded object-cover" />
            </div>
          ))}
        </div>
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
              <Link
                key={p.id}
                href={`/blog/${p.slug}`}
                className="card group flex flex-col overflow-hidden border-t-4 transition hover:-translate-y-1 hover:shadow-2xl hover:shadow-brand-500/10"
                style={{ borderTopColor: paletteFor(p.id).to }}
              >
                <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-brand-500/30 via-navy-600/40 to-ink-900">
                  {cover ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={cover} alt="" className="size-full object-cover transition duration-500 group-hover:scale-105" />
                  ) : (
                    <CoverArt seed={p.id} kind={p.type} className="size-full transition duration-500 group-hover:scale-105" />
                  )}
                  <span
                    className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs font-bold shadow-lg"
                    style={{ color: paletteFor(p.id).from }}
                  >
                    {p.type === 'VLOG' && <PlayCircle className="size-3.5" />} {p.type === 'VLOG' ? 'Vlog' : 'Blog'}
                  </span>
                  {p.type === 'VLOG' && cover && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex size-14 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow-xl transition group-hover:scale-110">
                        <PlayCircle className="size-8" />
                      </span>
                    </span>
                  )}
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
