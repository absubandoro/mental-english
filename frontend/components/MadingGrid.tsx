'use client';

import Link from 'next/link';
import { formatDate } from '@/lib/format';
import type { Mading } from '@/lib/types';
import { Badge } from './ui';

export function MadingGrid({ items, actions }: { items: Mading[]; actions?: (m: Mading) => React.ReactNode }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((m) => (
        <div key={m.id} className="card flex flex-col overflow-hidden">
          {m.imageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={m.imageUrl} alt="" className="aspect-video w-full object-cover" />
          )}
          <div className="flex flex-1 flex-col p-5">
            <div className="flex items-center gap-2">
              <Badge tone="navy">{m.category}</Badge>
              {!m.published && <Badge tone="amber">Disembunyikan</Badge>}
            </div>
            <h3 className="mt-2 font-display text-lg font-bold text-white">
              {m.published ? (
                <Link href={`/mading/${m.id}`} className="hover:text-brand-200">
                  {m.title}
                </Link>
              ) : (
                m.title
              )}
            </h3>
            <p className="mt-1 line-clamp-3 text-sm text-slate-400">{m.content}</p>
            <div className="mt-auto flex items-center justify-between gap-2 pt-4 text-xs text-slate-500">
              <span>
                {m.author?.name ? `${m.author.name} · ` : ''}
                {formatDate(m.createdAt, { day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
              {actions && <div className="flex gap-1">{actions(m)}</div>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
