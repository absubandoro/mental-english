'use client';

import { Suspense } from 'react';
import { WithChild } from '@/components/ChildPicker';
import { ReportList } from '@/components/Report';
import { PageHeader, Spinner } from '@/components/ui';

export default function Page() {
  return (
    <>
      <PageHeader title="Rapor Anak" desc="Rapor perkembangan yang sudah diterbitkan pengajar. Bisa dicetak atau disimpan sebagai PDF." />
      <Suspense fallback={<Spinner />}>
        <WithChild>{(c) => <ReportList base="/orang-tua/rapor" childId={c.id} />}</WithChild>
      </Suspense>
    </>
  );
}
