import {
  Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { Branch } from './branch.entity';
import { User } from './user.entity';

@Entity('classes')
export class ClassRoom {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  @Column({ type: 'varchar', nullable: true }) schedule: string | null;
  @Column({ type: 'varchar', nullable: true }) level: string | null;

  @Column({ type: 'uuid' }) branchId: string;
  @ManyToOne(() => Branch, { onDelete: 'CASCADE' }) @JoinColumn({ name: 'branchId' }) branch: Branch;

  @ManyToMany(() => User)
  @JoinTable({ name: 'class_students', joinColumn: { name: 'classId' }, inverseJoinColumn: { name: 'studentId' } })
  students: User[];

  @ManyToMany(() => User)
  @JoinTable({ name: 'class_teachers', joinColumn: { name: 'classId' }, inverseJoinColumn: { name: 'teacherId' } })
  teachers: User[];

  @CreateDateColumn() createdAt: Date;
}
