import { Calendar, MapPin } from 'lucide-react';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/PublicShell';
import { CoverArt } from '@/components/CoverArt';
import { RichText } from '@/components/RichText';
import { Avatar } from '@/components/ui';
import { formatDate, youtubeId } from '@/lib/format';
import { serverGet } from '@/lib/server-api';
import type { Post } from '@/lib/types';

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const post = await serverGet<Post>(`/posts/${(await params).slug}`);
  if (!post) return { title: 'Artikel tidak ditemukan' };
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: { title: post.title, description: post.excerpt ?? undefined, ...(post.coverUrl ? { images: [post.coverUrl] } : {}) },
  };
}

export default async function BlogDetail({ params }: { params: Params }) {
  const post = await serverGet<Post>(`/posts/${(await params).slug}`);
  if (!post) notFound();
  const yt = youtubeId(post.videoUrl);

  return (
    <PublicShell back="/blog" backLabel="Semua artikel">
      <article className="mx-auto max-w-3xl">
        <span className="rounded-full bg-brand-500/15 px-3 py-1 text-xs font-semibold text-brand-200 ring-1 ring-brand-400/30">
          {post.type === 'VLOG' ? 'Vlog' : 'Blog'}
        </span>
        <h1 className="mt-4 font-display text-3xl leading-tight font-extrabold text-white sm:text-5xl">{post.title}</h1>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-slate-400">
          <span className="inline-flex items-center gap-2">
            <Avatar name={post.author?.name ?? '?'} src={post.author?.avatarUrl} size={28} /> {post.author?.name}
          </span>
          <span className="inline-flex items-center gap-1.5"><Calendar className="size-4" />{formatDate(post.createdAt)}</span>
          {post.branch && <span className="inline-flex items-center gap-1.5"><MapPin className="size-4" />{post.branch.name}</span>}
        </div>

        {yt ? (
          <div className="mt-8 aspect-video overflow-hidden rounded-2xl ring-1 ring-white/10">
            <iframe
              className="size-full"
              src={`https://www.youtube-nocookie.com/embed/${yt}`}
              title={post.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        ) : post.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.coverUrl} alt="" className="mt-8 aspect-video w-full rounded-2xl object-cover ring-1 ring-white/10" />
        ) : (
          <CoverArt seed={post.id} kind={post.type} className="mt-8 aspect-[16/7] w-full rounded-2xl ring-1 ring-white/10" />
        )}

        <div className="mt-8">
          <RichText text={post.content} />
        </div>
      </article>
    </PublicShell>
  );
}
