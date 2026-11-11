import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

/** Pengelola platform Nofosys (pemilik produk). Terpisah dari akun lembaga. */
@Entity('platform_admins')
export class PlatformAdmin {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  @Column({ unique: true }) email: string;
  @Column({ select: false }) password: string;
  @Column({ default: true }) isActive: boolean;
  @Column({ type: 'timestamptz', nullable: true }) lastLoginAt: Date | null;
  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
