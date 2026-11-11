import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryColumn, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { Organization } from './organization.entity';

export enum InvoiceStatus {
  BELUM_BAYAR = 'BELUM_BAYAR',
  /** Bukti transfer diunggah klien, menunggu verifikasi pengelola */
  MENUNGGU = 'MENUNGGU',
  LUNAS = 'LUNAS',
  BATAL = 'BATAL',
}

export interface InvoiceItem {
  description: string;
  qty: number;
  unitPrice: number;
  amount: number;
}

/** Tagihan langganan sistem dari Nofosys ke lembaga (klien) */
@Entity('platform_invoices')
@Index('UQ_invoice_org_period', ['organizationId', 'period'], { unique: true })
export class PlatformInvoice {
  @PrimaryGeneratedColumn('uuid') id: string;
  /** Nomor tagihan, mis. NFS-202612-0001 */
  @Column({ unique: true }) number: string;
  @Column({ type: 'uuid' }) organizationId: string;
  @ManyToOne(() => Organization, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'organizationId' }) organization: Organization;
  /** Periode langganan YYYY-MM */
  @Column({ type: 'varchar', length: 7 }) period: string;
  @Column({ type: 'date' }) issueDate: string;
  @Column({ type: 'date' }) dueDate: string;
  @Column({ type: 'jsonb', default: () => "'[]'" }) items: InvoiceItem[];
  @Column({ type: 'integer' }) amount: number;
  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.BELUM_BAYAR }) status: InvoiceStatus;
  @Column({ type: 'varchar', nullable: true }) proofUrl: string | null;
  @Column({ type: 'text', nullable: true }) proofNote: string | null;
  @Column({ type: 'timestamptz', nullable: true }) proofUploadedAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) paidAt: Date | null;
  @Column({ type: 'uuid', nullable: true }) verifiedById: string | null;
  @Column({ type: 'text', nullable: true }) rejectReason: string | null;
  /** Catatan dari pengelola (tampil ke klien) */
  @Column({ type: 'text', nullable: true }) note: string | null;
  @Column({ type: 'timestamptz', nullable: true }) remindedDueSoonAt: Date | null;
  @Column({ type: 'timestamptz', nullable: true }) remindedOverdueAt: Date | null;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

/** Pengaturan platform (key-value), mis. rekening pembayaran tagihan langganan */
@Entity('platform_settings')
export class PlatformSetting {
  @PrimaryColumn() key: string;
  @Column({ type: 'jsonb' }) value: unknown;
  @UpdateDateColumn() updatedAt: Date;
}
