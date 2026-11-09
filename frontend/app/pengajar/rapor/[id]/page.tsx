'use client';

import { use } from 'react';
import { ReportEditor } from '@/components/Report';

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return <ReportEditor id={id} back="/pengajar/rapor" />;
}
