'use client';

import Link from 'next/link';
import type { Mading } from '@/lib/types';
import { MadingNote } from './MadingNote';

/** Grid mading untuk dashboard (pelajar, orang tua, admin) — gaya kertas tempel yang sama dengan halaman publik */
export function MadingGrid({ items, actions }: { items: Mading[]; actions?: (m: Mading) => React.ReactNode }) {
  return (
    <div className="grid gap-x-6 gap-y-9 pt-3 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((m, i) => {
        const note = (
          <MadingNote
            m={m}
            index={i}
            footer={
              <>
                {!m.published && <span className="rounded-full bg-black/10 px-2 py-0.5 text-[11px] font-semibold">Disembunyikan</span>}
                {actions && (
                  <div className="flex gap-0.5 rounded-lg bg-white/80 [&_button]:text-slate-700 [&_button:hover]:bg-black/5 [&_button:hover]:text-slate-900" onClick={(e) => e.preventDefault()}>
                    {actions(m)}
                  </div>
                )}
              </>
            }
          />
        );
        return m.published ? (
          <Link key={m.id} href={`/mading/${m.id}`} className="group block">
            {note}
          </Link>
        ) : (
          <div key={m.id} className="group">
            {note}
          </div>
        );
      })}
    </div>
  );
}
