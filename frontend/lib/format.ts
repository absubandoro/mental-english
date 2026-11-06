import type { AttendanceStatus, PaymentStatus, Role, SessionType } from './types';

export const ROLE_LABEL: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin Cabang',
  TEACHER: 'Pengajar',
  STUDENT: 'Pelajar',
  PARENT: 'Orang Tua',
};

export const ROLE_HOME: Record<Role, string> = {
  SUPER_ADMIN: '/admin',
  ADMIN: '/admin',
  TEACHER: '/pengajar',
  STUDENT: '/pelajar',
  PARENT: '/orang-tua',
};

export const SESSION_TYPE_LABEL: Record<SessionType, string> = {
  BELAJAR: 'Belajar',
  UJIAN: 'Ujian',
  OUTDOOR: 'Outdoor',
};

export const ATTENDANCE_LABEL: Record<AttendanceStatus, string> = {
  HADIR: 'Hadir',
  IZIN: 'Izin',
  SAKIT: 'Sakit',
  ALPA: 'Alpa',
};

export const PAYMENT_LABEL: Record<PaymentStatus, string> = {
  BELUM_BAYAR: 'Belum Bayar',
  MENUNGGU: 'Menunggu Verifikasi',
  LUNAS: 'Lunas',
};

export function formatDate(d: string | Date | null | undefined, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' }) {
  if (!d) return '-';
  const date = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d) ? new Date(d + 'T00:00:00') : new Date(d);
  return date.toLocaleDateString('id-ID', opts);
}

export function formatPeriod(p: string) {
  const [y, m] = p.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
}

export function rupiah(n: number) {
  return 'Rp ' + (n || 0).toLocaleString('id-ID');
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
}

export function youtubeId(url: string | null | undefined) {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export function mapsEmbed(q: string | null | undefined) {
  if (!q) return null;
  if (/^https?:\/\//.test(q)) return q;
  return `https://www.google.com/maps?q=${encodeURIComponent(q)}&output=embed`;
}

export function today() {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}
