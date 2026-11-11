import { Branch } from './branch.entity';
import { CalendarEvent } from './calendar-event.entity';
import { ClassRoom, ClassSchedule } from './class-room.entity';
import { Attendance, ClassSession, ExamResult } from './class-session.entity';
import { Enrollment } from './enrollment.entity';
import { Mading } from './mading.entity';
import { Organization, OrganizationDomain } from './organization.entity';
import { PlatformAdmin } from './platform-admin.entity';
import { LeadStatus, PlatformLead } from './platform-lead.entity';
import { Notification, NotificationRecipient } from './notification.entity';
import { Payment } from './payment.entity';
import { Post } from './post.entity';
import { ProgressReport } from './progress-report.entity';
import { User } from './user.entity';

export * from './enums';
export type { OrganizationPhotos } from './organization.entity';
export type { AttendanceSummary, ExamSummary, SkillScore } from './progress-report.entity';
export {
  Organization, OrganizationDomain, PlatformAdmin, PlatformLead, LeadStatus, Branch, CalendarEvent, ClassRoom, ClassSchedule, Attendance, ClassSession, Enrollment, ExamResult, Mading, Notification, NotificationRecipient,
  Payment, Post, ProgressReport, User,
};

export const ENTITIES = [
  Organization, OrganizationDomain, PlatformAdmin, PlatformLead, Branch, User, Post, Mading, ClassRoom, ClassSchedule, ClassSession, Attendance, ExamResult, Payment, Notification, NotificationRecipient,
  CalendarEvent, ProgressReport, Enrollment,
];
