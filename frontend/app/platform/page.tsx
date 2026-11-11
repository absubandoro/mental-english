'use client';

import { ArrowRight, Building2, GraduationCap, Plus, School, UsersRound } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { Button, ErrorBox, PageHeader, Spinner, Stat } from '@/components/ui';
import { usePlatformApi, usePlatformAuth, type OrgRow, type PlatformStats } from '@/lib/platform';
import { CreateOrgModal, OrgCard } from './parts';

export default function PlatformHome() {
  const { admin } = usePlatformAuth();
  const stats = usePlatformApi<PlatformStats>('/stats');
  const orgs = usePlatformApi<OrgRow[]>('/orgs');
  const [open, setOpen] = useState(false);
  const recent = [...(orgs.data ?? [])].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 6);
  const s = stats.data;

  return (
    <>
      <PageHeader
        title={`Halo, ${admin?.name.split(' ')[0]} 👋`}
        desc="Ringkasan seluruh lembaga (klien) di platform."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Lembaga baru
          </Button>
        }
      />
      <ErrorBox message={stats.error || orgs.error} />
      {!s ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          <Stat label="Lembaga aktif" value={`${s.active} / ${s.orgs}`} icon={<Building2 className="size-5" />} />
          <Stat label="Cabang" value={s.branches} icon={<School className="size-5" />} tone="from-navy-500/30" />
          <Stat label="Pelajar aktif" value={s.students} icon={<GraduationCap className="size-5" />} tone="from-emerald-500/15" />
          <Stat label="Orang tua · staf" value={`${s.parents} · ${s.staff}`} icon={<UsersRound className="size-5" />} tone="from-amber-500/15" />
        </div>
      )}

      <div className="mt-8 mb-4 flex items-center justify-between">
        <h2 className="font-display text-xl font-bold text-white">Lembaga terbaru</h2>
        <Link href="/platform/lembaga" className="inline-flex items-center gap-1 text-sm text-brand-300 hover:underline">
          Semua lembaga <ArrowRight className="size-4" />
        </Link>
      </div>
      {orgs.loading && !orgs.data ? (
        <Spinner />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {recent.map((o) => (
            <OrgCard key={o.id} o={o} />
          ))}
        </div>
      )}
      <CreateOrgModal open={open} onClose={() => setOpen(false)} onCreated={() => (orgs.reload(), stats.reload())} />
    </>
  );
}
