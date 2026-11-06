import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PublicShell } from '@/components/PublicShell';
import { RichText } from '@/components/RichText';
import { Avatar } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { serverGet } from '@/lib/server-api';
import type { Mading } from '@/lib/types';

type Params = Promise<{ id: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const m = await serverGet<Mading>(`/mading/${(await params).id}`);
  return m ? { title: `${m.title} — Mading`, description: m.content.slice(0, 150) } : { title: 'Mading tidak ditemukan' };
}

export default async function MadingDetail({ params }: { params: Params }) {
  const m = await serverGet<Mading>(`/mading/${(await params).id}`);
  if (!m) notFound();
  return (
    <PublicShell back="/mading" backLabel="Semua mading">
      <article className="mx-auto max-w-3xl">
        <span className="text-xs font-semibold tracking-[0.2em] text-brand-300 uppercase">{m.category}</span>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-white sm:text-5xl">{m.title}</h1>
        <div className="mt-5 flex items-center gap-3 text-sm text-slate-400">
          <Avatar name={m.author?.name ?? '?'} src={m.author?.avatarUrl} size={36} />
          <div>
            <div className="font-medium text-slate-200">{m.author?.name}</div>
            <div>
              {m.branch?.name} · {formatDate(m.createdAt)}
            </div>
          </div>
        </div>
        {m.imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={m.imageUrl} alt="" className="mt-8 w-full rounded-2xl object-cover ring-1 ring-white/10" />
        )}
        <div className="mt-6">
          <RichText text={m.content} />
        </div>
      </article>
    </PublicShell>
  );
}
