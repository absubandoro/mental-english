'use client';

import { BookOpen, CalendarCheck, FileText, Plus, Trees } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { TodaySchedule } from '@/components/CalendarView';
import { Badge, Button, Empty, ErrorBox, Field, Modal, PageHeader, Pagination, Spinner } from '@/components/ui';
import { api } from '@/lib/api';
import { formatDate, SESSION_TYPE_LABEL, today } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import { SESSION_TONE } from '@/lib/tones';
import type { ClassRoom, ClassSessionDetail, ClassSessionSummary, Paged, SessionType } from '@/lib/types';

const TYPES: { value: SessionType; label: string; desc: string; icon: React.ReactNode }[] = [
  { value: 'BELAJAR', label: 'Belajar', desc: 'Pertemuan reguler', icon: <BookOpen className="size-5" /> },
  { value: 'UJIAN', label: 'Ujian', desc: 'Ada input nilai', icon: <FileText className="size-5" /> },
  { value: 'OUTDOOR', label: 'Outdoor', desc: 'Kelas di luar', icon: <Trees className="size-5" /> },
];

function SesiContent() {
  const params = useSearchParams();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState({ classId: params.get('kelas') ?? '', date: '' });
  const { data: classes } = useApi<ClassRoom[]>('/teacher/classes', { mine: true });
  const { data, loading } = useApi<Paged<ClassSessionSummary>>('/teacher/sessions', { ...filter, page });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ classId: '', type: 'BELAJAR' as SessionType, topic: '', date: today() });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.get('kelas')) {
      setForm((f) => ({ ...f, classId: params.get('kelas')!, date: params.get('tanggal') ?? f.date }));
      setOpen(true);
    }
  }, [params]);

  const todays = (data?.data ?? []).filter((s) => s.date === today());

  return (
    <>
      <PageHeader
        title="Kelas Hari Ini"
        desc="Buat pertemuan kelas, isi absensi, report pengajar, dan nilai ujian."
        action={
          <Button
            onClick={() => {
              setForm((f) => ({ ...f, classId: f.classId || classes?.[0]?.id || '' }));
              setOpen(true);
            }}
          >
            <Plus className="size-4" /> Buat kelas hari ini
          </Button>
        }
      />

      <TodaySchedule />

      {todays.length > 0 && (
        <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {todays.map((s) => (
            <Link key={s.id} href={`/pengajar/sesi/${s.id}`} className="card bg-gradient-to-br from-brand-500/20 to-transparent p-5 transition hover:border-brand-300/40">
              <div className="flex items-center justify-between">
                <Badge tone={SESSION_TONE[s.type]}>{SESSION_TYPE_LABEL[s.type]}</Badge>
                <span className="text-xs text-brand-200">Hari ini</span>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold text-white">{s.topic}</h3>
              <p className="text-sm text-slate-400">{s.classRoom.name}</p>
              <p className="mt-2 text-xs text-slate-500">
                Hadir {s.presentCount}/{s.attendanceCount}
              </p>
            </Link>
          ))}
        </div>
      )}

      <div className="card overflow-hidden">
        <div className="flex flex-col gap-3 border-b border-white/5 p-4 sm:flex-row">
          <select className="input sm:w-64" value={filter.classId} onChange={(e) => (setPage(1), setFilter({ ...filter, classId: e.target.value }))} aria-label="Filter kelas">
            <option value="">Semua kelas saya</option>
            {classes?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input type="date" className="input sm:w-48" value={filter.date} onChange={(e) => (setPage(1), setFilter({ ...filter, date: e.target.value }))} aria-label="Filter tanggal" />
        </div>
        {loading && !data ? (
          <Spinner />
        ) : !data?.data.length ? (
          <div className="p-4">
            <Empty icon={<CalendarCheck className="size-8" />} title="Belum ada pertemuan" desc="Klik “Buat kelas hari ini” untuk memulai absensi." />
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {data.data.map((s) => (
              <li key={s.id}>
                <Link href={`/pengajar/sesi/${s.id}`} className="flex items-center gap-4 px-4 py-3.5 hover:bg-white/[0.03] active:bg-white/5 sm:px-5 sm:py-4">
                  {/* Tanggal ala kalender (HP & desktop) */}
                  <div className="flex size-12 shrink-0 flex-col items-center justify-center rounded-xl bg-white/5 ring-1 ring-white/10">
                    <span className="font-display text-lg leading-none font-bold text-white">{formatDate(s.date, { day: 'numeric' })}</span>
                    <span className="mt-0.5 text-[10px] text-slate-400 uppercase">{formatDate(s.date, { month: 'short' })}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium text-white">{s.topic}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <span className="truncate">{s.classRoom.name}</span>
                      <span className="sm:hidden">· Hadir {s.presentCount}/{s.attendanceCount}</span>
                    </div>
                  </div>
                  <Badge tone={SESSION_TONE[s.type]}>{SESSION_TYPE_LABEL[s.type]}</Badge>
                  <span className="hidden w-20 text-right text-xs text-slate-400 sm:block">
                    Hadir {s.presentCount}/{s.attendanceCount}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      {data && <Pagination page={data.page} total={data.total} limit={data.limit} onChange={setPage} />}

      <Modal open={open} onClose={() => setOpen(false)} title="Buat kelas hari ini">
        {!classes?.length ? (
          <Empty title="Anda belum mengajar kelas apapun" desc="Assign diri ke kelas terlebih dahulu di menu Kelas yang Diajar." />
        ) : (
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setBusy(true);
              setError(null);
              try {
                const s = await api<ClassSessionDetail>('/teacher/sessions', { method: 'POST', body: form });
                router.push(`/pengajar/sesi/${s.id}`);
              } catch (er) {
                setError((er as Error).message);
                setBusy(false);
              }
            }}
          >
            <ErrorBox message={error} />
            <Field label="Kelas">
              <select className="input" required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })}>
                <option value="">Pilih kelas</option>
                {classes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.students.length} pelajar)
                  </option>
                ))}
              </select>
            </Field>
            <div>
              <span className="label">Tipe kelas</span>
              <div className="grid grid-cols-3 gap-2">
                {TYPES.map((t) => (
                  <button
                    key={t.value}
                    type="button"
                    onClick={() => setForm({ ...form, type: t.value })}
                    className={`flex flex-col items-center gap-1 rounded-2xl border p-3 text-center transition ${
                      form.type === t.value ? 'border-brand-400 bg-brand-500/15 text-white' : 'border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    {t.icon}
                    <span className="text-sm font-semibold">{t.label}</span>
                    <span className="text-[11px] opacity-70">{t.desc}</span>
                  </button>
                ))}
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-[1fr_160px]">
              <Field label="Topik / materi">
                <input className="input" required minLength={2} placeholder="mis. Simple Past Tense" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })} />
              </Field>
              <Field label="Tanggal">
                <input className="input" type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit" loading={busy}>
                Buat & isi absensi
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<Spinner />}>
      <SesiContent />
    </Suspense>
  );
}
