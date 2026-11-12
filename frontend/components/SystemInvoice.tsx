'use client';

import { Badge, type BadgeTone } from './ui';
import { formatDate, rupiah } from '@/lib/format';

export type InvoiceStatus = 'BELUM_BAYAR' | 'MENUNGGU' | 'LUNAS' | 'BATAL';

/** Tagihan langganan sistem (Nofosys → lembaga) */
export interface SystemInvoice {
  id: string;
  number: string;
  organizationId: string;
  organization?: { id: string; name: string; slug: string; logoUrl: string | null; brandColor: string };
  period: string;
  issueDate: string;
  dueDate: string;
  items: { description: string; qty: number; unitPrice: number; amount: number }[];
  amount: number;
  status: InvoiceStatus;
  proofUrl: string | null;
  proofNote: string | null;
  proofUploadedAt: string | null;
  paidAt: string | null;
  rejectReason: string | null;
  note: string | null;
  createdAt: string;
}

export interface BankAccount {
  bank: string;
  number: string;
  holder: string;
}

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
export const MONTH_NAMES = MONTHS;
/** "2026-11" → "November 2026"; tahunan "2027" → "Tahun 2027" */
export const periodName = (p: string) => (p.length === 4 ? `Tahun ${p}` : `${MONTHS[Number(p.slice(5, 7)) - 1]} ${p.slice(0, 4)}`);

/** "Tanggal 15 setiap bulan" / "15 Januari setiap tahun" */
export function dueText(s: { billingCycle: 'MONTHLY' | 'YEARLY'; dueDay: number; dueMonth: number }) {
  return s.billingCycle === 'YEARLY' ? `${s.dueDay} ${MONTHS[s.dueMonth - 1]} setiap tahun` : `Tanggal ${s.dueDay} setiap bulan`;
}

/** Status untuk ditampilkan — termasuk "Terlambat" bila belum bayar & lewat jatuh tempo */
export function invoiceState(inv: Pick<SystemInvoice, 'status' | 'dueDate'>, today: string): { label: string; tone: BadgeTone } {
  if (inv.status === 'LUNAS') return { label: 'Lunas', tone: 'green' };
  if (inv.status === 'BATAL') return { label: 'Dibatalkan', tone: 'slate' };
  if (inv.status === 'MENUNGGU') return { label: 'Menunggu verifikasi', tone: 'amber' };
  if (inv.dueDate < today) return { label: 'Terlambat', tone: 'red' };
  return { label: 'Belum dibayar', tone: 'blue' };
}

export function InvoiceBadge({ inv, today }: { inv: Pick<SystemInvoice, 'status' | 'dueDate'>; today: string }) {
  const s = invoiceState(inv, today);
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

/** Rincian tagihan (item + total + tanggal) */
export function InvoiceDetail({ inv, today }: { inv: SystemInvoice; today: string }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-xs text-slate-400">{inv.number}</div>
          <div className="font-display text-xl font-bold text-white">Langganan {periodName(inv.period)}</div>
        </div>
        <InvoiceBadge inv={inv} today={today} />
      </div>
      <dl className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-xl bg-white/[0.03] px-3 py-2">
          <dt className="text-xs text-slate-500">Diterbitkan</dt>
          <dd className="text-white">{formatDate(inv.issueDate)}</dd>
        </div>
        <div className="rounded-xl bg-white/[0.03] px-3 py-2">
          <dt className="text-xs text-slate-500">Jatuh tempo</dt>
          <dd className={inv.status === 'BELUM_BAYAR' && inv.dueDate < today ? 'font-semibold text-rose-300' : 'text-white'}>{formatDate(inv.dueDate)}</dd>
        </div>
      </dl>
      <table className="w-full text-sm">
        <thead className="text-left text-xs text-slate-500">
          <tr>
            <th className="pb-2 font-medium">Rincian</th>
            <th className="pb-2 text-right font-medium">Jumlah</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {inv.items.map((it, i) => (
            <tr key={i}>
              <td className="py-2 pr-3 text-slate-200">
                {it.description}
                {it.qty > 1 && (
                  <span className="block text-xs text-slate-500">
                    {it.qty} × {rupiah(it.unitPrice)}
                  </span>
                )}
              </td>
              <td className="py-2 text-right whitespace-nowrap text-slate-200">{rupiah(it.amount)}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t border-white/10">
            <td className="pt-3 font-semibold text-white">Total</td>
            <td className="pt-3 text-right font-display text-xl font-bold whitespace-nowrap text-white">{rupiah(inv.amount)}</td>
          </tr>
        </tfoot>
      </table>
      {inv.note && <p className="rounded-xl bg-white/[0.03] px-3 py-2 text-sm text-slate-300">Catatan: {inv.note}</p>}
      {inv.rejectReason && inv.status === 'BELUM_BAYAR' && (
        <p className="rounded-xl bg-rose-500/10 px-3 py-2 text-sm text-rose-200 ring-1 ring-rose-400/20">Bukti sebelumnya ditolak: {inv.rejectReason}</p>
      )}
      {inv.paidAt && <p className="text-sm text-emerald-300">Lunas pada {formatDate(inv.paidAt, { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>}
    </div>
  );
}

/** Data halaman Langganan Sistem (Super Admin lembaga) */
export interface SubscriptionInfo {
  platformName: string;
  enabled: boolean;
  billingCycle: 'MONTHLY' | 'YEARLY';
  dueMonth: number;
  planName: string | null;
  baseFee: number;
  perStudentFee: number;
  dueDay: number;
  activeStudents: number;
  amount: number;
  today: string;
  invoices: SystemInvoice[];
  bankAccounts: BankAccount[];
  instructions: string;
}
