import type { BadgeTone } from '@/components/ui';
import type { AttendanceStatus, CalendarEventType, EnrollmentStatus, PaymentStatus, SessionType } from './types';

export const ATT_TONE: Record<AttendanceStatus, BadgeTone> = { HADIR: 'green', IZIN: 'blue', SAKIT: 'amber', ALPA: 'red' };
export const PAY_TONE: Record<PaymentStatus, BadgeTone> = { LUNAS: 'green', MENUNGGU: 'amber', BELUM_BAYAR: 'red' };
export const SESSION_TONE: Record<SessionType, BadgeTone> = { BELAJAR: 'blue', UJIAN: 'amber', OUTDOOR: 'green' };
export const EVENT_TONE: Record<CalendarEventType, BadgeTone> = { LIBUR: 'red', ACARA: 'blue', UJIAN: 'amber', LAINNYA: 'slate' };
export const ENROLL_TONE: Record<EnrollmentStatus, BadgeTone> = { BARU: 'blue', DIHUBUNGI: 'amber', DITERIMA: 'green', DITOLAK: 'slate' };
