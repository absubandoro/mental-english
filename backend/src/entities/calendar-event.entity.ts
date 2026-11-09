import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Branch } from './branch.entity';
import { ClassRoom } from './class-room.entity';
import { CalendarEventType } from './enums';
import { User } from './user.entity';

/** Agenda kalender cabang (libur, acara, ujian, dll). classId kosong = berlaku untuk seluruh cabang. */
@Entity('calendar_events')
export class CalendarEvent {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() title: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ type: 'enum', enum: CalendarEventType, default: CalendarEventType.ACARA }) type: CalendarEventType;
  @Column({ type: 'date' }) startDate: string;
  @Column({ type: 'date' }) endDate: string;
  @Column({ type: 'varchar', length: 5, nullable: true }) startTime: string | null;
  @Column({ type: 'varchar', length: 5, nullable: true }) endTime: string | null;

  @Column({ type: 'uuid' }) branchId: string;
  @ManyToOne(() => Branch, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'branchId' }) branch: Branch;
  @Column({ type: 'uuid', nullable: true }) classId: string | null;
  @ManyToOne(() => ClassRoom, { nullable: true, onDelete: 'CASCADE' }) @JoinColumn({ name: 'classId' }) classRoom: ClassRoom | null;
  @Column({ type: 'uuid', nullable: true }) createdById: string | null;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'createdById' }) createdBy: User | null;
  @CreateDateColumn() createdAt: Date;
}
