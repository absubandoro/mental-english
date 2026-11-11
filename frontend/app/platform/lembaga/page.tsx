'use client';

import { Building2, Plus } from 'lucide-react';
import { useState } from 'react';
import { SearchInput } from '@/components/admin';
import { Button, Empty, ErrorBox, PageHeader, Spinner, Tabs } from '@/components/ui';
import { useDebounced } from '@/lib/hooks';
import { usePlatformApi, type OrgRow } from '@/lib/platform';
import { CreateOrgModal, OrgCard } from '../parts';

export default function PlatformOrgs() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<'' | 'aktif' | 'nonaktif'>('');
  const dq = useDebounced(q);
  const { data, loading, error, reload } = usePlatformApi<OrgRow[]>('/orgs', { q: dq || undefined, status: status || undefined });
  const [open, setOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Lembaga"
        desc="Semua klien di platform. Klik lembaga untuk mengatur domain, status, dan akun Super Admin."
        action={
          <Button onClick={() => setOpen(true)}>
            <Plus className="size-4" /> Lembaga baru
          </Button>
        }
      />
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <Tabs
          value={status}
          onChange={setStatus}
          items={[
            { value: '', label: 'Semua' },
            { value: 'aktif', label: 'Aktif' },
            { value: 'nonaktif', label: 'Nonaktif' },
          ]}
        />
        <div className="lg:w-80">
          <SearchInput value={q} onChange={setQ} placeholder="Cari nama, slug, email, domain…" />
        </div>
      </div>
      <ErrorBox message={error} />
      {loading && !data ? (
        <Spinner />
      ) : !data?.length ? (
        <Empty icon={<Building2 className="size-8" />} title="Tidak ada lembaga" desc="Tambahkan klien pertama dengan tombol Lembaga baru." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.map((o) => (
            <OrgCard key={o.id} o={o} />
          ))}
        </div>
      )}
      <CreateOrgModal open={open} onClose={() => setOpen(false)} onCreated={reload} />
    </>
  );
}
