import {
  Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { Branch } from './branch.entity';
import { PaymentSource, PaymentStatus } from './enums';
import { User } from './user.entity';

@Entity('payments')
/** Satu tagihan otomatis per pelajar per periode */
@Index('UQ_payment_auto_period', ['studentId', 'period'], { unique: true, where: `"source" = 'AUTO'` })
export class Payment {
  @PrimaryGeneratedColumn('uuid') id: string;
  /** Periode tagihan, format YYYY-MM */
  @Column() period: string;
  @Column() description: string;
  @Column({ type: 'integer' }) amount: number;
  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.BELUM_BAYAR }) status: PaymentStatus;
  @Column({ type: 'date', nullable: true }) dueDate: string | null;
  @Column({ type: 'timestamptz', nullable: true }) paidAt: Date | null;
  @Column({ type: 'varchar', nullable: true }) method: string | null;
  @Column({ type: 'text', nullable: true }) note: string | null;
  @Column({ type: 'enum', enum: PaymentSource, default: PaymentSource.MANUAL }) source: PaymentSource;

  // ---- Bukti pembayaran dari orang tua ----
  @Column({ type: 'varchar', nullable: true }) proofUrl: string | null;
  @Column({ type: 'text', nullable: true }) proofNote: string | null;
  @Column({ type: 'timestamptz', nullable: true }) proofUploadedAt: Date | null;
  @Column({ type: 'text', nullable: true }) rejectionReason: string | null;
  @Column({ type: 'uuid', nullable: true }) verifiedById: string | null;
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' }) @JoinColumn({ name: 'verifiedById' }) verifiedBy: User | null;
  @Column({ type: 'timestamptz', nullable: true }) verifiedAt: Date | null;

  // ---- Pengingat otomatis ----
  @Column({ default: false }) remindedDueSoon: boolean;
  @Column({ default: false }) remindedOverdue: boolean;

  @Column({ type: 'uuid' }) studentId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'studentId' }) student: User;
  @Column({ type: 'uuid' }) branchId: string;
  @ManyToOne(() => Branch, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'branchId' }) branch: Branch;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
