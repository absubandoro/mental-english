export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';
export type PostType = 'BLOG' | 'VLOG';
export type SessionType = 'BELAJAR' | 'UJIAN' | 'OUTDOOR';
export type AttendanceStatus = 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA';
export type PaymentStatus = 'BELUM_BAYAR' | 'MENUNGGU' | 'LUNAS';
export type NotificationTarget = 'BRANCH_PARENTS' | 'CLASS_PARENTS' | 'USERS';

export interface Branch {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  openHours: string | null;
  mapQuery: string | null;
}

export interface UserLite {
  id: string;
  name: string;
  avatarUrl?: string | null;
  email?: string;
  phone?: string | null;
  level?: string | null;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  phone: string | null;
  address: string | null;
  birthDate: string | null;
  school: string | null;
  level: string | null;
  avatarUrl: string | null;
  bio: string | null;
  isActive: boolean;
  branchId: string | null;
  branch?: Branch | null;
  parentId: string | null;
  parent?: UserLite | null;
  children?: UserLite[];
  classes?: { id: string; name: string; schedule: string | null; level?: string | null; teachers: string[] }[];
  createdAt: string;
}

export interface Post {
  id: string;
  type: PostType;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  coverUrl: string | null;
  videoUrl: string | null;
  published: boolean;
  branchId: string;
  branch?: Branch;
  author?: UserLite;
  createdAt: string;
}

export interface Mading {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  category: string;
  published: boolean;
  branchId: string;
  branch?: Branch;
  author?: UserLite;
  createdAt: string;
}

export interface ClassRoom {
  id: string;
  name: string;
  description: string | null;
  schedule: string | null;
  level: string | null;
  branchId: string;
  branch?: Branch;
  students: UserLite[];
  teachers: UserLite[];
  assignedToMe?: boolean;
}

export interface ClassSessionSummary {
  id: string;
  date: string;
  type: SessionType;
  topic: string;
  report: string | null;
  classId: string;
  classRoom: { id: string; name: string };
  teacher: { id: string; name: string };
  presentCount?: number;
  attendanceCount?: number;
}

export interface ClassSessionDetail extends Omit<ClassSessionSummary, 'presentCount' | 'attendanceCount'> {
  students: {
    id: string;
    name: string;
    avatarUrl: string | null;
    attendance: { status: AttendanceStatus; note: string | null } | null;
    exam: { score: number | null; grade: string | null; note: string | null } | null;
  }[];
}

export interface Payment {
  id: string;
  period: string;
  description: string;
  amount: number;
  status: PaymentStatus;
  dueDate: string | null;
  paidAt: string | null;
  method: string | null;
  note: string | null;
  studentId: string;
  student?: UserLite & { parent?: UserLite | null };
}

export interface Paged<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
