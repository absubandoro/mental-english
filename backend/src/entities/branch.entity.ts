import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  @Column({ unique: true }) slug: string;
  @Column({ type: 'text', nullable: true }) address: string | null;
  @Column({ type: 'varchar', nullable: true }) city: string | null;
  @Column({ type: 'varchar', nullable: true }) phone: string | null;
  @Column({ type: 'varchar', nullable: true }) openHours: string | null;
  /** Teks/alamat untuk Google Maps embed, atau URL embed lengkap */
  @Column({ type: 'text', nullable: true }) mapQuery: string | null;
  @CreateDateColumn() createdAt: Date;
}
