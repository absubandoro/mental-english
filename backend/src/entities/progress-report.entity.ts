import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Branch } from './branch.entity';
import { ClassRoom } from './class-room.entity';
import { MediaItem, ReportStatus } from './enums';
import { User } from './user.entity';

export interface SkillScore {
  key: string;
  label: string;
  score: number | null;
  note?: string | null;
}

export interface AttendanceSummary {
  total: number;
  HADIR: number;
  IZIN: number;
  SAKIT: number;
  ALPA: number;
  ratio: number | null;
}

export interface ExamSummary {
  count: number;
  average: number | null;
  items: { date: string; topic: string; score: number | null; grade: string | null }[];
}

/** Rapor perkembangan pelajar per periode */
@Entity('progress_reports')
export class ProgressReport {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() title: string;
  @Column({ type: 'date' }) periodStart: string;
  @Column({ type: 'date' }) periodEnd: string;
  @Column({ type: 'jsonb', default: () => "'[]'" }) skills: SkillScore[];
  @Column({ type: 'varchar', nullable: true }) overallGrade: string | null;
  @Column({ type: 'text', nullable: true }) teacherComment: string | null;
  @Column({ type: 'text', nullable: true }) recommendation: string | null;
  @Column({ type: 'jsonb', nullable: true }) attendanceSummary: AttendanceSummary | null;
  @Column({ type: 'jsonb', nullable: true }) examSummary: ExamSummary | null;
  @Column({ type: 'jsonb', default: () => "'[]'" }) media: MediaItem[];
  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.DRAFT }) status: ReportStatus;
  @Column({ type: 'timestamptz', nullable: true }) publishedAt: Date | null;

  @Column({ type: 'uuid' }) studentId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'studentId' }) student: User;
  @Column({ type: 'uuid', nullable: true }) classId: string | null;
  @ManyToOne(() => ClassRoom, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'classId' }) classRoom: ClassRoom | null;
  @Column({ type: 'uuid' }) branchId: string;
  @ManyToOne(() => Branch, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'branchId' }) branch: Branch;
  @Column({ type: 'uuid', nullable: true }) authorId: string | null;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'authorId' }) author: User | null;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
