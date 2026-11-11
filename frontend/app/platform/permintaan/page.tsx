'use client';

import { Inbox, MapPin, MessageCircle, Users } from 'lucide-react';
import { useState } from 'react';
import { Badge, Empty, ErrorBox, PageHeader, Spinner, Tabs, type BadgeTone } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { waLink } from '@/lib/org';
import { papi, usePlatformApi, type Lead, type LeadStatus } from '@/lib/platform';

const STATUS: Record<LeadStatus, { label: string; tone: BadgeTone }> = {
  BARU: { label: 'Baru', tone: 'blue' },
  DIHUBUNGI: { label: 'Dihubungi', tone: 'amber' },
  JADI_KLIEN: { label: 'Jadi klien', tone: 'green' },
  TIDAK_LANJUT: { label: 'Tidak lanjut', tone: 'slate' },
};

/** Calon klien dari form "Minta demo" di website Nofosys */
export default function PlatformLeads() {
  const [status, setStatus] = useState<'' | LeadStatus>('BARU');
  const { data, loading, error, reload } = usePlatformApi<Lead[]>('/leads', { status: status || undefined });
  const counts = usePlatformApi<Partial<Record<LeadStatus, number>>>('/leads/counts');
  const [err, setErr] = useState<string | null>(null);
  const c = counts.data ?? {};

  const update = async (l: Lead, body: Partial<Pick<Lead, 'status' | 'note'>>) => {
    setErr(null);
    try {
      await papi(`/leads/${l.id}`, { method: 'PATCH', body });
      reload();
      counts.reload();
    } catch (e) {
      setErr((e as Error).message);
    }
  };

  return (
    <>
      <PageHeader title="Permintaan Demo" desc="Calon klien yang mengisi form “Minta demo” di website. Hubungi lewat WhatsApp, lalu tandai statusnya." />
      <div className="mb-5">
        <Tabs
          value={status}
          onChange={setStatus}
          items={[
            ...(Object.keys(STATUS) as LeadStatus[]).map((s) => ({ value: s, label: `${STATUS[s].label} (${c[s] ?? 0})` })),
            { value: '' as const, label: 'Semua' },
          ]}
        />
      </div>
      <ErrorBox message={error || err} />
      {loading && !data ? (
        <Spinner />
      ) : !data?.length ? (
        <Empty icon={<Inbox className="size-8" />} title="Belum ada permintaan" desc="Permintaan dari form di website Nofosys akan muncul di sini." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {data.map((l) => (
            <div key={l.id} className="card flex flex-col p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate font-display text-lg font-bold text-white">{l.institution}</h2>
                  <p className="text-sm text-slate-400">
                    {l.name} · {formatDate(l.createdAt, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <Badge tone={STATUS[l.status].tone}>{STATUS[l.status].label}</Badge>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-300">
                {l.city && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="size-3.5 text-slate-500" /> {l.city}
                  </span>
                )}
                {l.size && (
                  <span className="flex items-center gap-1.5">
                    <Users className="size-3.5 text-slate-500" /> {l.size}
                  </span>
                )}
                <span>{l.phone}</span>
                {l.email && <span className="truncate">{l.email}</span>}
              </div>
              {l.message && <p className="mt-3 rounded-xl bg-white/[0.03] px-3 py-2 text-sm text-slate-300">“{l.message}”</p>}
              <textarea
                className="input mt-3 min-h-16 text-sm"
                placeholder="Catatan internal (tersimpan saat keluar dari kolom)…"
                defaultValue={l.note ?? ''}
                onBlur={(e) => e.target.value !== (l.note ?? '') && update(l, { note: e.target.value || null })}
              />
              <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
                <a
                  href={waLink(l.phone, `Halo ${l.name}, terima kasih sudah meminta demo untuk ${l.institution}. `)}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25"
                >
                  <MessageCircle className="size-3.5" /> WhatsApp
                </a>
                <select className="input ml-auto w-auto py-1.5 text-xs" value={l.status} onChange={(e) => update(l, { status: e.target.value as LeadStatus })}>
                  {(Object.keys(STATUS) as LeadStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS[s].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
