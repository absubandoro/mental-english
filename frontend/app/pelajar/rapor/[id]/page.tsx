'use client';

import { use } from 'react';
import { ReportDetail } from '@/components/Report';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ReportDetail id={id} back="/pelajar/rapor" />;
}
