import {
  Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { Branch } from './branch.entity';
import { PostType } from './enums';
import { User } from './user.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ type: 'enum', enum: PostType, default: PostType.BLOG }) type: PostType;
  @Index() @Column() title: string;
  @Column({ unique: true }) slug: string;
  @Column({ type: 'text', nullable: true }) excerpt: string | null;
  @Column({ type: 'text' }) content: string;
  @Column({ type: 'varchar', nullable: true }) coverUrl: string | null;
  @Column({ type: 'varchar', nullable: true }) videoUrl: string | null;
  @Column({ default: true }) published: boolean;

  @Column({ type: 'uuid' }) branchId: string;
  @ManyToOne(() => Branch, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'branchId' }) branch: Branch;
  @Column({ type: 'uuid' }) authorId: string;
  @ManyToOne(() => User, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'authorId' }) author: User;

  @CreateDateColumn() createdAt: Date;
  @UpdateDateColumn() updatedAt: Date;
}
