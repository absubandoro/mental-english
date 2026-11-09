'use client';

import { CalendarClock, Landmark, Plus, Trash2, Users, Wallet, Zap } from 'lucide-react';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { formatDate, formatPeriod, rupiah } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import type { BankAccount } from '@/lib/types';
import { BranchNotice, useBranchScope } from './admin';
import { Button, ErrorBox, Field, PageHeader, Spinner, Stat } from './ui';

interface Settings {
  id: string;
  name: string;
  billingEnabled: boolean;
  billingDay: number;
  billingAmount: number;
  billingDescription: string;
  billingDueDays: number;
  bankAccounts: BankAccount[];
  paymentInstructions: string | null;
  preview: { period: string; nextRun: string; activeStudents: number; customFeeStudents: number; estimatedTotal: number; generatedThisPeriod: number };
}

export function BillingSettings() {
  const scope = useBranchScope();
  const { data, loading, setData, reload } = useApi<Settings>(scope.needBranch ? null : '/admin/billing', { branchId: scope.branchId });
  const [form, setForm] = useState<Omit<Settings, 'id' | 'name' | 'preview'> | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (data) {
      const { id: _i, name: _n, preview: _p, ...rest } = data;
      setForm({ ...rest, bankAccounts: rest.bankAccounts ?? [], paymentInstructions: rest.paymentInstructions ?? '' });
    }
  }, [data]);

  if (scope.needBranch)
    return (
      <>
        <PageHeader title="Pengaturan Tagihan" />
        <BranchNotice />
      </>
    );
  if (loading || !data || !form) return <Spinner />;

  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm({ ...form, [k]: v });
  const setBank = (i: number, k: keyof BankAccount, v: string) => set('bankAccounts', form.bankAccounts.map((b, j) => (j === i ? { ...b, [k]: v } : b)));

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      setData(
        await api<Settings>('/admin/billing', {
          method: 'PATCH',
          body: {
            ...form,
            branchId: scope.branchId,
            billingDay: Number(form.billingDay),
            billingAmount: Number(form.billingAmount),
            billingDueDays: Number(form.billingDueDays),
            bankAccounts: form.bankAccounts.filter((b) => b.bank && b.number),
            paymentInstructions: form.paymentInstructions || undefined,
          },
        }),
      );
      setMsg('Pengaturan tersimpan.');
    } catch (er) {
      setError((er as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const generate = async () => {
    if (!window.confirm(`Buat tagihan ${formatPeriod(data.preview.period)} sekarang untuk semua pelajar aktif yang belum ditagih?`)) return;
    setBusy(true);
    setError(null);
    setMsg(null);
    try {
      const r = await api<{ created: number; skipped: number }>('/admin/billing/generate', { method: 'POST', body: { branchId: scope.branchId } });
      setMsg(`${r.created} tagihan dibuat${r.skipped ? `, ${r.skipped} dilewati (sudah ada / nominal 0)` : ''}. Orang tua sudah mendapat notifikasi.`);
      reload();
    } catch (er) {
      setError((er as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const due = (() => {
    const d = new Date(`${data.preview.nextRun}T00:00:00`);
    d.setDate(d.getDate() + Number(form.billingDueDays || 0));
    return d;
  })();

  return (
    <>
      <PageHeader title="Pengaturan Tagihan" desc={`Tagihan SPP bulanan otomatis untuk ${data.name}.`} />
      <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Tagihan berikutnya" value={formatDate(data.preview.nextRun, { day: 'numeric', month: 'short' })} icon={<CalendarClock className="size-5" />} />
        <Stat label="Pelajar aktif" value={data.preview.activeStudents} icon={<Users className="size-5" />} tone="from-navy-500/40" />
        <Stat label="Perkiraan / bulan" value={rupiah(data.preview.estimatedTotal)} icon={<Wallet className="size-5" />} tone="from-emerald-500/15" />
        <Stat label={`Sudah ditagih ${formatPeriod(data.preview.period)}`} value={data.preview.generatedThisPeriod} icon={<Zap className="size-5" />} tone="from-navy-500/40" />
      </div>

      <form onSubmit={save} className="grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <section className="card space-y-5 p-5 sm:p-6">
          {msg && <div className="rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">{msg}</div>}
          <ErrorBox message={error} />
          <label className="flex items-start gap-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-white/10">
            <input type="checkbox" className="mt-0.5 size-5 accent-brand-500" checked={form.billingEnabled} onChange={(e) => set('billingEnabled', e.target.checked)} />
            <span>
              <span className="block font-semibold text-white">Aktifkan tagihan otomatis</span>
              <span className="text-sm text-slate-400">
                Setiap bulan pada tanggal tagihan, sistem membuat tagihan untuk semua pelajar aktif dan mengirim notifikasi + pengingat H-3 jatuh tempo ke orang tua.
              </span>
            </span>
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Tanggal tagihan setiap bulan" hint="Tanggal 1–28">
              <select className="input" value={form.billingDay} onChange={(e) => set('billingDay', Number(e.target.value))}>
                {Array.from({ length: 28 }, (_, i) => i + 1).map((d) => (
                  <option key={d} value={d}>
                    Tanggal {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Jatuh tempo" hint={`Contoh: ditagih ${formatDate(data.preview.nextRun, { day: 'numeric', month: 'short' })} → jatuh tempo ${formatDate(due, { day: 'numeric', month: 'short' })}`}>
              <div className="flex items-center gap-2">
                <input className="input" type="number" min={0} max={60} value={form.billingDueDays} onChange={(e) => set('billingDueDays', Number(e.target.value))} />
                <span className="shrink-0 text-sm text-slate-400">hari setelahnya</span>
              </div>
            </Field>
            <Field label="Keterangan tagihan">
              <input className="input" required value={form.billingDescription} onChange={(e) => set('billingDescription', e.target.value)} />
            </Field>
            <Field label="Nominal SPP (Rp)" hint={data.preview.customFeeStudents ? `${data.preview.customFeeStudents} pelajar memakai nominal khusus (atur di User Anak)` : 'Nominal khusus per pelajar bisa diatur di User Anak'}>
              <input className="input" type="number" min={0} step={1000} value={form.billingAmount} onChange={(e) => set('billingAmount', Number(e.target.value))} />
            </Field>
          </div>
          <div className="flex flex-wrap gap-2 pt-1">
            <Button type="submit" loading={busy}>
              Simpan pengaturan
            </Button>
            <Button type="button" variant="secondary" loading={busy} onClick={generate}>
              <Zap className="size-4" /> Buat tagihan bulan ini sekarang
            </Button>
          </div>
        </section>

        <section className="card space-y-4 p-5 sm:p-6">
          <h2 className="flex items-center gap-2 font-display text-lg font-bold text-white">
            <Landmark className="size-5 text-brand-300" /> Rekening pembayaran
          </h2>
          <p className="text-sm text-slate-400">Ditampilkan ke orang tua saat membayar dan mengunggah bukti transfer.</p>
          {form.bankAccounts.map((b, i) => (
            <div key={i} className="grid grid-cols-2 gap-2 rounded-2xl bg-white/[0.03] p-3 ring-1 ring-white/10">
              <input className="input" placeholder="Bank (mis. BCA)" value={b.bank} onChange={(e) => setBank(i, 'bank', e.target.value)} aria-label="Nama bank" />
              <input className="input" placeholder="No. rekening" inputMode="numeric" value={b.number} onChange={(e) => setBank(i, 'number', e.target.value)} aria-label="Nomor rekening" />
              <input className="input col-span-2" placeholder="Atas nama" value={b.holder} onChange={(e) => setBank(i, 'holder', e.target.value)} aria-label="Atas nama" />
              <button type="button" onClick={() => set('bankAccounts', form.bankAccounts.filter((_, j) => j !== i))} className="col-span-2 inline-flex items-center justify-center gap-1 text-xs text-rose-300 hover:underline">
                <Trash2 className="size-3.5" /> Hapus rekening
              </button>
            </div>
          ))}
          {form.bankAccounts.length < 5 && (
            <Button type="button" variant="secondary" size="sm" onClick={() => set('bankAccounts', [...form.bankAccounts, { bank: '', number: '', holder: '' }])}>
              <Plus className="size-3.5" /> Tambah rekening
            </Button>
          )}
          <Field label="Instruksi pembayaran">
            <textarea className="input min-h-24" value={form.paymentInstructions ?? ''} onChange={(e) => set('paymentInstructions', e.target.value)} placeholder="mis. Cantumkan nama siswa di berita transfer." />
          </Field>
        </section>
      </form>
    </>
  );
}
