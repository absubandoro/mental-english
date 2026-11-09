import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Branch } from './branch.entity';
import { EnrollmentStatus } from './enums';
import { User } from './user.entity';

/** Pendaftaran siswa baru dari halaman publik — ditinjau admin cabang */
@Entity('enrollments')
export class Enrollment {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() studentName: string;
  @Column({ type: 'date', nullable: true }) studentBirthDate: string | null;
  @Column({ type: 'varchar', nullable: true }) studentSchool: string | null;
  @Column({ type: 'varchar', nullable: true }) program: string | null;
  @Column({ type: 'varchar', nullable: true }) studentEmail: string | null;
  @Column() parentName: string;
  @Column() parentPhone: string;
  @Column() parentEmail: string;
  /** Password pilihan pendaftar (sudah di-hash), dipakai saat akun dibuat */
  @Column({ select: false }) passwordHash: string;
  @Column({ type: 'text', nullable: true }) notes: string | null;
  @Column({ type: 'enum', enum: EnrollmentStatus, default: EnrollmentStatus.BARU }) status: EnrollmentStatus;
  @Column({ type: 'text', nullable: true }) adminNote: string | null;

  @Column({ type: 'uuid' }) branchId: string;
  @ManyToOne(() => Branch, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'branchId' }) branch: Branch;
  @Column({ type: 'uuid', nullable: true }) studentId: string | null;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'studentId' }) student: User | null;
  @Column({ type: 'uuid', nullable: true }) parentId: string | null;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'parentId' }) parent: User | null;
  @Column({ type: 'uuid', nullable: true }) handledById: string | null;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
