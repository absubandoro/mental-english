'use client';

import { CalendarClock, Check, School, Users } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Badge, Button, Empty, ErrorBox, PageHeader, Spinner, Tabs } from '@/components/ui';
import { api } from '@/lib/api';
import { useApi } from '@/lib/hooks';
import type { ClassRoom } from '@/lib/types';

export default function KelasDiajar() {
  const [tab, setTab] = useState<'mine' | 'all'>('mine');
  const { data, loading, reload } = useApi<ClassRoom[]>('/teacher/classes');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const list = (data ?? []).filter((c) => tab === 'all' || c.assignedToMe);

  const toggle = async (c: ClassRoom) => {
    setBusy(c.id);
    setError(null);
    try {
      await api(`/teacher/classes/${c.id}/assign`, { method: c.assignedToMe ? 'DELETE' : 'POST' });
      await reload();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <PageHeader
        title="Kelas yang Diajar"
        desc="Pilih kelas di cabang Anda lalu assign diri sebagai pengajar."
        action={
          <Tabs
            value={tab}
            onChange={setTab}
            items={[
              { value: 'mine', label: `Kelas saya (${(data ?? []).filter((c) => c.assignedToMe).length})` },
              { value: 'all', label: `Semua kelas (${data?.length ?? 0})` },
            ]}
          />
        }
      />
      <ErrorBox message={error} />
      {loading && !data ? (
        <Spinner />
      ) : list.length === 0 ? (
        <Empty
          icon={<School className="size-8" />}
          title={tab === 'mine' ? 'Belum ada kelas yang Anda ajar' : 'Belum ada kelas di cabang ini'}
          desc={tab === 'mine' ? 'Buka tab "Semua kelas" lalu klik Assign pada kelas yang Anda ajar.' : 'Admin cabang dapat membuat kelas baru.'}
        />
      ) : (
        <div className="mt-2 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <div key={c.id} className={`card flex flex-col p-5 ${c.assignedToMe ? 'ring-1 ring-brand-400/30' : ''}`}>
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-white">{c.name}</h2>
                {c.level && <Badge tone="navy">{c.level}</Badge>}
              </div>
              <div className="mt-2 space-y-1 text-sm text-slate-400">
                <p className="flex items-center gap-2">
                  <CalendarClock className="size-4" /> {c.schedule ?? 'Jadwal belum diatur'}
                </p>
                <p className="flex items-center gap-2">
                  <Users className="size-4" /> {c.students.length} pelajar
                </p>
              </div>
              <p className="mt-3 text-xs text-slate-500">Pengajar: {c.teachers.map((t) => t.name).join(', ') || '—'}</p>
              <div className="mt-auto flex gap-2 pt-4">
                <Button variant={c.assignedToMe ? 'secondary' : 'primary'} size="sm" loading={busy === c.id} onClick={() => toggle(c)}>
                  {c.assignedToMe ? (
                    <>
                      <Check className="size-3.5" /> Diajar · Lepas
                    </>
                  ) : (
                    'Assign ke saya'
                  )}
                </Button>
                {c.assignedToMe && (
                  <Link href={`/pengajar/sesi?kelas=${c.id}`} className="inline-flex items-center rounded-xl px-3 py-1.5 text-xs font-medium text-brand-200 hover:bg-white/5">
                    Buat kelas hari ini →
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
