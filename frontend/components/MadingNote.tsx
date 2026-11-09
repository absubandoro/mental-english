import { Play } from 'lucide-react';
import { CoverArt, paletteFor } from './CoverArt';
import { formatDate, initials } from '@/lib/format';
import type { Mading } from '@/lib/types';

const TILTS = ['-rotate-[1.5deg]', 'rotate-[1deg]', '-rotate-[0.5deg]', 'rotate-[1.5deg]', 'rotate-0', '-rotate-1'];
const PINS = ['#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7', '#ec4899'];

/** Kartu mading bergaya kertas tempel (dipakai di halaman publik & dashboard) */
export function MadingNote({ m, index = 0, footer }: { m: Mading; index?: number; footer?: React.ReactNode }) {
  const p = paletteFor(m.id);
  const cover = m.imageUrl || m.media?.find((x) => x.type === 'image')?.url || null;
  const hasVideo = m.media?.some((x) => x.type === 'video');
  return (
    <article
      className={`relative flex h-full flex-col rounded-md p-3 pb-4 shadow-[0_18px_40px_-12px_rgba(0,0,0,0.6)] transition duration-300 group-hover:rotate-0 group-hover:-translate-y-1 ${TILTS[index % TILTS.length]}`}
      style={{ background: p.paper, color: p.ink }}
    >
      {/* Paku tempel */}
      <span
        aria-hidden
        className="absolute -top-2.5 left-1/2 z-10 size-5 -translate-x-1/2 rounded-full shadow-md ring-2 ring-white/70"
        style={{ background: `radial-gradient(circle at 35% 35%, #fff8, ${PINS[index % PINS.length]} 55%)` }}
      />
      <div className="relative overflow-hidden rounded-sm">
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cover} alt="" className="aspect-[16/10] w-full object-cover" />
        ) : (
          <CoverArt seed={m.id} kind={m.category} className="aspect-[16/10] w-full" />
        )}
        {(m.media?.length ?? 0) > 0 && (
          <span className="absolute right-2 bottom-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white">
            {hasVideo && <Play className="size-3 fill-current" />}
            {m.media.length} media
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col px-1.5 pt-3">
        <span className="w-fit rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wider text-white uppercase" style={{ background: p.from }}>
          {m.category}
        </span>
        <h3 className="mt-2 font-display text-xl leading-snug font-bold">{m.title}</h3>
        <p className="mt-1.5 line-clamp-3 text-sm leading-relaxed opacity-80">{m.content}</p>
        <div className="mt-auto flex items-center gap-2.5 pt-4 text-xs">
          {m.author && (
            <>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white" style={{ background: p.from }}>
                {initials(m.author.name)}
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{m.author.name}</div>
                <div className="opacity-70">
                  {m.branch?.city ?? m.branch?.name ? `${m.branch?.city ?? m.branch?.name} · ` : ''}
                  {formatDate(m.createdAt, { day: 'numeric', month: 'short' })}
                </div>
              </div>
            </>
          )}
          {footer}
        </div>
      </div>
    </article>
  );
}
