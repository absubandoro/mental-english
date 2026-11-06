import { Branch } from './branch.entity';
import { ClassRoom } from './class-room.entity';
import { Attendance, ClassSession, ExamResult } from './class-session.entity';
import { Mading } from './mading.entity';
import { Notification, NotificationRecipient } from './notification.entity';
import { Payment } from './payment.entity';
import { Post } from './post.entity';
import { User } from './user.entity';

export * from './enums';
export {
  Branch, ClassRoom, Attendance, ClassSession, ExamResult, Mading, Notification, NotificationRecipient, Payment, Post, User,
};

export const ENTITIES = [
  Branch, User, Post, Mading, ClassRoom, ClassSession, Attendance, ExamResult, Payment, Notification, NotificationRecipient,
];
