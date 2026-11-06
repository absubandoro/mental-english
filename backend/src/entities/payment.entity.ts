import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { Branch } from './branch.entity';
import { PaymentStatus } from './enums';
import { User } from './user.entity';

@Entity('payments')
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

  @Column({ type: 'uuid' }) studentId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'studentId' }) student: User;
  @Column({ type: 'uuid' }) branchId: string;
  @ManyToOne(() => Branch, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'branchId' }) branch: Branch;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
