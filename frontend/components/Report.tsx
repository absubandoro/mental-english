'use client';

import { BrandMark } from './Logo';
import { useOrg } from './OrgProvider';
import { ArrowLeft, CalendarCheck, Eye, EyeOff, FileBadge, Plus, Printer, RefreshCw, Save, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { formatDate, gradeFor, today } from '@/lib/format';
import { useApi } from '@/lib/hooks';
import type { ClassRoom, Paged, ProgressReport, SkillScore } from '@/lib/types';
import { useBranchScope } from './admin';
import { MediaGallery, MediaUploader } from './Media';
import { Avatar, Badge, Button, confirmDelete, Empty, ErrorBox, Field, Modal, PageHeader, Spinner, Tabs } from './ui';

const scoreColor = (s: number | null) =>
  s == null ? 'bg-white/10' : s >= 85 ? 'bg-emerald-400' : s >= 70 ? 'bg-brand-400' : s >= 60 ? 'bg-amber-400' : 'bg-rose-400';

/** Tampilan rapor. paper = gaya kertas putih untuk dicetak / PDF */
export function ReportView({ r, paper = false }: { r: ProgressReport; paper?: boolean }) {
  const c = paper
    ? { card: 'border border-slate-200 bg-white', h: 'text-slate-900', muted: 'text-slate-500', text: 'text-slate-700', track: 'bg-slate-100', soft: 'bg-slate-50' }
    : { card: 'card', h: 'text-white', muted: 'text-slate-400', text: 'text-slate-300', track: 'bg-white/10', soft: 'bg-white/[0.03]' };
  const org = useOrg();
  const grade = r.overallGrade || r.suggestedGrade;
  const att = r.attendanceSummary;
  const ex = r.examSummary;
  return (
    <div className={`space-y-5 ${paper ? 'report-paper text-slate-800' : ''}`}>
      <div className={`flex flex-col gap-4 rounded-2xl p-5 sm:flex-row sm:items-center sm:p-6 ${paper ? 'border-b-4 border-[#2f3071] bg-white' : 'bg-gradient-to-br from-brand-500/20 via-navy-600/30 to-transparent ring-1 ring-white/10'}`}>
        <BrandMark size={64} />
        <div className="min-w-0 flex-1">
          <div className={`text-xs font-semibold tracking-[0.2em] uppercase ${paper ? 'text-[#2c72b3]' : 'text-brand-300'}`}>Rapor Perkembangan · {org.name}</div>
          <h1 className={`mt-1 font-display text-2xl font-bold ${c.h}`}>{r.title}</h1>
          <p className={`text-sm ${c.muted}`}>
            Periode {formatDate(r.periodStart)} – {formatDate(r.periodEnd)}
          </p>
        </div>
        <div className="text-center">
          <div className={`font-display text-5xl font-extrabold ${paper ? 'text-[#2f3071]' : 'text-white'}`}>{grade ?? '-'}</div>
          <div className={`text-xs ${c.muted}`}>Nilai akhir {r.overallScore ?? '-'}</div>
        </div>
      </div>

      <div className={`grid gap-3 rounded-2xl p-5 text-sm sm:grid-cols-4 ${c.card}`}>
        {[
          ['Nama', r.student?.name],
          ['Kelas', r.classRoom?.name ?? '-'],
          ['Cabang', r.branch?.name ?? '-'],
          ['Pengajar', r.author?.name ?? '-'],
        ].map(([k, v]) => (
          <div key={k}>
            <div className={`text-xs ${c.muted}`}>{k}</div>
            <div className={`font-semibold ${c.h}`}>{v}</div>
          </div>
        ))}
      </div>

      <section className={`rounded-2xl p-5 sm:p-6 ${c.card}`}>
        <h2 className={`mb-4 font-display text-lg font-bold ${c.h}`}>Penilaian kemampuan</h2>
        <div className="grid gap-x-8 gap-y-4 md:grid-cols-2">
          {r.skills.map((s) => (
            <div key={s.key} className="break-inside-avoid">
              <div className="flex items-baseline justify-between gap-2">
                <span className={`font-medium ${c.h}`}>{s.label}</span>
                <span className={`text-sm font-semibold ${c.h}`}>
                  {s.score ?? '-'} <span className={`text-xs font-normal ${c.muted}`}>{gradeFor(s.score) ?? ''}</span>
                </span>
              </div>
              <div className={`mt-1.5 h-2 overflow-hidden rounded-full ${c.track}`}>
                <div className={`h-full rounded-full ${scoreColor(s.score)}`} style={{ width: `${s.score ?? 0}%` }} />
              </div>
              {s.note && <p className={`mt-1 text-xs ${c.text}`}>{s.note}</p>}
            </div>
          ))}
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className={`rounded-2xl p-5 ${c.card}`}>
          <h2 className={`mb-3 flex items-center gap-2 font-display text-lg font-bold ${c.h}`}>
            <CalendarCheck className="size-5" /> Kehadiran
          </h2>
          {att && att.total ? (
            <>
              <div className={`font-display text-3xl font-bold ${c.h}`}>{att.ratio}%</div>
              <div className={`text-xs ${c.muted}`}>dari {att.total} pertemuan</div>
              <div className="mt-3 grid grid-cols-4 gap-2 text-center text-xs">
                {(['HADIR', 'IZIN', 'SAKIT', 'ALPA'] as const).map((k) => (
                  <div key={k} className={`rounded-xl py-2 ${c.soft}`}>
                    <div className={`text-lg font-bold ${c.h}`}>{att[k]}</div>
                    <div className={c.muted}>{k[0] + k.slice(1).toLowerCase()}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <p className={`text-sm ${c.muted}`}>Belum ada data kehadiran pada periode ini.</p>
          )}
        </section>
        <section className={`rounded-2xl p-5 ${c.card}`}>
          <h2 className={`mb-3 font-display text-lg font-bold ${c.h}`}>Ujian {ex?.average != null && <span className={`text-sm font-normal ${c.muted}`}>· rata-rata {ex.average}</span>}</h2>
          {ex?.items.length ? (
            <ul className="space-y-2 text-sm">
              {ex.items.map((e, i) => (
                <li key={i} className={`flex items-center justify-between gap-3 rounded-xl px-3 py-2 ${c.soft}`}>
                  <span>
                    <span className={c.h}>{e.topic}</span>
                    <span className={`block text-xs ${c.muted}`}>{formatDate(e.date)}</span>
                  </span>
                  <span className={`font-semibold ${c.h}`}>
                    {e.score ?? '-'} {e.grade && <span className={`text-xs ${c.muted}`}>({e.grade})</span>}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={`text-sm ${c.muted}`}>Belum ada ujian pada periode ini.</p>
          )}
        </section>
      </div>

      {(r.teacherComment || r.recommendation) && (
        <section className={`space-y-4 rounded-2xl p-5 sm:p-6 ${c.card}`}>
          {r.teacherComment && (
            <div>
              <h2 className={`mb-1 font-display text-lg font-bold ${c.h}`}>Catatan pengajar</h2>
              <p className={`leading-relaxed whitespace-pre-line ${c.text}`}>{r.teacherComment}</p>
            </div>
          )}
          {r.recommendation && (
            <div>
              <h2 className={`mb-1 font-display text-lg font-bold ${c.h}`}>Saran untuk di rumah</h2>
              <p className={`leading-relaxed whitespace-pre-line ${c.text}`}>{r.recommendation}</p>
            </div>
          )}
        </section>
      )}

      {r.media?.length > 0 && (
        <section className={`rounded-2xl p-5 ${c.card} ${paper ? 'print:hidden' : ''}`}>
          <h2 className={`mb-3 font-display text-lg font-bold ${c.h}`}>Dokumentasi</h2>
          <MediaGallery items={r.media} />
        </section>
      )}

      <div className={`flex flex-wrap items-end justify-between gap-4 pt-2 text-sm ${c.muted}`}>
        <span>{r.publishedAt ? `Diterbitkan ${formatDate(r.publishedAt)}` : 'Draf — belum diterbitkan'}</span>
        <div className="text-center">
          <div className="sig-space mb-10">Pengajar,</div>
          <div className={`border-t pt-1 font-semibold ${paper ? 'border-slate-300 text-slate-800' : 'border-white/20 text-white'}`}>{r.author?.name ?? '................'}</div>
        </div>
      </div>
    </div>
  );
}

/** Editor rapor (pengajar & admin) */
export function ReportEditor({ id, back }: { id: string; back: string }) {
  const router = useRouter();
  const { data, loading, error, setData } = useApi<ProgressReport>(`/reports/${id}`);
  const [form, setForm] = useState<Pick<ProgressReport, 'title' | 'periodStart' | 'periodEnd' | 'skills' | 'overallGrade' | 'teacherComment' | 'recommendation' | 'media'> | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState(false);

  useEffect(() => {
    if (data)
      setForm({
        title: data.title,
        periodStart: data.periodStart,
        periodEnd: data.periodEnd,
        skills: data.skills,
        overallGrade: data.overallGrade,
        teacherComment: data.teacherComment ?? '',
        recommendation: data.recommendation ?? '',
        media: data.media ?? [],
      });
  }, [data]);

  if (loading && !data) return <Spinner />;
  if (!data || !form) return <ErrorBox message={error ?? 'Rapor tidak ditemukan'} />;
  const setSkill = (i: number, p: Partial<SkillScore>) => setForm({ ...form, skills: form.skills.map((s, j) => (j === i ? { ...s, ...p } : s)) });
  const scores = form.skills.map((s) => s.score).filter((x): x is number => x != null);
  const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;

  const run = async (fn: () => Promise<ProgressReport | void>, ok: string) => {
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      const r = await fn();
      if (r) setData(r);
      setMsg(ok);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  };
  const save = () => api<ProgressReport>(`/reports/${id}`, { method: 'PATCH', body: { ...form, overallGrade: form.overallGrade || null } });

  return (
    <div className="space-y-5 pb-24">
      <Link href={back} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
        <ArrowLeft className="size-4" /> Semua rapor
      </Link>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-center gap-3">
          <Avatar name={data.student?.name ?? '?'} src={data.student?.avatarUrl} size={48} />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-display text-2xl font-bold text-white">{data.student?.name}</h1>
              <Badge tone={data.status === 'PUBLISHED' ? 'green' : 'slate'}>{data.status === 'PUBLISHED' ? 'Terbit' : 'Draf'}</Badge>
            </div>
            <p className="text-sm text-slate-400">
              {data.classRoom?.name} · {data.author?.name}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setPreview(true)}>
            <Eye className="size-3.5" /> Pratinjau
          </Button>
          <a href={`/rapor/${id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-100 hover:bg-white/10">
            <Printer className="size-3.5" /> Cetak / PDF
          </a>
        </div>
      </div>

      {msg && <div className="rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">{msg}</div>}
      <ErrorBox message={err} />

      <section className="card grid gap-4 p-5 sm:grid-cols-[1fr_170px_170px]">
        <Field label="Judul rapor">
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Periode mulai">
          <input className="input" type="date" value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} />
        </Field>
        <Field label="Periode akhir">
          <input className="input" type="date" value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} />
        </Field>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-white">Penilaian kemampuan (0–100)</h2>
          <span className="text-sm text-slate-400">
            Rata-rata <b className="text-white">{avg ?? '-'}</b> · saran grade <b className="text-white">{gradeFor(avg) ?? '-'}</b>
          </span>
        </div>
        <div className="space-y-4">
          {form.skills.map((s, i) => (
            <div key={s.key} className="grid items-center gap-2 sm:grid-cols-[200px_1fr_80px]">
              <span className="font-medium text-slate-200">{s.label}</span>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={100}
                  step={1}
                  value={s.score ?? 0}
                  onChange={(e) => setSkill(i, { score: Number(e.target.value) })}
                  className="w-full accent-brand-500"
                  aria-label={`Nilai ${s.label}`}
                />
                <input
                  className="input w-20 py-1.5 text-center"
                  type="number"
                  min={0}
                  max={100}
                  value={s.score ?? ''}
                  placeholder="-"
                  onChange={(e) => setSkill(i, { score: e.target.value === '' ? null : Math.max(0, Math.min(100, Number(e.target.value))) })}
                  aria-label={`Nilai angka ${s.label}`}
                />
              </div>
              <span className="text-sm text-slate-400">{gradeFor(s.score) ?? '—'}</span>
              <input
                className="input py-2 sm:col-span-3"
                placeholder={`Catatan ${s.label} (opsional)`}
                value={s.note ?? ''}
                onChange={(e) => setSkill(i, { note: e.target.value })}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card grid gap-4 p-5 sm:p-6 md:grid-cols-2">
        <Field label="Grade akhir" hint={`Kosongkan untuk memakai saran otomatis (${gradeFor(avg) ?? '-'})`}>
          <select className="input" value={form.overallGrade ?? ''} onChange={(e) => setForm({ ...form, overallGrade: e.target.value || null })}>
            <option value="">Otomatis</option>
            {['A', 'B+', 'B', 'C', 'D'].map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </Field>
        <div className="rounded-2xl bg-white/[0.03] p-4 text-sm ring-1 ring-white/10">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-white">Ringkasan otomatis</span>
            <Button variant="ghost" size="sm" loading={busy} onClick={() => run(() => api(`/reports/${id}/refresh`, { method: 'POST' }), 'Ringkasan kehadiran & ujian diperbarui.')}>
              <RefreshCw className="size-3.5" /> Perbarui
            </Button>
          </div>
          <p className="mt-1 text-slate-400">
            Kehadiran {data.attendanceSummary?.ratio ?? '-'}% ({data.attendanceSummary?.HADIR ?? 0}/{data.attendanceSummary?.total ?? 0}) · {data.examSummary?.count ?? 0} ujian, rata-rata{' '}
            {data.examSummary?.average ?? '-'}
          </p>
        </div>
        <Field label="Catatan pengajar">
          <textarea className="input min-h-32" value={form.teacherComment ?? ''} onChange={(e) => setForm({ ...form, teacherComment: e.target.value })} placeholder="Perkembangan, kekuatan, dan hal yang perlu ditingkatkan." />
        </Field>
        <Field label="Saran untuk di rumah">
          <textarea className="input min-h-32" value={form.recommendation ?? ''} onChange={(e) => setForm({ ...form, recommendation: e.target.value })} placeholder="mis. Latihan membaca 10 menit setiap hari." />
        </Field>
        <div className="md:col-span-2">
          <MediaUploader label="Lampiran foto / video (dokumentasi perkembangan)" value={form.media} onChange={(media) => setForm({ ...form, media })} />
        </div>
      </section>

      <div className="sticky bottom-[calc(5rem+env(safe-area-inset-bottom))] z-10 flex flex-wrap justify-between gap-2 rounded-2xl border border-white/10 bg-ink-900/90 p-3 shadow-2xl shadow-black/50 backdrop-blur lg:bottom-4">
        <Button
          variant="danger"
          onClick={async () => {
            if (!confirmDelete(`rapor ${data.student?.name}`)) return;
            try {
              await api(`/reports/${id}`, { method: 'DELETE' });
              router.replace(back);
            } catch (e) {
              setErr((e as Error).message);
            }
          }}
        >
          <Trash2 className="size-4" />
        </Button>
        <div className="flex flex-wrap gap-2">
          <Button variant="secondary" loading={busy} onClick={() => run(save, 'Rapor tersimpan.')}>
            <Save className="size-4" /> Simpan
          </Button>
          {data.status === 'PUBLISHED' ? (
            <Button variant="secondary" loading={busy} onClick={() => run(() => api(`/reports/${id}/unpublish`, { method: 'POST' }), 'Rapor dikembalikan ke draf.')}>
              <EyeOff className="size-4" /> Batalkan terbit
            </Button>
          ) : (
            <Button
              loading={busy}
              onClick={() =>
                run(async () => {
                  await save();
                  return api<ProgressReport>(`/reports/${id}/publish`, { method: 'POST' });
                }, 'Rapor diterbitkan. Orang tua sudah mendapat notifikasi.')
              }
            >
              <FileBadge className="size-4" /> Simpan & terbitkan
            </Button>
          )}
        </div>
      </div>

      <Modal open={preview} onClose={() => setPreview(false)} title="Pratinjau rapor" wide>
        <ReportView r={{ ...data, ...form, overallScore: avg, suggestedGrade: gradeFor(avg) }} />
      </Modal>
    </div>
  );
}

/** Daftar rapor + buat rapor (pengajar & admin) */
export function ReportManager({ base }: { base: string }) {
  const { user } = useAuth();
  const scope = useBranchScope();
  const [classId, setClassId] = useState('');
  const [status, setStatus] = useState<'' | 'DRAFT' | 'PUBLISHED'>('');
  const { data, loading, reload } = useApi<Paged<ProgressReport>>('/reports', { classId, status, branchId: scope.branchId });
  const { data: classes } = useApi<ClassRoom[]>(user?.role === 'TEACHER' ? '/teacher/classes' : '/admin/classes', {
    mine: user?.role === 'TEACHER' ? true : undefined,
    branchId: scope.branchId,
  });
  const [open, setOpen] = useState(false);
  const month = today().slice(0, 7);
  const [form, setForm] = useState({ classId: '', studentId: '', title: 'Rapor Perkembangan Bulanan', periodStart: `${month}-01`, periodEnd: today() });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const selected = classes?.find((c) => c.id === form.classId);

  return (
    <>
      <PageHeader
        title="Rapor Perkembangan"
        desc="Buat rapor per pelajar: nilai kemampuan, catatan, dan lampiran. Kehadiran & nilai ujian terisi otomatis."
        action={
          <Button onClick={() => (setError(null), setForm((f) => ({ ...f, classId: f.classId || classes?.[0]?.id || '' })), setOpen(true))} disabled={!classes?.length}>
            <Plus className="size-4" /> Buat rapor
          </Button>
        }
      />
      {msg && <div className="mb-4 rounded-xl bg-emerald-500/10 px-4 py-2.5 text-sm text-emerald-300">{msg}</div>}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <select className="input sm:w-64" value={classId} onChange={(e) => setClassId(e.target.value)} aria-label="Filter kelas">
          <option value="">Semua kelas</option>
          {classes?.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
        <Tabs
          value={status}
          onChange={setStatus}
          items={[
            { value: '', label: 'Semua' },
            { value: 'DRAFT', label: 'Draf' },
            { value: 'PUBLISHED', label: 'Terbit' },
          ]}
        />
      </div>
      {loading && !data ? (
        <Spinner />
      ) : !data?.data.length ? (
        <Empty icon={<FileBadge className="size-8" />} title="Belum ada rapor" desc="Klik “Buat rapor” untuk membuat rapor satu pelajar atau semua pelajar di kelas sekaligus." />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {data.data.map((r) => (
            <Link key={r.id} href={`${base}/${r.id}`} className="card flex items-center gap-3 p-4 transition hover:border-brand-300/30 active:scale-[0.99]">
              <Avatar name={r.student?.name ?? '?'} src={r.student?.avatarUrl} size={44} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold text-white">{r.student?.name}</div>
                <div className="truncate text-xs text-slate-400">
                  {r.title} · {r.classRoom?.name}
                </div>
                <div className="text-xs text-slate-500">
                  {formatDate(r.periodStart, { day: 'numeric', month: 'short' })} – {formatDate(r.periodEnd, { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              </div>
              <div className="text-right">
                <div className="font-display text-xl font-bold text-white">{r.overallGrade || r.suggestedGrade || '–'}</div>
                <Badge tone={r.status === 'PUBLISHED' ? 'green' : 'slate'}>{r.status === 'PUBLISHED' ? 'Terbit' : 'Draf'}</Badge>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Buat rapor">
        <form
          className="space-y-4"
          onSubmit={async (e) => {
            e.preventDefault();
            setBusy(true);
            setError(null);
            try {
              if (form.studentId) {
                const r = await api<ProgressReport>('/reports', { method: 'POST', body: form });
                window.location.href = `${base}/${r.id}`;
              } else {
                const { studentId: _s, ...body } = form;
                const r = await api<{ created: number; skipped: number }>('/reports/bulk', { method: 'POST', body });
                setMsg(`${r.created} draf rapor dibuat${r.skipped ? ` (${r.skipped} pelajar sudah punya rapor dengan judul ini)` : ''}.`);
                setOpen(false);
                setClassId(form.classId);
                setStatus('DRAFT');
                reload();
              }
            } catch (er) {
              setError((er as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <ErrorBox message={error} />
          <Field label="Kelas">
            <select className="input" required value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, studentId: '' })}>
              <option value="">Pilih kelas</option>
              {classes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.students.length} pelajar)
                </option>
              ))}
            </select>
          </Field>
          <Field label="Pelajar">
            <select className="input" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })}>
              <option value="">★ Semua pelajar di kelas (buat draf sekaligus)</option>
              {selected?.students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Judul rapor">
            <input className="input" required minLength={3} value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="mis. Rapor Term 1 2026/2027" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Periode mulai">
              <input className="input" type="date" required value={form.periodStart} onChange={(e) => setForm({ ...form, periodStart: e.target.value })} />
            </Field>
            <Field label="Periode akhir">
              <input className="input" type="date" required value={form.periodEnd} onChange={(e) => setForm({ ...form, periodEnd: e.target.value })} />
            </Field>
          </div>
          <p className="text-xs text-slate-500">Kehadiran dan nilai ujian pada periode ini dihitung otomatis.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={busy}>
              Buat
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

/** Daftar rapor terbit (orang tua & pelajar) */
export function ReportList({ base, childId }: { base: string; childId?: string }) {
  const { data, loading } = useApi<Paged<ProgressReport>>('/reports', { studentId: childId });
  if (loading && !data) return <Spinner />;
  if (!data?.data.length) return <Empty icon={<FileBadge className="size-8" />} title="Belum ada rapor" desc="Rapor akan muncul di sini setelah diterbitkan pengajar." />;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {data.data.map((r) => (
        <Link key={r.id} href={`${base}/${r.id}`} className="card flex items-center gap-4 p-5 transition hover:border-brand-300/30 active:scale-[0.99]">
          <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-brand-500 to-navy-500 text-white">
            <span className="font-display text-xl leading-none font-bold">{r.overallGrade || r.suggestedGrade || '–'}</span>
            <span className="text-[10px] opacity-80">{r.overallScore ?? ''}</span>
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold text-white">{r.title}</div>
            <div className="text-xs text-slate-400">
              {r.student?.name} · {r.classRoom?.name}
            </div>
            <div className="text-xs text-slate-500">
              {formatDate(r.periodStart, { day: 'numeric', month: 'short' })} – {formatDate(r.periodEnd, { day: 'numeric', month: 'short', year: 'numeric' })}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}

/** Detail rapor (orang tua & pelajar) */
export function ReportDetail({ id, back }: { id: string; back: string }) {
  const { data, loading, error } = useApi<ProgressReport>(`/reports/${id}`);
  if (loading && !data) return <Spinner />;
  if (!data) return <ErrorBox message={error ?? 'Rapor tidak ditemukan'} />;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <Link href={back} className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <ArrowLeft className="size-4" /> Semua rapor
        </Link>
        <a href={`/rapor/${id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-400">
          <Printer className="size-4" /> Cetak / Unduh PDF
        </a>
      </div>
      <ReportView r={data} />
    </div>
  );
}
