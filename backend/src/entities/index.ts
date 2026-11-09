import { Branch } from './branch.entity';
import { CalendarEvent } from './calendar-event.entity';
import { ClassRoom, ClassSchedule } from './class-room.entity';
import { Attendance, ClassSession, ExamResult } from './class-session.entity';
import { Enrollment } from './enrollment.entity';
import { Mading } from './mading.entity';
import { Notification, NotificationRecipient } from './notification.entity';
import { Payment } from './payment.entity';
import { Post } from './post.entity';
import { ProgressReport } from './progress-report.entity';
import { User } from './user.entity';

export * from './enums';
export type { AttendanceSummary, ExamSummary, SkillScore } from './progress-report.entity';
export {
  Branch, CalendarEvent, ClassRoom, ClassSchedule, Attendance, ClassSession, Enrollment, ExamResult, Mading, Notification, NotificationRecipient,
  Payment, Post, ProgressReport, User,
};

export const ENTITIES = [
  Branch, User, Post, Mading, ClassRoom, ClassSchedule, ClassSession, Attendance, ExamResult, Payment, Notification, NotificationRecipient,
  CalendarEvent, ProgressReport, Enrollment,
];
