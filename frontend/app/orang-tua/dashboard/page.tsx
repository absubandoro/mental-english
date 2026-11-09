'use client';

import { Award, CalendarCheck, ClipboardList, FileText } from 'lucide-react';
import { Suspense } from 'react';
import { WithChild } from '@/components/ChildPicker';
import { Badge, Empty, PageHeader, Spinner, Stat } from '@/components/ui';
import { ATT_TONE } from '@/lib/tones';
import { ATTENDANCE_LABEL, formatDate, SESSION_TYPE_LABEL } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import type { AttendanceStatus, MediaItem, SessionType } from '@/lib/types';
import { MediaGallery } from '@/components/Media';

interface Dashboard {
  attendance: {
    total: number;
    counts: Record<AttendanceStatus, number>;
    ratio: number | null;
    recent: { id: string; date: string; type: SessionType; topic: string; className: string; status: AttendanceStatus; note: string | null; teacherReport: string | null; teacher: string; media?: MediaItem[] }[];
  };
  exams: {
    count: number;
    average: number | null;
    list: { id: string; date: string; topic: string; className: string; teacher: string; score: number | null; grade: string | null; note: string | null; teacherReport: string | null }[];
  };
}

const ATT_COLOR: Record<AttendanceStatus, string> = { HADIR: '#34d399', IZIN: '#4f9ddb', SAKIT: '#fbbf24', ALPA: '#fb7185' };

function Donut({ counts, total, ratio }: { counts: Record<AttendanceStatus, number>; total: number; ratio: number | null }) {
  let acc = 0;
  const stops = (Object.keys(counts) as AttendanceStatus[])
    .map((k) => {
      const from = acc;
      acc += total ? (counts[k] / total) * 360 : 0;
      return `${ATT_COLOR[k]} ${from}deg ${acc}deg`;
    })
    .join(', ');
  return (
    <div className="relative size-40 shrink-0 rounded-full" style={{ background: total ? `conic-gradient(${stops})` : 'rgb(255 255 255 / 0.06)' }} role="img" aria-label={`Rasio kehadiran ${ratio ?? 0}%`}>
      <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-ink-900">
        <span className="font-display text-3xl font-bold text-white">{ratio ?? 0}%</span>
        <span className="text-xs text-slate-400">kehadiran</span>
      </div>
    </div>
  );
}

function Content({ childId }: { childId: string }) {
  const { data, loading } = useApi<Dashboard>(`/parent/children/${childId}/dashboard`);
  if (loading || !data) return <Spinner />;
  const { attendance: a, exams: e } = data;
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <Stat label="Rasio absen" value={`${a.ratio ?? 0}%`} icon={<CalendarCheck className="size-5" />} />
        <Stat label="Pertemuan" value={a.total} icon={<ClipboardList className="size-5" />} tone="from-navy-500/40" />
        <Stat label="Ujian" value={e.count} icon={<FileText className="size-5" />} tone="from-navy-500/40" />
        <Stat label="Rata-rata nilai" value={e.average ?? '-'} icon={<Award className="size-5" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,340px)_1fr]">
        <section className="card p-6">
          <h2 className="mb-5 font-display text-lg font-bold text-white">Ratio absen</h2>
          <div className="flex flex-col items-center gap-6 sm:flex-row lg:flex-col">
            <Donut counts={a.counts} total={a.total} ratio={a.ratio} />
            <ul className="w-full space-y-2 text-sm">
              {(Object.keys(a.counts) as AttendanceStatus[]).map((k) => (
                <li key={k} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-slate-300">
                    <span className="size-2.5 rounded-full" style={{ background: ATT_COLOR[k] }} /> {ATTENDANCE_LABEL[k]}
                  </span>
                  <span className="font-semibold text-white">{a.counts[k]}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="card p-6">
          <h2 className="mb-4 font-display text-lg font-bold text-white">Report ujian</h2>
          {e.list.length === 0 ? (
            <Empty title="Belum ada ujian" />
          ) : (
            <ul className="space-y-3">
              {e.list.map((x) => (
                <li key={x.id} className="rounded-xl bg-white/[0.03] p-4 ring-1 ring-white/5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-white">{x.topic}</div>
                      <div className="text-xs text-slate-400">
                        {x.className} · {formatDate(x.date)} · {x.teacher}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-2xl font-bold text-brand-200">{x.score ?? '-'}</div>
                      {x.grade && <div className="text-xs text-slate-400">Grade {x.grade}</div>}
                    </div>
                  </div>
                  {x.score != null && (
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/5">
                      <div className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-300" style={{ width: `${Math.min(100, x.score)}%` }} />
                    </div>
                  )}
                  {x.note && <p className="mt-3 text-sm text-slate-300">📝 {x.note}</p>}
                  {x.teacherReport && <p className="mt-1 text-xs text-slate-500">Catatan kelas: {x.teacherReport}</p>}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="card overflow-hidden">
        <h2 className="p-6 pb-4 font-display text-lg font-bold text-white">Riwayat kehadiran & report pengajar</h2>
        {a.recent.length === 0 ? (
          <div className="p-6 pt-0">
            <Empty title="Belum ada pertemuan" />
          </div>
        ) : (
          <div className="table-cards px-4 pb-4 sm:overflow-x-auto sm:px-0 sm:pb-0">
            <table className="w-full text-sm sm:min-w-[640px]">
              <thead className="bg-white/[0.02] text-left text-xs text-slate-400 uppercase">
                <tr>
                  <th className="px-6 py-3 font-medium">Tanggal</th>
                  <th className="px-3 py-3 font-medium">Kelas</th>
                  <th className="px-3 py-3 font-medium">Status</th>
                  <th className="px-6 py-3 font-medium">Report pengajar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {a.recent.map((r) => (
                  <tr key={r.id} className="align-top">
                    <td data-label="Tanggal" className="px-6 py-3 whitespace-nowrap text-slate-300">{formatDate(r.date, { day: 'numeric', month: 'short' })}</td>
                    <td data-label="Kelas" className="px-3 py-3">
                      <div className="text-slate-200">{r.topic}</div>
                      <div className="text-xs text-slate-500">
                        {r.className} · {SESSION_TYPE_LABEL[r.type]}
                      </div>
                    </td>
                    <td data-label="Status" className="px-3 py-3">
                      <Badge tone={ATT_TONE[r.status]}>{ATTENDANCE_LABEL[r.status]}</Badge>
                    </td>
                    <td data-label="Report pengajar" data-block className="px-6 py-3 text-slate-400">
                      <div>{r.teacherReport ?? '-'}</div>
                      {r.media && r.media.length > 0 && <MediaGallery items={r.media} className="mt-2 max-w-sm !grid-cols-3" />}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

export default function DashboardAnak() {
  return (
    <>
      <PageHeader title="Dashboard Anak" desc="Ratio absen, report ujian, dan catatan pengajar." />
      <Suspense fallback={<Spinner />}>
        <WithChild>{(c) => <Content childId={c.id} />}</WithChild>
      </Suspense>
    </>
  );
}
