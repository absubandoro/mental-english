'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth';
import type { UserLite } from '@/lib/types';
import { Avatar } from './ui';

/** Parameter cabang untuk request admin (super admin mengikuti cabang aktif di sidebar) */
export function useBranchScope() {
  const { user, activeBranchId } = useAuth();
  const isSuper = user?.role === 'SUPER_ADMIN';
  return {
    isSuper,
    branchId: isSuper ? activeBranchId ?? undefined : undefined,
    /** Super admin harus memilih cabang sebelum membuat data */
    needBranch: isSuper && !activeBranchId,
  };
}

export function BranchNotice() {
  const { needBranch } = useBranchScope();
  if (!needBranch) return null;
  return (
    <div className="mb-4 rounded-xl border border-amber-400/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
      Anda melihat data <b>semua cabang</b>. Pilih cabang di sidebar untuk menambah data baru.
    </div>
  );
}

export function SearchInput({ value, onChange, placeholder = 'Cari…' }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-500" />
      <input className="input pl-10" placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} aria-label={placeholder} />
    </div>
  );
}

/** Pilih banyak user dengan pencarian (dipakai di form kelas & notifikasi) */
export function MultiPick({ label, options, value, onChange }: { label: string; options: UserLite[]; value: string[]; onChange: (ids: string[]) => void }) {
  const [q, setQ] = useState('');
  const shown = options.filter((o) => o.name.toLowerCase().includes(q.toLowerCase()));
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="label mb-0">
          {label} <span className="text-brand-300">({value.length} dipilih)</span>
        </span>
        <div className="flex gap-2 text-xs">
          <button type="button" className="text-brand-300 hover:underline" onClick={() => onChange([...new Set([...value, ...shown.map((s) => s.id)])])}>
            Pilih semua
          </button>
          <button type="button" className="text-slate-400 hover:underline" onClick={() => onChange([])}>
            Kosongkan
          </button>
        </div>
      </div>
      <div className="rounded-xl border border-white/10 bg-ink-900">
        <input className="w-full border-b border-white/10 bg-transparent px-3.5 py-2 text-sm outline-none placeholder:text-slate-500" placeholder="Cari nama…" value={q} onChange={(e) => setQ(e.target.value)} />
        <div className="max-h-52 overflow-y-auto p-1">
          {shown.length === 0 && <p className="p-3 text-center text-xs text-slate-500">Tidak ada data</p>}
          {shown.map((o) => (
            <label key={o.id} className="flex cursor-pointer items-center gap-3 rounded-lg px-2.5 py-1.5 hover:bg-white/5">
              <input type="checkbox" className="size-4 accent-brand-500" checked={value.includes(o.id)} onChange={() => toggle(o.id)} />
              <Avatar name={o.name} src={o.avatarUrl} size={24} />
              <span className="text-sm text-slate-200">{o.name}</span>
              {o.level && <span className="ml-auto text-xs text-slate-500">{o.level}</span>}
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

export function Table({ head, children }: { head: React.ReactNode[]; children: React.ReactNode }) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full min-w-[720px] text-sm">
        <thead className="bg-white/[0.02] text-left text-xs text-slate-400 uppercase">
          <tr>
            {head.map((h, i) => (
              <th key={i} className="px-4 py-3 font-medium first:pl-5 last:pr-5">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">{children}</tbody>
      </table>
    </div>
  );
}

export const td = 'px-4 py-3 first:pl-5 last:pr-5 align-middle';
