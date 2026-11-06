'use client';

import { Search } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { Branch } from '@/lib/types';

/** Filter cabang + pencarian judul / nama author, disimpan di URL */
export function FilterBar({ branches, extra }: { branches: Branch[]; extra?: { name: string; options: { value: string; label: string }[]; placeholder: string } }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');

  const push = (patch: Record<string, string>) => {
    const p = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) v ? p.set(k, v) : p.delete(k);
    p.delete('page');
    router.push(`${pathname}${p.toString() ? `?${p}` : ''}`, { scroll: false });
  };

  useEffect(() => {
    const t = setTimeout(() => {
      if ((params.get('q') ?? '') !== q) push({ q });
    }, 400);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-slate-500" />
        <input className="input pl-10" placeholder="Cari judul atau nama author…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Cari" />
      </div>
      <select className="input sm:w-60" value={params.get('branchId') ?? ''} onChange={(e) => push({ branchId: e.target.value })} aria-label="Filter cabang">
        <option value="">Semua cabang</option>
        {branches.map((b) => (
          <option key={b.id} value={b.id}>
            {b.name}
          </option>
        ))}
      </select>
      {extra && (
        <select className="input sm:w-44" value={params.get(extra.name) ?? ''} onChange={(e) => push({ [extra.name]: e.target.value })} aria-label={extra.placeholder}>
          <option value="">{extra.placeholder}</option>
          {extra.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
