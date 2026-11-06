import {
  Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { Branch } from './branch.entity';
import { User } from './user.entity';

/** Mading (majalah dinding) — karya pelajar */
@Entity('mading')
export class Mading {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Index() @Column() title: string;
  @Column({ type: 'text' }) content: string;
  @Column({ type: 'varchar', nullable: true }) imageUrl: string | null;
  @Column({ type: 'varchar', default: 'Karya' }) category: string;
  @Column({ default: true }) published: boolean;

  @Column({ type: 'uuid' }) branchId: string;
  @ManyToOne(() => Branch, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'branchId' }) branch: Branch;
  @Column({ type: 'uuid' }) authorId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'authorId' }) author: User;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
