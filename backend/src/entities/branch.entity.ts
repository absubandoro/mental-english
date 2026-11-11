import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Organization } from './organization.entity';

@Entity('branches')
@Index('UQ_branch_org_slug', ['organizationId', 'slug'], { unique: true })
export class Branch {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  @Column() slug: string;
  @Column({ type: 'uuid' }) organizationId: string;
  @ManyToOne(() => Organization, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'organizationId' }) organization: Organization;
  @Column({ type: 'text', nullable: true }) address: string | null;
  @Column({ type: 'varchar', nullable: true }) city: string | null;
  @Column({ type: 'varchar', nullable: true }) phone: string | null;
  @Column({ type: 'varchar', nullable: true }) openHours: string | null;
  /** Teks/alamat untuk Google Maps embed, atau URL embed lengkap */
  @Column({ type: 'text', nullable: true }) mapQuery: string | null;

  // ---- Tagihan bulanan otomatis ----
  @Column({ default: false }) billingEnabled: boolean;
  /** Tanggal tagihan dibuat setiap bulan (1–28) */
  @Column({ type: 'smallint', default: 1 }) billingDay: number;
  /** Nominal SPP bawaan cabang (bisa ditimpa per pelajar) */
  @Column({ type: 'integer', default: 0 }) billingAmount: number;
  @Column({ type: 'varchar', default: 'SPP Bulanan' }) billingDescription: string;
  /** Jatuh tempo = tanggal tagihan + N hari */
  @Column({ type: 'smallint', default: 10 }) billingDueDays: number;
  @Column({ type: 'jsonb', default: () => "'[]'" }) bankAccounts: { bank: string; number: string; holder: string }[];
  @Column({ type: 'text', nullable: true }) paymentInstructions: string | null;
  @CreateDateColumn() createdAt: Date;
}
