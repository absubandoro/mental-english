import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

export enum LeadStatus {
  BARU = 'BARU',
  DIHUBUNGI = 'DIHUBUNGI',
  JADI_KLIEN = 'JADI_KLIEN',
  TIDAK_LANJUT = 'TIDAK_LANJUT',
}

/** Permintaan demo dari website Nofosys (calon klien) */
@Entity('platform_leads')
export class PlatformLead {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  @Column() institution: string;
  @Column() phone: string;
  @Column({ type: 'varchar', nullable: true }) email: string | null;
  @Column({ type: 'varchar', nullable: true }) city: string | null;
  /** Perkiraan jumlah siswa, mis. "50–150" */
  @Column({ type: 'varchar', nullable: true }) size: string | null;
  @Column({ type: 'text', nullable: true }) message: string | null;
  @Column({ type: 'enum', enum: LeadStatus, default: LeadStatus.BARU }) status: LeadStatus;
  /** Catatan internal pengelola */
  @Column({ type: 'text', nullable: true }) note: string | null;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
