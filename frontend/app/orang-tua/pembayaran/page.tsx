'use client';

import { CheckCircle2, Clock, Wallet } from 'lucide-react';
import { Badge, Empty, PageHeader, Spinner, Stat } from '@/components/ui';
import { PAY_TONE } from '@/lib/tones';
import { formatDate, formatPeriod, PAYMENT_LABEL, rupiah } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import type { Payment } from '@/lib/types';


export default function LaporanPembayaran() {
  const { data, loading } = useApi<{ data: Payment[]; summary: { paid: number; unpaid: number; pending: number } }>('/parent/payments');
  return (
    <>
      <PageHeader title="Laporan Pembayaran" desc="Riwayat tagihan dan pembayaran seluruh anak Anda." />
      {loading || !data ? (
        <Spinner />
      ) : (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            <Stat label="Sudah dibayar" value={rupiah(data.summary.paid)} icon={<CheckCircle2 className="size-5 text-emerald-300" />} tone="from-emerald-500/15" />
            <Stat label="Menunggu verifikasi" value={rupiah(data.summary.pending)} icon={<Clock className="size-5 text-amber-300" />} tone="from-amber-500/15" />
            <Stat label="Belum dibayar" value={rupiah(data.summary.unpaid)} icon={<Wallet className="size-5 text-rose-300" />} tone="from-rose-500/15" />
          </div>
          {data.data.length === 0 ? (
            <Empty title="Belum ada tagihan" />
          ) : (
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[640px] text-sm">
                <thead className="bg-white/[0.02] text-left text-xs text-slate-400 uppercase">
                  <tr>
                    <th className="px-6 py-3 font-medium">Periode</th>
                    <th className="px-3 py-3 font-medium">Anak</th>
                    <th className="px-3 py-3 font-medium">Keterangan</th>
                    <th className="px-3 py-3 text-right font-medium">Jumlah</th>
                    <th className="px-3 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium">Dibayar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {data.data.map((p) => (
                    <tr key={p.id}>
                      <td className="px-6 py-3 whitespace-nowrap text-slate-200">{formatPeriod(p.period)}</td>
                      <td className="px-3 py-3 text-slate-300">{p.student?.name}</td>
                      <td className="px-3 py-3 text-slate-400">
                        {p.description}
                        {p.dueDate && p.status !== 'LUNAS' && <div className="text-xs text-slate-500">Jatuh tempo {formatDate(p.dueDate)}</div>}
                      </td>
                      <td className="px-3 py-3 text-right font-semibold whitespace-nowrap text-white">{rupiah(p.amount)}</td>
                      <td className="px-3 py-3">
                        <Badge tone={PAY_TONE[p.status]}>{PAYMENT_LABEL[p.status]}</Badge>
                      </td>
                      <td className="px-6 py-3 text-xs text-slate-400">
                        {p.paidAt ? formatDate(p.paidAt) : '-'}
                        {p.method && <div>{p.method}</div>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </>
  );
}
