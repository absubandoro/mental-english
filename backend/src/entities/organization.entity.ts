import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Foto latar landing page (URL gambar) */
export interface OrganizationPhotos {
  welcome?: string | null;
  holiday?: string | null;
  team?: string | null;
}

/**
 * Lembaga / klien (tenant). Hierarki teratas: Organisasi → Cabang → User, kelas, tagihan, dst.
 * Organisasi dikenali dari domain yang dibuka: <slug>.PLATFORM_DOMAIN atau domain kustom (organization_domains).
 */
@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid') id: string;
  /** Dipakai untuk subdomain: <slug>.PLATFORM_DOMAIN */
  @Column({ unique: true }) slug: string;
  @Column() name: string;
  @Column({ type: 'varchar', nullable: true }) tagline: string | null;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ type: 'varchar', nullable: true }) logoUrl: string | null;
  /** Warna utama (hex), mis. #3d8ccf */
  @Column({ type: 'varchar', default: '#3d8ccf' }) brandColor: string;
  @Column({ type: 'jsonb', default: () => "'{}'" }) photos: OrganizationPhotos;
  @Column({ type: 'varchar', nullable: true }) whatsapp: string | null;
  @Column({ type: 'varchar', nullable: true }) email: string | null;
  @Column({ type: 'varchar', nullable: true }) instagram: string | null;
  @Column({ type: 'varchar', nullable: true }) website: string | null;
  /** Catatan internal pengelola platform (tidak tampil ke lembaga) */
  @Column({ type: 'text', nullable: true, select: false }) notes: string | null;
  // ---- Langganan Nofosys (tagihan sistem ke lembaga) ----
  @Column({ default: false }) subscriptionEnabled: boolean;
  /** Siklus tagihan: MONTHLY (bulanan) atau YEARLY (tahunan) */
  @Column({ type: 'varchar', length: 10, default: 'MONTHLY' }) billingCycle: 'MONTHLY' | 'YEARLY';
  @Column({ type: 'varchar', nullable: true }) planName: string | null;
  /** Biaya tetap per siklus — per bulan / per tahun (Rp) */
  @Column({ type: 'integer', default: 0 }) baseFee: number;
  /** Biaya per pelajar aktif per siklus (Rp) */
  @Column({ type: 'integer', default: 0 }) perStudentFee: number;
  /** Tanggal jatuh tempo (1–28) */
  @Column({ type: 'smallint', default: 10 }) dueDay: number;
  /** Bulan jatuh tempo untuk siklus tahunan (1–12) */
  @Column({ type: 'smallint', default: 1 }) dueMonth: number;
  /** Tagihan terbit N hari sebelum jatuh tempo */
  @Column({ type: 'smallint', default: 7 }) invoiceLeadDays: number;
  /** Periode pertama yang ditagih (YYYY-MM) */
  @Column({ type: 'varchar', length: 7, nullable: true }) subscriptionStart: string | null;

  /** Nonaktif = website & login ditutup (mis. langganan berakhir) */
  @Column({ default: true }) isActive: boolean;
  @OneToMany(() => OrganizationDomain, (d) => d.organization) domains: OrganizationDomain[];
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}

/** Domain kustom milik organisasi, mis. belajar.bimbelkamu.com */
@Entity('organization_domains')
export class OrganizationDomain {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true }) domain: string;
  @Column({ type: 'uuid' }) organizationId: string;
  @ManyToOne(() => Organization, (o) => o.domains, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'organizationId' }) organization: Organization;
  @CreateDateColumn() createdAt: Date;
}
