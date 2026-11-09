export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT' | 'FINANCE';
export type PostType = 'BLOG' | 'VLOG';
export type SessionType = 'BELAJAR' | 'UJIAN' | 'OUTDOOR';
export type AttendanceStatus = 'HADIR' | 'IZIN' | 'SAKIT' | 'ALPA';
export type PaymentStatus = 'BELUM_BAYAR' | 'MENUNGGU' | 'LUNAS';
export type NotificationTarget = 'BRANCH_PARENTS' | 'CLASS_PARENTS' | 'USERS';
export type CalendarEventType = 'LIBUR' | 'ACARA' | 'UJIAN' | 'LAINNYA';
export type ReportStatus = 'DRAFT' | 'PUBLISHED';
export type EnrollmentStatus = 'BARU' | 'DIHUBUNGI' | 'DITERIMA' | 'DITOLAK';

export interface MediaItem {
  url: string;
  type: 'image' | 'video';
  name?: string;
}

export interface BankAccount {
  bank: string;
  number: string;
  holder: string;
}

export interface Branch {
  id: string;
  name: string;
  slug: string;
  address: string | null;
  city: string | null;
  phone: string | null;
  openHours: string | null;
  mapQuery: string | null;
  billingEnabled?: boolean;
  billingDay?: number;
  billingAmount?: number;
  billingDescription?: string;
  billingDueDays?: number;
  bankAccounts?: BankAccount[];
  paymentInstructions?: string | null;
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
  monthlyFee?: number | null;
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
  media: MediaItem[];
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
  media: MediaItem[];
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
  schedules?: ClassSchedule[];
  students: UserLite[];
  teachers: UserLite[];
  assignedToMe?: boolean;
}

export interface ClassSchedule {
  id?: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
}

export interface ClassSessionSummary {
  id: string;
  date: string;
  type: SessionType;
  topic: string;
  report: string | null;
  media?: MediaItem[];
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
  branchId?: string;
  student?: UserLite & { parent?: UserLite | null };
  source?: 'AUTO' | 'MANUAL';
  proofUrl?: string | null;
  proofNote?: string | null;
  proofUploadedAt?: string | null;
  rejectionReason?: string | null;
  verifiedAt?: string | null;
  verifiedBy?: { id: string; name: string } | null;
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  type: CalendarEventType;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  classId: string | null;
  classRoom?: { id: string; name: string } | null;
  branchId: string;
  branch?: { id: string; name: string };
}

export interface ClassOccurrence {
  date: string;
  classId: string;
  className: string;
  branchId: string;
  startTime: string | null;
  endTime: string | null;
  room: string | null;
  teachers: string[];
  holiday: boolean;
  holidayTitle: string | null;
  extra?: boolean;
  session: { id: string; type: SessionType; topic: string } | null;
}

export interface CalendarData {
  from: string;
  to: string;
  events: CalendarEvent[];
  occurrences: ClassOccurrence[];
}

export interface SkillScore {
  key: string;
  label: string;
  score: number | null;
  note?: string | null;
}

export interface ProgressReport {
  id: string;
  title: string;
  periodStart: string;
  periodEnd: string;
  skills: SkillScore[];
  overallGrade: string | null;
  overallScore: number | null;
  suggestedGrade: string | null;
  teacherComment: string | null;
  recommendation: string | null;
  attendanceSummary: { total: number; HADIR: number; IZIN: number; SAKIT: number; ALPA: number; ratio: number | null } | null;
  examSummary: { count: number; average: number | null; items: { date: string; topic: string; score: number | null; grade: string | null }[] } | null;
  media: MediaItem[];
  status: ReportStatus;
  publishedAt: string | null;
  studentId: string;
  classId: string | null;
  student?: { id: string; name: string; avatarUrl: string | null; birthDate?: string | null; school?: string | null; level?: string | null };
  classRoom?: { id: string; name: string; level?: string | null } | null;
  author?: { id: string; name: string } | null;
  branch?: { id: string; name: string; address: string | null };
  canEdit?: boolean;
  updatedAt: string;
}

export interface Enrollment {
  id: string;
  studentName: string;
  studentBirthDate: string | null;
  studentSchool: string | null;
  program: string | null;
  studentEmail: string | null;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  notes: string | null;
  status: EnrollmentStatus;
  adminNote: string | null;
  branchId: string;
  branch?: Branch;
  studentId: string | null;
  createdAt: string;
}

export interface Paged<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
