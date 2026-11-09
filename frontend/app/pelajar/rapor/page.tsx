'use client';

import { ReportList } from '@/components/Report';
import { PageHeader } from '@/components/ui';

export default function Page() {
  return (
    <>
      <PageHeader title="Rapor Saya" desc="Rapor perkembangan belajarmu dari pengajar." />
      <ReportList base="/pelajar/rapor" />
    </>
  );
}
