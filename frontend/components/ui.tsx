'use client';

import { ImagePlus, Loader2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { uploadImage } from '@/lib/api';
import { initials } from '@/lib/format';

type BtnVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
const BTN: Record<BtnVariant, string> = {
  primary: 'bg-brand-500 text-white hover:bg-brand-400 shadow-lg shadow-brand-500/20',
  secondary: 'bg-white/5 text-slate-100 border border-white/10 hover:bg-white/10',
  ghost: 'text-slate-300 hover:bg-white/5 hover:text-white',
  danger: 'bg-rose-500/10 text-rose-300 border border-rose-500/20 hover:bg-rose-500/20',
};

export function Button({
  variant = 'primary',
  loading,
  className = '',
  children,
  size = 'md',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; loading?: boolean; size?: 'sm' | 'md' }) {
  return (
    <button
      {...props}
      disabled={props.disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-medium transition active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60 ${
        size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm'
      } ${BTN[variant]} ${className}`}
    >
      {loading && <Loader2 className="size-4 animate-spin" />}
      {children}
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="label">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-slate-500">{hint}</span>}
    </label>
  );
}

export function Spinner({ label = 'Memuat…' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
      <Loader2 className="size-5 animate-spin text-brand-400" /> {label}
    </div>
  );
}

export function Empty({ title, desc, icon }: { title: string; desc?: string; icon?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/10 px-6 py-14 text-center">
      {icon && <div className="mb-3 text-brand-300">{icon}</div>}
      <p className="font-medium text-slate-200">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-sm text-slate-400">{desc}</p>}
    </div>
  );
}

export function ErrorBox({ message }: { message: string | null }) {
  if (!message) return null;
  return <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">{message}</div>;
}

const BADGE = {
  blue: 'bg-brand-500/15 text-brand-200 ring-brand-400/30',
  navy: 'bg-navy-500/30 text-indigo-200 ring-navy-400/40',
  green: 'bg-emerald-500/15 text-emerald-300 ring-emerald-400/30',
  amber: 'bg-amber-500/15 text-amber-200 ring-amber-400/30',
  red: 'bg-rose-500/15 text-rose-300 ring-rose-400/30',
  slate: 'bg-white/5 text-slate-300 ring-white/10',
};
export type BadgeTone = keyof typeof BADGE;
export function Badge({ tone = 'blue', children }: { tone?: BadgeTone; children: React.ReactNode }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${BADGE[tone]}`}>{children}</span>;
}

export function Avatar({ name, src, size = 40 }: { name: string; src?: string | null; size?: number }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt={name} width={size} height={size} className="shrink-0 rounded-full object-cover ring-2 ring-white/10" style={{ width: size, height: size }} />;
  }
  return (
    <span
      className="inline-flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-brand-500 to-navy-500 font-semibold text-white ring-2 ring-white/10"
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials(name)}
    </span>
  );
}

export function Modal({ open, onClose, title, children, wide }: { open: boolean; onClose: () => void; title: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-end justify-center bg-ink-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-4" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(e) => e.stopPropagation()}
        className={`animate-sheet-up max-h-[92dvh] w-full overflow-y-auto overscroll-contain rounded-t-[28px] border border-white/10 bg-ink-900 px-5 pt-2 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl sm:rounded-3xl sm:p-6 ${wide ? 'sm:max-w-3xl' : 'sm:max-w-lg'}`}
      >
        {/* Pegangan bottom sheet (HP) */}
        <div aria-hidden className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-white/20 sm:hidden" />
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="font-display text-xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Tutup">
            <X className="size-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function PageHeader({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-[26px] leading-tight font-bold text-white sm:text-3xl">{title}</h1>
        {desc && <p className="mt-1 text-sm text-slate-400">{desc}</p>}
      </div>
      {action && <div className="sm:shrink-0 [&>button]:w-full sm:[&>button]:w-auto">{action}</div>}
    </div>
  );
}

export function Stat({ label, value, icon, tone = 'from-brand-500/20' }: { label: string; value: React.ReactNode; icon?: React.ReactNode; tone?: string }) {
  return (
    <div className={`card bg-gradient-to-br ${tone} to-transparent p-4 sm:p-5`}>
      <div className="flex items-center justify-between text-slate-400">
        <span className="text-[11px] font-medium tracking-wider uppercase sm:text-xs">{label}</span>
        {icon}
      </div>
      <div className="mt-1.5 font-display text-2xl font-bold text-white sm:mt-2 sm:text-3xl">{value}</div>
    </div>
  );
}

export function Pagination({ page, total, limit, onChange }: { page: number; total: number; limit: number; onChange: (p: number) => void }) {
  const pages = Math.max(1, Math.ceil(total / limit));
  if (pages <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-2 text-sm">
      <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onChange(page - 1)}>
        Sebelumnya
      </Button>
      <span className="px-2 text-slate-400">
        {page} / {pages}
      </span>
      <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => onChange(page + 1)}>
        Berikutnya
      </Button>
    </div>
  );
}

export function ImageField({ label, value, onChange }: { label: string; value: string; onChange: (url: string) => void }) {
  const ref = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div>
      <span className="label">{label}</span>
      <div className="flex items-center gap-3">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-16 shrink-0 rounded-xl object-cover ring-1 ring-white/10" />
        ) : (
          <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-white/5 text-slate-500 ring-1 ring-white/10">
            <ImagePlus className="size-6" />
          </div>
        )}
        <div className="min-w-0 flex-1 space-y-2">
          <input className="input" placeholder="https://… atau unggah gambar" value={value} onChange={(e) => onChange(e.target.value)} />
          <div className="flex gap-2">
            <Button type="button" variant="secondary" size="sm" loading={busy} onClick={() => ref.current?.click()}>
              Unggah
            </Button>
            {value && (
              <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')}>
                Hapus
              </Button>
            )}
          </div>
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/*"
          hidden
          onChange={async (e) => {
            const f = e.target.files?.[0];
            if (!f) return;
            setBusy(true);
            setErr(null);
            try {
              onChange((await uploadImage(f)).url);
            } catch (er) {
              setErr((er as Error).message);
            } finally {
              setBusy(false);
              e.target.value = '';
            }
          }}
        />
      </div>
      {err && <p className="mt-1 text-xs text-rose-300">{err}</p>}
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items }: { value: T; onChange: (v: T) => void; items: { value: T; label: string }[] }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-xl border border-white/10 bg-ink-900 p-1">
      {items.map((it) => (
        <button
          key={it.value}
          type="button"
          onClick={() => onChange(it.value)}
          className={`rounded-lg px-3 py-1.5 text-sm transition ${value === it.value ? 'bg-brand-500 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}

export function confirmDelete(what: string) {
  return window.confirm(`Hapus ${what}? Tindakan ini tidak dapat dibatalkan.`);
}
