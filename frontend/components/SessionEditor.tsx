'use client';

import { ArrowLeft, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ATTENDANCE_LABEL, formatDate, SESSION_TYPE_LABEL } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import { SESSION_TONE } from '@/lib/tones';
import type { AttendanceStatus, ClassSessionDetail, SessionType } from '@/lib/types';
import { Avatar, Badge, Button, confirmDelete, ErrorBox, Field, Spinner } from './ui';

const STATUSES: AttendanceStatus[] = ['HADIR', 'IZIN', 'SAKIT', 'ALPA'];
const STATUS_ACTIVE: Record<AttendanceStatus, string> = {
  HADIR: 'bg-emerald-500 text-white',
  IZIN: 'bg-brand-500 text-white',
  SAKIT: 'bg-amber-500 text-ink-950',
  ALPA: 'bg-rose-500 text-white',
};

type Row = { studentId: string; name: string; avatarUrl: string | null; status: AttendanceStatus; note: string; score: string; grade: string; examNote: string };

/** Detail "Kelas Hari Ini": absensi, report pengajar, dan (jika ujian) nilai pelajar */
export function SessionEditor({ id, readOnly, base }: { id: string; readOnly?: boolean; base: string }) {
  const apiBase = readOnly ? '/admin/sessions' : '/teacher/sessions';
  const { data, loading, error, setData } = useApi<ClassSessionDetail>(`${apiBase}/${id}`);
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const [meta, setMeta] = useState({ topic: '', type: 'BELAJAR' as SessionType, report: '' });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!data) return;
    setMeta({ topic: data.topic, type: data.type, report: data.report ?? '' });
    setRows(
      data.students.map((s) => ({
        studentId: s.id,
        name: s.name,
        avatarUrl: s.avatarUrl,
        status: s.attendance?.status ?? 'HADIR',
        note: s.attendance?.note ?? '',
        score: s.exam?.score != null ? String(s.exam.score) : '',
        grade: s.exam?.grade ?? '',
        examNote: s.exam?.note ?? '',
      })),
    );
  }, [data]);

  if (loading && !data) return <Spinner />;
  if (!data) return <ErrorBox message={error ?? 'Sesi tidak ditemukan'} />;
  const isExam = meta.type === 'UJIAN';
  const patch = (i: number, p: Partial<Row>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...p } : x)));
  const count = (s: AttendanceStatus) => rows.filter((r) => r.status === s).length;

  const save = async () => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const res = await api<ClassSessionDetail>(`/teacher/sessions/${id}`, {
        method: 'PATCH',
        body: {
          ...meta,
          attendances: rows.map((r) => ({ studentId: r.studentId, status: r.status, note: r.note || undefined })),
          examResults: isExam
            ? rows.map((r) => ({ studentId: r.studentId, score: r.score === '' ? null : Number(r.score), grade: r.grade || undefined, note: r.examNote || undefined }))
            : undefined,
        },
      });
      setData(res);
      setMsg('Tersimpan. Orang tua dapat melihat absensi & report di dashboard anak.');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 pb-20">
      <Link href={base} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="size-4" /> Kembali
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Badge tone={SESSION_TONE[meta.type]}>{SESSION_TYPE_LABEL[meta.type]}</Badge>
            <span className="text-sm text-slate-400">{formatDate(data.date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>
          <h1 className="mt-2 font-display text-2xl font-bold text-white sm:text-3xl">{data.classRoom.name}</h1>
          <p className="text-sm text-slate-400">Pengajar: {data.teacher.name}</p>
        </div>
        <div className="flex gap-2 text-xs">
          {STATUSES.map((s) => (
            <span key={s} className="rounded-lg bg-white/5 px-2.5 py-1.5 text-slate-300">
              {ATTENDANCE_LABEL[s]} <b className="text-white">{count(s)}</b>
            </span>
          ))}
        </div>
      </div>

      {msg && <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{msg}</div>}
      <ErrorBox message={err} />

      <section className="card grid gap-4 p-5 sm:grid-cols-[1fr_auto]">
        <Field label="Topik / materi">
          <input className="input" disabled={readOnly} value={meta.topic} onChange={(e) => setMeta({ ...meta, topic: e.target.value })} />
        </Field>
        <Field label="Tipe kelas">
          <select className="input" disabled={readOnly} value={meta.type} onChange={(e) => setMeta({ ...meta, type: e.target.value as SessionType })}>
            {(Object.keys(SESSION_TYPE_LABEL) as SessionType[]).map((t) => (
              <option key={t} value={t}>
                {SESSION_TYPE_LABEL[t]}
              </option>
            ))}
          </select>
        </Field>
      </section>

      <section className="card overflow-hidden">
        <div className="flex items-center justify-between p-5 pb-3">
          <h2 className="font-display text-lg font-bold text-white">Absensi{isExam && ' & nilai ujian'}</h2>
          {!readOnly && (
            <Button variant="ghost" size="sm" onClick={() => setRows((r) => r.map((x) => ({ ...x, status: 'HADIR' })))}>
              Semua hadir
            </Button>
          )}
        </div>
        <ul className="divide-y divide-white/5">
          {rows.map((r, i) => (
            <li key={r.studentId} className="space-y-3 px-5 py-4">
              <div className="flex flex-wrap items-center gap-3">
                <Avatar name={r.name} src={r.avatarUrl} size={36} />
                <span className="min-w-32 flex-1 font-medium text-white">{r.name}</span>
                <div className="flex gap-1 rounded-xl bg-ink-900 p-1 ring-1 ring-white/10" role="radiogroup" aria-label={`Status ${r.name}`}>
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      role="radio"
                      aria-checked={r.status === s}
                      disabled={readOnly}
                      onClick={() => patch(i, { status: s })}
                      className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${r.status === s ? STATUS_ACTIVE[s] : 'text-slate-400 hover:text-white'}`}
                    >
                      {ATTENDANCE_LABEL[s]}
                    </button>
                  ))}
                </div>
              </div>
              <div className={`grid gap-2 ${isExam ? 'grid-cols-2 sm:grid-cols-[1fr_90px_80px_1fr]' : ''}`}>
                <input className="input col-span-2 py-2 sm:col-span-1" disabled={readOnly} placeholder="Catatan absensi (opsional)" value={r.note} onChange={(e) => patch(i, { note: e.target.value })} />
                {isExam && (
                  <>
                    <input className="input py-2" disabled={readOnly} type="number" min={0} max={100} step="0.5" placeholder="Nilai" aria-label={`Nilai ${r.name}`} value={r.score} onChange={(e) => patch(i, { score: e.target.value })} />
                    <input className="input py-2" disabled={readOnly} placeholder="Grade" aria-label={`Grade ${r.name}`} value={r.grade} onChange={(e) => patch(i, { grade: e.target.value })} />
                    <input className="input col-span-2 py-2 sm:col-span-1" disabled={readOnly} placeholder="Catatan ujian untuk orang tua" value={r.examNote} onChange={(e) => patch(i, { examNote: e.target.value })} />
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5">
        <Field label="Report pengajar" hint="Ringkasan kegiatan kelas — terlihat oleh orang tua di dashboard anak.">
          <textarea className="input min-h-32" disabled={readOnly} value={meta.report} onChange={(e) => setMeta({ ...meta, report: e.target.value })} placeholder="Apa yang dipelajari hari ini, perkembangan pelajar, PR, dll." />
        </Field>
      </section>

      {!readOnly && (
        <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 flex justify-between gap-2 rounded-2xl border border-white/10 bg-ink-900/90 p-3 shadow-2xl shadow-black/50 backdrop-blur lg:bottom-4">
          <Button
            variant="danger"
            onClick={async () => {
              if (!confirmDelete('pertemuan ini')) return;
              await api(`/teacher/sessions/${id}`, { method: 'DELETE' });
              router.replace(base);
            }}
          >
            <Trash2 className="size-4" /> Hapus
          </Button>
          <Button onClick={save} loading={busy}>
            <Save className="size-4" /> Simpan absensi & report
          </Button>
        </div>
      )}
    </div>
  );
}
