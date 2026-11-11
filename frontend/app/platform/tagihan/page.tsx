'use client';

import { CreditCard, Plus, ReceiptText, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { InvoiceBadge, periodName, type BankAccount, type SystemInvoice } from '@/components/SystemInvoice';
import { Button, Empty, ErrorBox, Field, PageHeader, Spinner, Tabs } from '@/components/ui';
import { formatDate, rupiah, today } from '@/lib/format';
import { papi, usePlatformApi } from '@/lib/platform';
import { InvoiceModal } from '../InvoiceModal';
import { OrgAvatar } from '../parts';

type Filter = 'MENUNGGU' | 'BELUM_BAYAR' | 'TERLAMBAT' | 'LUNAS' | '';

/** Semua tagihan langganan + rekening pembayaran Nofosys */
export default function PlatformInvoices() {
  const [status, setStatus] = useState<Filter>('MENUNGGU');
  const { data, loading, error, reload } = usePlatformApi<SystemInvoice[]>('/invoices', { status: status || undefined });
  const counts = usePlatformApi<{ waiting: number; unpaid: number; overdue: number }>('/invoices/counts');
  const [open, setOpen] = useState<SystemInvoice | null>(null);
  const c = counts.data;

  return (
    <>
      <PageHeader title="Tagihan Langganan" desc="Tagihan sistem untuk setiap lembaga. Jatuh tempo & nominal diatur per lembaga di halaman detail lembaga." />
      <div className="mb-5">
        <Tabs
          value={status}
          onChange={setStatus}
          items={[
            { value: 'MENUNGGU', label: `Perlu verifikasi (${c?.waiting ?? 0})` },
            { value: 'BELUM_BAYAR', label: `Belum dibayar (${c?.unpaid ?? 0})` },
            { value: 'TERLAMBAT', label: `Terlambat (${c?.overdue ?? 0})` },
            { value: 'LUNAS', label: 'Lunas' },
            { value: '', label: 'Semua' },
          ]}
        />
      </div>
      <ErrorBox message={error} />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div>
          {loading && !data ? (
            <Spinner />
          ) : !data?.length ? (
            <Empty icon={<ReceiptText className="size-8" />} title="Tidak ada tagihan" desc="Aktifkan tagihan otomatis di halaman detail lembaga." />
          ) : (
            <div className="space-y-3">
              {data.map((inv) => (
                <button key={inv.id} onClick={() => setOpen(inv)} className="card flex w-full items-center gap-4 p-4 text-left transition hover:border-white/20">
                  {inv.organization && <OrgAvatar o={inv.organization} size={42} />}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold text-white">{inv.organization?.name}</div>
                    <div className="truncate text-xs text-slate-400">
                      {inv.number} · {periodName(inv.period)} · jatuh tempo {formatDate(inv.dueDate)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-display font-bold text-white">{rupiah(inv.amount)}</div>
                    <InvoiceBadge inv={inv} today={today()} />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
        <BankSettings />
      </div>
      <InvoiceModal inv={open} onClose={() => setOpen(null)} onChanged={() => (reload(), counts.reload(), setOpen(null))} />
      <p className="mt-6 text-xs text-slate-500">
        Mengatur paket & tanggal jatuh tempo: buka <Link href="/platform/lembaga" className="text-brand-300 hover:underline">Lembaga</Link> → pilih lembaga → Langganan & tagihan sistem.
      </p>
    </>
  );
}

/** Rekening tujuan pembayaran langganan (tampil di halaman Langganan Sistem setiap lembaga) */
function BankSettings() {
  const { data } = usePlatformApi<{ bankAccounts: BankAccount[]; instructions: string }>('/billing-settings');
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [instructions, setInstructions] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (data) {
      setAccounts(data.bankAccounts.length ? data.bankAccounts : [{ bank: '', number: '', holder: '' }]);
      setInstructions(data.instructions);
    }
  }, [data]);
  const setAcc = (i: number, k: keyof BankAccount, v: string) => setAccounts(accounts.map((a, j) => (j === i ? { ...a, [k]: v } : a)));

  return (
    <section className="card h-fit space-y-4 p-5">
      <h2 className="flex items-center gap-2 font-display text-lg font-bold text-white">
        <CreditCard className="size-5 text-brand-300" /> Rekening pembayaran
      </h2>
      <p className="text-xs text-slate-400">Tampil di halaman Langganan Sistem semua lembaga.</p>
      <ErrorBox message={err} />
      {accounts.map((a, i) => (
        <div key={i} className="space-y-2 rounded-xl bg-white/[0.03] p-3 ring-1 ring-white/5">
          <div className="flex gap-2">
            <input className="input" placeholder="Bank" value={a.bank} onChange={(e) => setAcc(i, 'bank', e.target.value)} />
            <button className="rounded-lg px-2 text-slate-400 hover:text-rose-300" aria-label="Hapus rekening" onClick={() => setAccounts(accounts.filter((_, j) => j !== i))}>
              <Trash2 className="size-4" />
            </button>
          </div>
          <input className="input font-mono" placeholder="Nomor rekening" value={a.number} onChange={(e) => setAcc(i, 'number', e.target.value)} />
          <input className="input" placeholder="Atas nama" value={a.holder} onChange={(e) => setAcc(i, 'holder', e.target.value)} />
        </div>
      ))}
      <Button variant="ghost" size="sm" onClick={() => setAccounts([...accounts, { bank: '', number: '', holder: '' }])}>
        <Plus className="size-3.5" /> Tambah rekening
      </Button>
      <Field label="Petunjuk pembayaran">
        <textarea className="input min-h-20" placeholder="mis. Cantumkan nomor tagihan pada berita transfer." value={instructions} onChange={(e) => setInstructions(e.target.value)} />
      </Field>
      <Button
        className="w-full"
        loading={busy}
        onClick={async () => {
          setBusy(true);
          setErr(null);
          setSaved(false);
          try {
            await papi('/billing-settings', { method: 'PATCH', body: { bankAccounts: accounts.filter((a) => a.bank || a.number || a.holder), instructions } });
            setSaved(true);
          } catch (e) {
            setErr((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <Save className="size-4" /> {saved ? 'Tersimpan ✓' : 'Simpan rekening'}
      </Button>
    </section>
  );
}
