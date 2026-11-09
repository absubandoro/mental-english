import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, Unique, UpdateDateColumn,
} from 'typeorm';
import { ClassRoom } from './class-room.entity';
import { AttendanceStatus, MediaItem, SessionType } from './enums';
import { User } from './user.entity';

/** "Kelas Hari Ini" — satu pertemuan kelas */
@Entity('class_sessions')
export class ClassSession {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'date' }) date: string;
  @Column({ type: 'enum', enum: SessionType, default: SessionType.BELAJAR }) type: SessionType;
  @Column() topic: string;
  @Column({ type: 'text', nullable: true }) report: string | null;
  /** Foto / video kegiatan kelas untuk orang tua */
  @Column({ type: 'jsonb', default: () => "'[]'" }) media: MediaItem[];

  @Column({ type: 'uuid' }) classId: string;
  @ManyToOne(() => ClassRoom, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'classId' }) classRoom: ClassRoom;
  @Column({ type: 'uuid' }) teacherId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'teacherId' }) teacher: User;

  @OneToMany(() => Attendance, (a) => a.session, { cascade: true }) attendances: Attendance[];
  @OneToMany(() => ExamResult, (e) => e.session, { cascade: true }) examResults: ExamResult[];

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

@Entity('attendances')
@Unique(['sessionId', 'studentId'])
export class Attendance {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'enum', enum: AttendanceStatus, default: AttendanceStatus.HADIR }) status: AttendanceStatus;
  @Column({ type: 'text', nullable: true }) note: string | null;
  @Column({ type: 'uuid' }) sessionId: string;
  @ManyToOne(() => ClassSession, (s) => s.attendances, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: ClassSession;
  @Column({ type: 'uuid' }) studentId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'studentId' }) student: User;
}

@Entity('exam_results')
@Unique(['sessionId', 'studentId'])
export class ExamResult {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'numeric', precision: 5, scale: 2, nullable: true, transformer: { to: (v) => v, from: (v) => (v == null ? null : Number(v)) } })
  score: number | null;
  @Column({ type: 'varchar', nullable: true }) grade: string | null;
  @Column({ type: 'text', nullable: true }) note: string | null;
  @Column({ type: 'uuid' }) sessionId: string;
  @ManyToOne(() => ClassSession, (s) => s.examResults, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'sessionId' })
  session: ClassSession;
  @Column({ type: 'uuid' }) studentId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'studentId' }) student: User;
}
