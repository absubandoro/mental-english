'use client';

import { GraduationCap } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { useApi } from '@/lib/hooks';
import type { User } from '@/lib/types';
import { Avatar, Empty, Spinner } from './ui';

const KEY = 'me_child';

/** Daftar anak milik orang tua + anak yang sedang dipilih (?anak=) */
export function useChildren() {
  const { data, loading } = useApi<User[]>('/parent/children');
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const kids = data ?? [];
  let selectedId = params.get('anak');
  if (!selectedId) {
    try {
      selectedId = localStorage.getItem(KEY);
    } catch {
      /* abaikan */
    }
  }
  const selected = kids.find((k) => k.id === selectedId) ?? kids[0] ?? null;

  useEffect(() => {
    if (selected) {
      try {
        localStorage.setItem(KEY, selected.id);
      } catch {
        /* abaikan */
      }
    }
  }, [selected]);

  const select = (id: string) => router.replace(`${pathname}?anak=${id}`, { scroll: false });
  return { kids, selected, loading, select };
}

export function ChildPicker({ kids, selected, onSelect }: { kids: User[]; selected: User | null; onSelect: (id: string) => void }) {
  if (kids.length <= 1) return null;
  return (
    <div className="mb-6 flex flex-wrap gap-2" role="tablist" aria-label="Pilih anak">
      {kids.map((k) => (
        <button
          key={k.id}
          role="tab"
          aria-selected={selected?.id === k.id}
          onClick={() => onSelect(k.id)}
          className={`flex items-center gap-2 rounded-full border py-1 pr-4 pl-1 text-sm transition ${
            selected?.id === k.id ? 'border-brand-400/50 bg-brand-500/15 text-white' : 'border-white/10 text-slate-400 hover:text-white'
          }`}
        >
          <Avatar name={k.name} src={k.avatarUrl} size={28} /> {k.name}
        </button>
      ))}
    </div>
  );
}

/** Pembungkus halaman yang butuh data anak */
export function WithChild({ children }: { children: (child: User) => React.ReactNode }) {
  const { kids, selected, loading, select } = useChildren();
  if (loading) return <Spinner />;
  if (!selected)
    return (
      <Empty
        icon={<GraduationCap className="size-8" />}
        title="Belum ada data anak"
        desc="Hubungi admin cabang untuk menautkan akun Anda dengan data anak."
      />
    );
  return (
    <>
      <ChildPicker kids={kids} selected={selected} onSelect={select} />
      {children(selected)}
    </>
  );
}
