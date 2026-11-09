'use client';

import { ArrowLeft, Printer } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { use, useEffect } from 'react';
import { ReportView } from '@/components/Report';
import { Spinner } from '@/components/ui';
import { useAuth } from '@/lib/auth';
import { useApi } from '@/lib/hooks';
import type { ProgressReport } from '@/lib/types';

/** Rapor versi cetak (kertas putih, A4) — "Simpan sebagai PDF" dari dialog cetak browser */
export default function PrintReport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { data, error } = useApi<ProgressReport>(user ? `/reports/${id}` : null);

  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [authLoading, user, router]);

  useEffect(() => {
    if (data) document.title = `${data.title} — ${data.student?.name ?? ''}`;
  }, [data]);

  return (
    <div className="min-h-dvh bg-slate-100 py-6 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[210mm] items-center justify-between gap-2 px-4 print:hidden">
        <button onClick={() => router.back()} className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900">
          <ArrowLeft className="size-4" /> Kembali
        </button>
        <button onClick={() => window.print()} disabled={!data} className="inline-flex items-center gap-2 rounded-xl bg-[#2f3071] px-4 py-2 text-sm font-medium text-white hover:bg-[#3d3f9a] disabled:opacity-50">
          <Printer className="size-4" /> Cetak / Simpan PDF
        </button>
      </div>
      <div className="mx-auto max-w-[210mm] bg-white p-6 shadow-xl sm:p-10 print:max-w-none print:p-0 print:shadow-none">
        {error ? <p className="text-rose-600">{error}</p> : data ? <ReportView r={data} paper /> : <Spinner />}
      </div>
    </div>
  );
}
