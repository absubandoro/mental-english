'use client';

import { CalendarClock, Copy, CreditCard, ReceiptText, Upload } from 'lucide-react';
import { useState } from 'react';
import { InvoiceBadge, InvoiceDetail, periodName, type SubscriptionInfo, type SystemInvoice } from '@/components/SystemInvoice';
import { Button, Empty, ErrorBox, Field, Modal, PageHeader, Spinner } from '@/components/ui';
import { api, uploadFile } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, rupiah } from '@/lib/format';
import { useApi } from '@/lib/hooks';


/** Super Admin lembaga: tagihan langganan sistem dari Nofosys */
export default function LanggananSistem() {
  const { user } = useAuth();
  const isSuper = user?.role === 'SUPER_ADMIN';
  const { data, loading, error, reload } = useApi<SubscriptionInfo>(isSuper ? '/admin/subscription' : null);
  const [open, setOpen] = useState<SystemInvoice | null>(null);
  const [proof, setProof] = useState({ url: '', note: '' });
  const [pct, setPct] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  if (!isSuper) return <Empty title="Hanya Super Admin yang dapat melihat langganan sistem" />;
  if (loading && !data) return <Spinner />;
  if (!data) return <ErrorBox message={error} />;

  const unpaid = data.invoices.filter((i) => i.status === 'BELUM_BAYAR' || i.status === 'MENUNGGU');
  const canPay = (i: SystemInvoice) => i.status === 'BELUM_BAYAR' || i.status === 'MENUNGGU';

  return (
    <>
      <PageHeader title="Langganan Sistem" desc={`Tagihan penggunaan sistem dari ${data.platformName}. Hanya terlihat oleh Super Admin.`} />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center gap-2 text-xs tracking-wider text-slate-400 uppercase">
            <ReceiptText className="size-4" /> Paket
          </div>
          <div className="mt-2 font-display text-2xl font-bold text-white">{data.planName || `Langganan ${data.platformName}`}</div>
          {data.enabled ? (
            <div className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
              <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
                <div className="text-xs text-slate-500">Biaya per bulan</div>
                <div className="text-white">
                  {data.baseFee > 0 && rupiah(data.baseFee)}
                  {data.baseFee > 0 && data.perStudentFee > 0 && ' + '}
                  {data.perStudentFee > 0 && `${rupiah(data.perStudentFee)}/pelajar aktif`}
                </div>
              </div>
              <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
                <div className="text-xs text-slate-500">Jatuh tempo</div>
                <div className="flex items-center gap-1.5 text-white">
                  <CalendarClock className="size-4 text-brand-300" /> Tanggal {data.dueDay} setiap bulan
                </div>
              </div>
              <div className="rounded-xl bg-white/[0.03] px-3 py-2.5">
                <div className="text-xs text-slate-500">Perkiraan bulan ini</div>
                <div className="text-white">
                  {rupiah(data.amount)} <span className="text-xs text-slate-500">({data.activeStudents} pelajar aktif)</span>
                </div>
              </div>
            </div>
          ) : (
            <p className="mt-2 text-sm text-slate-400">Belum ada tagihan berkala untuk lembaga ini.</p>
          )}
        </div>
        <div className="card p-5">
          <div className="flex items-center gap-2 text-xs tracking-wider text-slate-400 uppercase">
            <CreditCard className="size-4" /> Rekening pembayaran
          </div>
          {data.bankAccounts.length ? (
            <ul className="mt-3 space-y-2">
              {data.bankAccounts.map((b) => (
                <li key={b.number} className="flex items-center justify-between gap-2 rounded-xl bg-white/[0.03] px-3 py-2">
                  <div>
                    <div className="text-sm font-semibold text-white">
                      {b.bank} · {b.number}
                    </div>
                    <div className="text-xs text-slate-400">a.n. {b.holder}</div>
                  </div>
                  <button className="rounded-lg p-1.5 text-slate-400 hover:bg-white/5 hover:text-white" aria-label="Salin nomor rekening" onClick={() => navigator.clipboard?.writeText(b.number)}>
                    <Copy className="size-4" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-slate-400">Rekening belum diatur.</p>
          )}
          {data.instructions && <p className="mt-3 text-xs text-slate-400">{data.instructions}</p>}
        </div>
      </div>

      <h2 className="mt-8 mb-3 font-display text-xl font-bold text-white">Tagihan</h2>
      {!data.invoices.length ? (
        <Empty icon={<ReceiptText className="size-8" />} title="Belum ada tagihan" />
      ) : (
        <div className="space-y-3">
          {data.invoices.map((inv) => (
            <button key={inv.id} onClick={() => (setOpen(inv), setProof({ url: '', note: '' }), setErr(null))} className="card flex w-full items-center gap-4 p-4 text-left transition hover:border-white/20">
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${canPay(inv) ? 'bg-brand-500/15 text-brand-300' : 'bg-emerald-500/10 text-emerald-300'}`}>
                <ReceiptText className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="font-semibold text-white">Langganan {periodName(inv.period)}</div>
                <div className="truncate text-xs text-slate-400">
                  {inv.number} · jatuh tempo {formatDate(inv.dueDate)}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display font-bold text-white">{rupiah(inv.amount)}</div>
                <InvoiceBadge inv={inv} today={data.today} />
              </div>
            </button>
          ))}
        </div>
      )}
      {unpaid.length > 0 && <p className="mt-3 text-xs text-slate-500">Klik tagihan untuk melihat rincian dan mengunggah bukti transfer.</p>}

      <Modal open={!!open} onClose={() => setOpen(null)} title="Tagihan langganan">
        {open && (
          <div className="space-y-5">
            <InvoiceDetail inv={open} today={data.today} />
            {open.status === 'MENUNGGU' && (
              <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-100 ring-1 ring-amber-400/20">
                Bukti transfer sudah dikirim {open.proofUploadedAt && formatDate(open.proofUploadedAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} dan sedang
                diverifikasi. Anda bisa mengunggah ulang bila salah.
              </p>
            )}
            {canPay(open) && (
              <form
                className="space-y-3 border-t border-white/10 pt-4"
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!proof.url) return setErr('Unggah foto bukti transfer terlebih dahulu');
                  setBusy(true);
                  setErr(null);
                  try {
                    await api(`/admin/subscription/invoices/${open.id}/proof`, { method: 'POST', body: { proofUrl: proof.url, proofNote: proof.note || undefined } });
                    setOpen(null);
                    reload();
                  } catch (er) {
                    setErr((er as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                <ErrorBox message={err} />
                <div>
                  <span className="label">Bukti transfer</span>
                  {proof.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={proof.url} alt="Bukti transfer" className="max-h-56 rounded-xl ring-1 ring-white/10" />
                  ) : (
                    <label className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 px-4 py-6 text-sm text-slate-300 hover:bg-white/[0.03]">
                      <Upload className="size-4" /> {pct != null ? `Mengunggah ${pct}%…` : 'Pilih foto / screenshot bukti transfer'}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setPct(0);
                          try {
                            const r = await uploadFile(f, setPct);
                            setProof((p) => ({ ...p, url: r.url }));
                          } catch (er) {
                            setErr((er as Error).message);
                          } finally {
                            setPct(null);
                          }
                        }}
                      />
                    </label>
                  )}
                </div>
                <Field label="Catatan (opsional)">
                  <input className="input" placeholder="mis. transfer dari BCA a.n. …" value={proof.note} onChange={(e) => setProof({ ...proof, note: e.target.value })} />
                </Field>
                <Button type="submit" loading={busy} className="w-full">
                  <Upload className="size-4" /> Kirim bukti pembayaran
                </Button>
              </form>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}
