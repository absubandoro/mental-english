import { Controller, ForbiddenException, Get, Injectable, Module, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Attendance, AttendanceStatus, ClassRoom, ExamResult, Payment, Role, User } from '../entities';
import { Auth, AuthUser, CurrentUser } from '../common/auth';
import { MadingModule, MadingService } from '../mading/mading';

@Injectable()
export class ParentService {
  constructor(
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(ClassRoom) private classes: Repository<ClassRoom>,
    @InjectRepository(Attendance) private attendances: Repository<Attendance>,
    @InjectRepository(ExamResult) private exams: Repository<ExamResult>,
    @InjectRepository(Payment) private paymentRepo: Repository<Payment>,
    private mading: MadingService,
  ) {}

  private async child(parentId: string, childId: string) {
    const child = await this.users.findOne({ where: { id: childId, parentId, role: Role.STUDENT }, relations: { branch: true } });
    if (!child) throw new ForbiddenException('Data anak tidak ditemukan');
    return child;
  }

  private async classesOf(studentId: string) {
    const list = await this.classes
      .createQueryBuilder('c')
      .innerJoin('c.students', 's', 's.id = :studentId', { studentId })
      .leftJoinAndSelect('c.teachers', 't')
      .getMany();
    return list.map((c) => ({ id: c.id, name: c.name, schedule: c.schedule, level: c.level, teachers: c.teachers.map((t) => t.name) }));
  }

  async children(parentId: string) {
    const kids = await this.users.find({ where: { parentId, role: Role.STUDENT }, relations: { branch: true }, order: { name: 'ASC' } });
    return Promise.all(kids.map(async (k) => ({ ...k, classes: await this.classesOf(k.id) })));
  }

  async childProfile(parentId: string, childId: string) {
    const child = await this.child(parentId, childId);
    return { ...child, classes: await this.classesOf(child.id) };
  }

  async childMading(parentId: string, childId: string, q: { page?: string }) {
    await this.child(parentId, childId);
    return this.mading.list(q, { authorId: childId });
  }

  async dashboard(parentId: string, childId: string) {
    const child = await this.child(parentId, childId);
    const atts = await this.attendances.find({
      where: { studentId: child.id },
      relations: { session: { classRoom: true, teacher: true } },
      order: { session: { date: 'DESC' } },
    });
    const counts = Object.fromEntries(Object.values(AttendanceStatus).map((s) => [s, 0])) as Record<AttendanceStatus, number>;
    atts.forEach((a) => counts[a.status]++);
    const total = atts.length;
    const exams = await this.exams.find({
      where: { studentId: child.id },
      relations: { session: { classRoom: true, teacher: true } },
      order: { session: { date: 'DESC' } },
    });
    const scored = exams.filter((e) => e.score != null);
    const avg = scored.length ? scored.reduce((s, e) => s + (e.score ?? 0), 0) / scored.length : null;

    return {
      child: { id: child.id, name: child.name, branch: child.branch?.name ?? null },
      attendance: {
        total,
        counts,
        ratio: total ? Math.round((counts.HADIR / total) * 1000) / 10 : null,
        recent: atts.slice(0, 15).map((a) => ({
          id: a.id,
          date: a.session.date,
          type: a.session.type,
          topic: a.session.topic,
          className: a.session.classRoom?.name,
          status: a.status,
          note: a.note,
          teacherReport: a.session.report,
          teacher: a.session.teacher?.name,
          media: a.session.media ?? [],
        })),
      },
      exams: {
        count: exams.length,
        average: avg == null ? null : Math.round(avg * 10) / 10,
        list: exams.map((e) => ({
          id: e.id,
          date: e.session.date,
          topic: e.session.topic,
          className: e.session.classRoom?.name,
          teacher: e.session.teacher?.name,
          score: e.score,
          grade: e.grade,
          note: e.note,
          teacherReport: e.session.report,
        })),
      },
    };
  }

  async childPayments(parentId: string, childId?: string) {
    const kids = await this.users.find({ where: { parentId, role: Role.STUDENT }, select: ['id', 'name'] });
    const ids = childId ? kids.filter((k) => k.id === childId).map((k) => k.id) : kids.map((k) => k.id);
    if (!ids.length) return { data: [], summary: { paid: 0, unpaid: 0, pending: 0 } };
    const data = await this.paymentRepo.find({
      where: { studentId: In(ids) },
      relations: { student: true },
      order: { period: 'DESC' },
    });
    const sum = (st: string) => data.filter((p) => p.status === st).reduce((s, p) => s + p.amount, 0);
    return {
      data: data.map((p) => ({ ...p, student: { id: p.student.id, name: p.student.name } })),
      summary: { paid: sum('LUNAS'), unpaid: sum('BELUM_BAYAR'), pending: sum('MENUNGGU') },
    };
  }
}

@Controller('parent')
@Auth(Role.PARENT)
export class ParentController {
  constructor(private svc: ParentService) {}
  @Get('children') children(@CurrentUser() u: AuthUser) {
    return this.svc.children(u.id);
  }
  @Get('children/:id') child(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.childProfile(u.id, id);
  }
  @Get('children/:id/mading') mading(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Query() q: { page?: string }) {
    return this.svc.childMading(u.id, id, q);
  }
  @Get('children/:id/dashboard') dashboard(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.dashboard(u.id, id);
  }
  @Get('payments') payments(@CurrentUser() u: AuthUser, @Query('childId') childId?: string) {
    return this.svc.childPayments(u.id, childId);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([User, ClassRoom, Attendance, ExamResult, Payment]), MadingModule],
  controllers: [ParentController],
  providers: [ParentService],
})
export class ParentModule {}
