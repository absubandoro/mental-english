'use client';

import { Palette } from 'lucide-react';
import { Suspense, useState } from 'react';
import { WithChild } from '@/components/ChildPicker';
import { MadingGrid } from '@/components/MadingGrid';
import { Empty, PageHeader, Pagination, Spinner } from '@/components/ui';
import { useApi } from '@/lib/hooks';
import type { Mading, Paged } from '@/lib/types';

function List({ childId }: { childId: string }) {
  const [page, setPage] = useState(1);
  const { data, loading } = useApi<Paged<Mading>>(`/parent/children/${childId}/mading`, { page });
  if (loading && !data) return <Spinner />;
  if (!data?.data.length) return <Empty icon={<Palette className="size-8" />} title="Belum ada karya di mading" />;
  return (
    <>
      <MadingGrid items={data.data} />
      <Pagination page={data.page} total={data.total} limit={data.limit} onChange={setPage} />
    </>
  );
}

export default function MadingAnak() {
  return (
    <>
      <PageHeader title="Mading Anak" desc="Karya yang ditempel anak Anda di mading." />
      <Suspense fallback={<Spinner />}>
        <WithChild>{(c) => <List childId={c.id} />}</WithChild>
      </Suspense>
    </>
  );
}
