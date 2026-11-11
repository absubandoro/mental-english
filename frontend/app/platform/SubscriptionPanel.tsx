'use client';

import { CalendarClock, FilePlus2, ReceiptText, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { InvoiceBadge, periodName, type SystemInvoice } from '@/components/SystemInvoice';
import { Button, ErrorBox, Field } from '@/components/ui';
import { formatDate, rupiah, today } from '@/lib/format';
import { papi, usePlatformApi, type OrgDetail } from '@/lib/platform';
import { InvoiceModal } from './InvoiceModal';

/** Detail lembaga: pengaturan langganan + daftar tagihan lembaga tersebut */
export function SubscriptionPanel({ org, onSaved }: { org: OrgDetail; onSaved: () => void }) {
  const toForm = (o: OrgDetail) => ({
    subscriptionEnabled: o.subscriptionEnabled,
    planName: o.planName ?? '',
    baseFee: String(o.baseFee || ''),
    perStudentFee: String(o.perStudentFee || ''),
    dueDay: String(o.dueDay),
    invoiceLeadDays: String(o.invoiceLeadDays),
    subscriptionStart: o.subscriptionStart ?? '',
  });
  const [form, setForm] = useState(() => toForm(org));
  useEffect(() => setForm(toForm(org)), [org]);
  const invoices = usePlatformApi<SystemInvoice[]>('/invoices', { orgId: org.id });
  const [period, setPeriod] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState<SystemInvoice | null>(null);
  const set = (k: keyof ReturnType<typeof toForm>) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value });

  const base = Number(form.baseFee) || 0;
  const per = Number(form.perStudentFee) || 0;
  const estimate = base + per * org.estimate.activeStudents;
  const day = Number(form.dueDay) || 1;
  const lead = Number(form.invoiceLeadDays) || 0;

  const run = async (key: string, fn: () => Promise<void>) => {
    setBusy(key);
    setErr(null);
    setMsg(null);
    try {
      await fn();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="card space-y-5 p-5 sm:p-6 xl:col-span-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="flex items-center gap-2 font-display text-lg font-bold text-white">
          <ReceiptText className="size-5 text-brand-300" /> Langganan & tagihan sistem
        </h2>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-300">
          <input type="checkbox" className="size-4 accent-[var(--color-brand-500)]" checked={form.subscriptionEnabled} onChange={(e) => setForm({ ...form, subscriptionEnabled: e.target.checked })} />
          Tagihan otomatis aktif
        </label>
      </div>
      <ErrorBox message={err} />
      {msg && <p className="rounded-xl bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200 ring-1 ring-emerald-400/20">{msg}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Nama paket">
          <input className="input" placeholder="mis. Paket Pro" value={form.planName} onChange={set('planName')} />
        </Field>
        <Field label="Biaya tetap / bulan (Rp)">
          <input className="input" inputMode="numeric" placeholder="0" value={form.baseFee} onChange={(e) => setForm({ ...form, baseFee: e.target.value.replace(/\D/g, '') })} />
        </Field>
        <Field label="Biaya per pelajar aktif (Rp)">
          <input className="input" inputMode="numeric" placeholder="0" value={form.perStudentFee} onChange={(e) => setForm({ ...form, perStudentFee: e.target.value.replace(/\D/g, '') })} />
        </Field>
        <Field label="Mulai ditagih (periode)">
          <input className="input" type="month" value={form.subscriptionStart} onChange={set('subscriptionStart')} />
        </Field>
        <Field label="Tanggal jatuh tempo setiap bulan">
          <select className="input" value={form.dueDay} onChange={set('dueDay')}>
            {Array.from({ length: 28 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                Tanggal {i + 1}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Tagihan terbit">
          <select className="input" value={form.invoiceLeadDays} onChange={set('invoiceLeadDays')}>
            {[0, 3, 5, 7, 10, 14].map((d) => (
              <option key={d} value={d}>
                {d === 0 ? 'Pada hari jatuh tempo' : `${d} hari sebelum jatuh tempo`}
              </option>
            ))}
          </select>
        </Field>
        <div className="flex flex-col justify-end rounded-xl bg-white/[0.03] px-4 py-2.5 text-sm sm:col-span-2">
          <span className="text-xs text-slate-500">Perkiraan tagihan berikutnya</span>
          <span className="text-white">
            <b className="font-display text-lg">{rupiah(estimate)}</b> · {org.estimate.activeStudents} pelajar aktif · terbit H-{lead}, jatuh tempo tgl {day}
          </span>
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          loading={busy === 'save'}
          onClick={() =>
            run('save', async () => {
              await papi(`/orgs/${org.id}/subscription`, {
                method: 'PATCH',
                body: {
                  subscriptionEnabled: form.subscriptionEnabled,
                  planName: form.planName || null,
                  baseFee: base,
                  perStudentFee: per,
                  dueDay: day,
                  invoiceLeadDays: lead,
                  subscriptionStart: form.subscriptionStart || null,
                },
              });
              setMsg('Pengaturan langganan disimpan. Tagihan terbit otomatis setiap hari pukul 06.10 WIB bila sudah masuk jadwal.');
              onSaved();
            })
          }
        >
          <Save className="size-4" /> Simpan pengaturan
        </Button>
      </div>

      <div className="border-t border-white/8 pt-5">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h3 className="font-semibold text-white">Tagihan lembaga ini</h3>
          <div className="flex items-end gap-2">
            <Field label="Periode (opsional)">
              <input className="input" type="month" value={period} onChange={(e) => setPeriod(e.target.value)} />
            </Field>
            <Button
              variant="secondary"
              loading={busy === 'gen'}
              onClick={() =>
                run('gen', async () => {
                  const inv = await papi<SystemInvoice>(`/orgs/${org.id}/invoices`, { method: 'POST', body: period ? { period } : {} });
                  setMsg(`Tagihan ${inv.number} (${periodName(inv.period)}) diterbitkan dan dikirim ke Super Admin lembaga.`);
                  invoices.reload();
                })
              }
            >
              <FilePlus2 className="size-4" /> Terbitkan sekarang
            </Button>
          </div>
        </div>
        <p className="mt-1 text-xs text-slate-500">Tanpa periode: periode terdekat yang belum lewat jatuh tempo. Memakai pengaturan yang sudah disimpan.</p>
        <ul className="mt-4 divide-y divide-white/5">
          {(invoices.data ?? []).map((inv) => (
            <li key={inv.id}>
              <button className="flex w-full items-center gap-3 py-3 text-left hover:bg-white/[0.02]" onClick={() => setOpen(inv)}>
                <CalendarClock className="size-4 shrink-0 text-slate-500" />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-medium text-white">{periodName(inv.period)}</div>
                  <div className="truncate text-xs text-slate-400">
                    {inv.number} · jatuh tempo {formatDate(inv.dueDate)}
                  </div>
                </div>
                <span className="text-sm text-white">{rupiah(inv.amount)}</span>
                <InvoiceBadge inv={inv} today={today()} />
              </button>
            </li>
          ))}
          {invoices.data && !invoices.data.length && <li className="py-3 text-sm text-slate-500">Belum ada tagihan.</li>}
        </ul>
      </div>
      <InvoiceModal inv={open} onClose={() => setOpen(null)} onChanged={() => (invoices.reload(), setOpen(null))} />
    </section>
  );
}
