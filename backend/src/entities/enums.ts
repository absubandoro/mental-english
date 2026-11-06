export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
  PARENT = 'PARENT',
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

export enum NotificationTarget {
  BRANCH_PARENTS = 'BRANCH_PARENTS',
  CLASS_PARENTS = 'CLASS_PARENTS',
  USERS = 'USERS',
}
