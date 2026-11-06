'use client';

import { Eye, EyeOff, Palette, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { SearchInput, useBranchScope } from '@/components/admin';
import { MadingGrid } from '@/components/MadingGrid';
import { Button, confirmDelete, Empty, PageHeader, Pagination, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { useApi, useDebounced } from '@/lib/hooks';
import type { Mading, Paged } from '@/lib/types';

export default function AdminMading() {
  const { branchId } = useBranchScope();
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const dq = useDebounced(q);
  const { data, loading, reload } = useApi<Paged<Mading>>('/admin/mading', { q: dq, page, branchId });
  return (
    <>
      <PageHeader title="Moderasi Mading" desc="Sembunyikan atau hapus karya mading yang tidak sesuai." />
      <div className="mb-4 max-w-md">
        <SearchInput value={q} onChange={(v) => (setQ(v), setPage(1))} placeholder="Cari judul atau nama pelajar…" />
      </div>
      {loading && !data ? (
        <Spinner />
      ) : !data?.data.length ? (
        <Empty icon={<Palette className="size-8" />} title="Belum ada mading" />
      ) : (
        <>
          <MadingGrid
            items={data.data}
            actions={(m) => (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label={m.published ? 'Sembunyikan' : 'Tampilkan'}
                  title={m.published ? 'Sembunyikan' : 'Tampilkan'}
                  onClick={async () => {
                    await api(`/admin/mading/${m.id}`, { method: 'PATCH', body: { published: !m.published } });
                    reload();
                  }}
                >
                  {m.published ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  aria-label="Hapus"
                  onClick={async () => {
                    if (!confirmDelete(`"${m.title}"`)) return;
                    await api(`/admin/mading/${m.id}`, { method: 'DELETE' });
                    reload();
                  }}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </>
            )}
          />
          <Pagination page={data.page} total={data.total} limit={data.limit} onChange={setPage} />
        </>
      )}
    </>
  );
}
