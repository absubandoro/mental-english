'use client';

import { ChevronLeft, ChevronRight, ImagePlus, Loader2, Play, Video, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { uploadFile } from '@/lib/api';
import type { MediaItem } from '@/lib/types';

/** Unggah banyak foto / video sekaligus, dengan progres */
export function MediaUploader({
  label = 'Foto & video',
  value,
  onChange,
  max = 10,
  accept = 'image/*,video/mp4,video/webm,video/quicktime',
  hint = 'Foto maks. 8 MB, video maks. 100 MB (mp4/webm/mov).',
}: {
  label?: string;
  value: MediaItem[];
  onChange: (items: MediaItem[]) => void;
  max?: number;
  accept?: string;
  hint?: string;
}) {
  const ref = useRef<HTMLInputElement>(null);
  const [uploads, setUploads] = useState<{ name: string; pct: number }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const latest = useRef(value);
  latest.current = value;

  const pick = async (files: FileList | null) => {
    if (!files?.length) return;
    setError(null);
    const list = Array.from(files).slice(0, Math.max(0, max - value.length));
    if (list.length < files.length) setError(`Maksimal ${max} file`);
    setUploads(list.map((f) => ({ name: f.name, pct: 0 })));
    for (const [i, f] of list.entries()) {
      try {
        const r = await uploadFile(f, (pct) => setUploads((u) => u.map((x, j) => (j === i ? { ...x, pct } : x))));
        latest.current = [...latest.current, { url: r.url, type: r.type, name: r.name }];
        onChange(latest.current);
      } catch (e) {
        setError(`${f.name}: ${(e as Error).message}`);
      }
    }
    setUploads([]);
  };

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="label mb-0">{label}</span>
        <span className="text-xs text-slate-500">
          {value.length}/{max}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
        {value.map((m, i) => (
          <div key={m.url + i} className="group relative aspect-square overflow-hidden rounded-xl bg-ink-900 ring-1 ring-white/10">
            {m.type === 'video' ? (
              <div className="flex size-full flex-col items-center justify-center gap-1 bg-gradient-to-br from-navy-600 to-ink-900 text-slate-300">
                <Video className="size-6" />
                <span className="line-clamp-1 px-2 text-[10px]">{m.name ?? 'video'}</span>
              </div>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.url} alt="" className="size-full object-cover" />
            )}
            <button
              type="button"
              onClick={() => onChange(value.filter((_, j) => j !== i))}
              className="absolute top-1 right-1 rounded-full bg-ink-950/80 p-1 text-white opacity-90 hover:bg-rose-500"
              aria-label="Hapus lampiran"
            >
              <X className="size-3.5" />
            </button>
          </div>
        ))}
        {uploads.map((u) => (
          <div key={u.name} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl bg-white/5 p-2 text-center ring-1 ring-white/10">
            <Loader2 className="size-5 animate-spin text-brand-300" />
            <span className="line-clamp-1 text-[10px] text-slate-400">{u.name}</span>
            <div className="h-1 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full bg-brand-400 transition-all" style={{ width: `${u.pct}%` }} />
            </div>
          </div>
        ))}
        {value.length + uploads.length < max && (
          <button
            type="button"
            onClick={() => ref.current?.click()}
            disabled={uploads.length > 0}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-white/15 text-slate-400 transition hover:border-brand-400 hover:text-brand-200 disabled:opacity-50"
          >
            <ImagePlus className="size-6" />
            <span className="text-[11px]">Tambah</span>
          </button>
        )}
      </div>
      <input ref={ref} type="file" accept={accept} multiple hidden onChange={(e) => (pick(e.target.files), (e.target.value = ''))} />
      <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      {error && <p className="mt-1 text-xs text-rose-300">{error}</p>}
    </div>
  );
}

/** Galeri foto / video dengan tampilan layar penuh */
export function MediaGallery({ items, className = '' }: { items: MediaItem[]; className?: string }) {
  const [open, setOpen] = useState<number | null>(null);
  useEffect(() => {
    if (open == null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null);
      if (e.key === 'ArrowRight') setOpen((i) => (i == null ? i : (i + 1) % items.length));
      if (e.key === 'ArrowLeft') setOpen((i) => (i == null ? i : (i - 1 + items.length) % items.length));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, items.length]);
  if (!items?.length) return null;
  const cur = open != null ? items[open] : null;
  return (
    <>
      <div className={`grid gap-2 ${items.length === 1 ? 'grid-cols-1' : 'grid-cols-2 sm:grid-cols-3'} ${className}`}>
        {items.map((m, i) => (
          <button
            key={m.url + i}
            type="button"
            onClick={() => setOpen(i)}
            className={`group relative overflow-hidden rounded-xl bg-ink-900 ring-1 ring-white/10 ${items.length === 1 ? 'aspect-video' : 'aspect-square'}`}
            aria-label={m.type === 'video' ? 'Putar video' : 'Lihat foto'}
          >
            {m.type === 'video' ? (
              <>
                <video src={m.url + '#t=0.5'} preload="metadata" muted playsInline className="size-full object-cover" />
                <span className="absolute inset-0 flex items-center justify-center bg-ink-950/30">
                  <span className="flex size-12 items-center justify-center rounded-full bg-white/90 text-ink-900 shadow-xl transition group-hover:scale-110">
                    <Play className="size-6 fill-current" />
                  </span>
                </span>
              </>
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.url} alt="" className="size-full object-cover transition duration-300 group-hover:scale-105" />
            )}
          </button>
        ))}
      </div>
      {cur && (
        <div className="animate-fade-in fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4" onClick={() => setOpen(null)}>
          <button className="absolute top-[calc(1rem+env(safe-area-inset-top))] right-4 rounded-full bg-white/10 p-2 text-white" aria-label="Tutup">
            <X className="size-6" />
          </button>
          {items.length > 1 && (
            <>
              <button
                className="absolute left-2 rounded-full bg-white/10 p-2 text-white sm:left-6"
                onClick={(e) => (e.stopPropagation(), setOpen((open! - 1 + items.length) % items.length))}
                aria-label="Sebelumnya"
              >
                <ChevronLeft className="size-6" />
              </button>
              <button
                className="absolute right-2 rounded-full bg-white/10 p-2 text-white sm:right-6"
                onClick={(e) => (e.stopPropagation(), setOpen((open! + 1) % items.length))}
                aria-label="Berikutnya"
              >
                <ChevronRight className="size-6" />
              </button>
            </>
          )}
          <div onClick={(e) => e.stopPropagation()} className="max-h-full max-w-5xl">
            {cur.type === 'video' ? (
              <video key={cur.url} src={cur.url} controls autoPlay playsInline className="max-h-[85dvh] w-full rounded-xl" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cur.url} alt="" className="max-h-[85dvh] w-auto rounded-xl object-contain" />
            )}
            <p className="mt-2 text-center text-xs text-white/60">
              {open! + 1} / {items.length}
            </p>
          </div>
        </div>
      )}
    </>
  );
}

/** Gambar sampul pertama dari daftar media (untuk kartu) */
export function firstImage(items: MediaItem[] | undefined | null) {
  return items?.find((m) => m.type === 'image')?.url ?? null;
}

/** URL video: tempel link YouTube atau unggah file video langsung */
export function VideoField({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [pct, setPct] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isFile = !!value && !/youtu\.?be/.test(value);
  return (
    <div>
      <span className="label">Video</span>
      <div className="flex gap-2">
        <input className="input" placeholder="Tempel link YouTube, atau unggah file video →" value={value} onChange={(e) => onChange(e.target.value)} />
        <button
          type="button"
          onClick={() => ref.current?.click()}
          disabled={pct != null}
          className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 hover:bg-white/10 disabled:opacity-60"
        >
          {pct != null ? <Loader2 className="size-4 animate-spin" /> : <Video className="size-4" />}
          {pct != null ? `${pct}%` : 'Unggah'}
        </button>
      </div>
      {pct != null && (
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full bg-brand-400 transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}
      {isFile && <video src={value} controls preload="metadata" className="mt-2 max-h-56 w-full rounded-xl bg-black" />}
      <p className="mt-1 text-xs text-slate-500">File mp4/webm/mov maks. 100 MB. Untuk video panjang, sebaiknya unggah ke YouTube lalu tempel linknya.</p>
      {error && <p className="mt-1 text-xs text-rose-300">{error}</p>}
      <input
        ref={ref}
        type="file"
        accept="video/mp4,video/webm,video/quicktime"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = '';
          if (!f) return;
          setError(null);
          setPct(0);
          try {
            onChange((await uploadFile(f, setPct)).url);
          } catch (er) {
            setError((er as Error).message);
          } finally {
            setPct(null);
          }
        }}
      />
    </div>
  );
}
