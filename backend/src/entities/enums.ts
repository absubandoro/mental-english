export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
  /** Bagian keuangan cabang: kelola & verifikasi pembayaran */
  FINANCE = 'FINANCE',
}

export enum PostType {
  BLOG = 'BLOG',
  VLOG = 'VLOG',
}

export enum SessionType {
  BELAJAR = 'BELAJAR',
  UJIAN = 'UJIAN',
  OUTDOOR = 'OUTDOOR',
}

export enum AttendanceStatus {
  HADIR = 'HADIR',
  IZIN = 'IZIN',
  SAKIT = 'SAKIT',
  ALPA = 'ALPA',
}

export enum PaymentStatus {
  BELUM_BAYAR = 'BELUM_BAYAR',
  MENUNGGU = 'MENUNGGU',
  LUNAS = 'LUNAS',
}

export enum PaymentSource {
  MANUAL = 'MANUAL',
  /** Dibuat otomatis oleh tagihan bulanan */
  AUTO = 'AUTO',
}

export enum CalendarEventType {
  LIBUR = 'LIBUR',
  ACARA = 'ACARA',
  UJIAN = 'UJIAN',
  LAINNYA = 'LAINNYA',
}

export enum ReportStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
}

export enum EnrollmentStatus {
  BARU = 'BARU',
  DIHUBUNGI = 'DIHUBUNGI',
  DITERIMA = 'DITERIMA',
  DITOLAK = 'DITOLAK',
}

/** Lampiran foto / video */
export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  name?: string;
}

export enum NotificationTarget {
  BRANCH_PARENTS = 'BRANCH_PARENTS',
  CLASS_PARENTS = 'CLASS_PARENTS',
  USERS = 'USERS',
}
