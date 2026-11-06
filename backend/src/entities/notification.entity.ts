import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique,
} from 'typeorm';
import { Branch } from './branch.entity';
import { NotificationTarget } from './enums';
import { User } from './user.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() title: string;
  @Column({ type: 'text' }) body: string;
  @Column({ type: 'enum', enum: NotificationTarget }) target: NotificationTarget;
  @Column({ type: 'uuid', nullable: true }) branchId: string | null;
  @ManyToOne(() => Branch, { nullable: true, onDelete: 'CASCADE' }) @JoinColumn({ name: 'branchId' }) branch: Branch | null;
  @Column({ type: 'uuid', nullable: true }) createdById: string | null;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'createdById' }) createdBy: User | null;
  @OneToMany(() => NotificationRecipient, (r) => r.notification) recipients: NotificationRecipient[];
  @CreateDateColumn() createdAt: Date;
}

@Entity('notification_recipients')
@Unique(['notificationId', 'userId'])
export class NotificationRecipient {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'uuid' }) notificationId: string;
  @ManyToOne(() => Notification, (n) => n.recipients, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'notificationId' })
  notification: Notification;
  @Column({ type: 'uuid' }) userId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'userId' }) user: User;
  @Column({ type: 'timestamptz', nullable: true }) readAt: Date | null;
  @CreateDateColumn() createdAt: Date;
}
