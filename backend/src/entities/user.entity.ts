import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { Branch } from './branch.entity';
import { Role } from './enums';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  @Column({ unique: true }) email: string;
  @Column({ select: false }) password: string;
  @Column({ type: 'enum', enum: Role }) role: Role;
  @Column({ type: 'varchar', nullable: true }) phone: string | null;
  @Column({ type: 'text', nullable: true }) address: string | null;
  @Column({ type: 'date', nullable: true }) birthDate: string | null;
  @Column({ type: 'varchar', nullable: true }) school: string | null;
  @Column({ type: 'varchar', nullable: true }) level: string | null;
  @Column({ type: 'varchar', nullable: true }) avatarUrl: string | null;
  @Column({ type: 'text', nullable: true }) bio: string | null;
  @Column({ default: true }) isActive: boolean;

  @Column({ type: 'uuid', nullable: true }) branchId: string | null;
  @ManyToOne(() => Branch, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'branchId' })
  branch: Branch | null;

  /** Untuk pelajar: akun orang tua */
  @Column({ type: 'uuid', nullable: true }) parentId: string | null;
  @ManyToOne(() => User, (u) => u.children, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'parentId' })
  parent: User | null;
  @OneToMany(() => User, (u) => u.parent) children: User[];

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
