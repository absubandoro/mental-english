import {
  Column, CreateDateColumn, Entity, JoinColumn, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm';
import { Branch } from './branch.entity';
import { User } from './user.entity';

@Entity('classes')
export class ClassRoom {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column() name: string;
  @Column({ type: 'text', nullable: true }) description: string | null;
  /** Ringkasan jadwal (dibuat otomatis dari slot jadwal) */
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

  @OneToMany(() => ClassSchedule, (s) => s.classRoom, { cascade: true }) schedules: ClassSchedule[];

  @CreateDateColumn() createdAt: Date;
}

/** Slot jadwal mingguan kelas — tersinkron ke kalender cabang */
@Entity('class_schedules')
export class ClassSchedule {
  @PrimaryGeneratedColumn('uuid') id: string;
  /** 0 = Minggu, 1 = Senin, ... 6 = Sabtu */
  @Column({ type: 'smallint' }) dayOfWeek: number;
  /** Format HH:MM */
  @Column({ type: 'varchar', length: 5 }) startTime: string;
  @Column({ type: 'varchar', length: 5 }) endTime: string;
  @Column({ type: 'varchar', nullable: true }) room: string | null;
  @Column({ type: 'uuid' }) classId: string;
  @ManyToOne(() => ClassRoom, (c) => c.schedules, { onDelete: 'CASCADE', orphanedRowAction: 'delete' })
  @JoinColumn({ name: 'classId' })
  classRoom: ClassRoom;
}
