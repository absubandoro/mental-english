'use client';

import { ArrowRight, Building2, GraduationCap, Inbox, Plus, ReceiptText, School, UsersRound } from 'lucide-react';
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
      {!!(s?.invoices.waiting || s?.invoices.overdue) && (
        <Link
          href="/platform/tagihan"
          className="mt-4 flex items-center gap-3 rounded-2xl bg-amber-500/10 px-4 py-3.5 text-sm text-amber-100 ring-1 ring-amber-400/30 transition hover:bg-amber-500/15"
        >
          <ReceiptText className="size-5 text-amber-300" />
          <span className="flex-1">
            {!!s?.invoices.waiting && <b>{s.invoices.waiting} bukti pembayaran langganan perlu diverifikasi. </b>}
            {!!s?.invoices.overdue && <>{s.invoices.overdue} tagihan lewat jatuh tempo.</>}
          </span>
          <ArrowRight className="size-4" />
        </Link>
      )}
      {!!s?.newLeads && (
        <Link
          href="/platform/permintaan"
          className="mt-4 flex items-center gap-3 rounded-2xl bg-brand-500/10 px-4 py-3.5 text-sm text-brand-100 ring-1 ring-brand-400/30 transition hover:bg-brand-500/15"
        >
          <Inbox className="size-5 text-brand-300" />
          <span className="flex-1">
            <b>{s.newLeads} permintaan demo baru</b> dari website — segera hubungi calon klien.
          </span>
          <ArrowRight className="size-4" />
        </Link>
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
