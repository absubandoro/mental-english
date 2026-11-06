import {
  BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Injectable, Module, NotFoundException, Param, ParseUUIDPipe,
  Patch, Post, Query,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Type } from 'class-transformer';
import {
  IsArray, IsDateString, IsEnum, IsNumber, IsOptional, IsString, IsUUID, Max, Min, MinLength, ValidateNested,
} from 'class-validator';
import { DataSource, Repository } from 'typeorm';
import { Attendance, AttendanceStatus, ClassRoom, ClassSession, ExamResult, Role, SessionType } from '../entities';
import { ADMIN_ROLES, assertBranch, Auth, AuthUser, CurrentUser, scopeBranch } from '../common/auth';
import { paginate } from '../common/util';
import { ClassesModule, ClassesService } from '../classes/classes';

export class CreateSessionDto {
  @IsUUID() classId: string;
  @IsOptional() @IsDateString() date?: string;
  @IsEnum(SessionType) type: SessionType;
  @IsString() @MinLength(2) topic: string;
  @IsOptional() @IsString() report?: string;
}

class AttendanceItem {
  @IsUUID() studentId: string;
  @IsEnum(AttendanceStatus) status: AttendanceStatus;
  @IsOptional() @IsString() note?: string;
}

class ExamItem {
  @IsUUID() studentId: string;
  @IsOptional() @IsNumber() @Min(0) @Max(100) score?: number | null;
  @IsOptional() @IsString() grade?: string;
  @IsOptional() @IsString() note?: string;
}

export class UpdateSessionDto {
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsEnum(SessionType) type?: SessionType;
  @IsOptional() @IsString() @MinLength(2) topic?: string;
  @IsOptional() @IsString() report?: string;
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => AttendanceItem) attendances?: AttendanceItem[];
  @IsOptional() @IsArray() @ValidateNested({ each: true }) @Type(() => ExamItem) examResults?: ExamItem[];
}

function today() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 10);
}

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(ClassSession) private repo: Repository<ClassSession>,
    @InjectRepository(Attendance) private attendances: Repository<Attendance>,
    @InjectRepository(ExamResult) private exams: Repository<ExamResult>,
    private classes: ClassesService,
    private ds: DataSource,
  ) {}

  async list(actor: AuthUser, q: { classId?: string; date?: string; type?: SessionType; branchId?: string; page?: string; limit?: string }) {
    const { page, limit, skip } = paginate({ page: q.page, limit: q.limit ?? 20 });
    const qb = this.repo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.classRoom', 'c')
      .leftJoin('s.teacher', 't')
      .addSelect(['t.id', 't.name'])
      .loadRelationCountAndMap('s.presentCount', 's.attendances', 'pa', (sq) => sq.where("pa.status = 'HADIR'"))
      .loadRelationCountAndMap('s.attendanceCount', 's.attendances')
      .orderBy('s.date', 'DESC')
      .addOrderBy('s.createdAt', 'DESC')
      .skip(skip)
      .take(limit);
    if (actor.role === Role.TEACHER) {
      qb.innerJoin('c.teachers', 'ct', 'ct.id = :me', { me: actor.id });
    }
    const branchId = scopeBranch(actor, q.branchId);
    if (branchId) qb.andWhere('c.branchId = :branchId', { branchId });
    if (q.classId) qb.andWhere('s.classId = :classId', { classId: q.classId });
    if (q.date) qb.andWhere('s.date = :date', { date: q.date });
    if (q.type) qb.andWhere('s.type = :type', { type: q.type });
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  private async assertTeaches(actor: AuthUser, cls: ClassRoom) {
    if (actor.role !== Role.TEACHER) return;
    if (!cls.teachers.some((t) => t.id === actor.id)) {
      throw new ForbiddenException('Anda belum di-assign ke kelas ini');
    }
  }

  async get(actor: AuthUser, id: string) {
    const s = await this.repo.findOne({
      where: { id },
      relations: { classRoom: true, teacher: true, attendances: true, examResults: true },
    });
    if (!s) throw new NotFoundException('Sesi kelas tidak ditemukan');
    const cls = await this.classes.entity(actor, s.classId);
    await this.assertTeaches(actor, cls);
    // Gabungkan daftar pelajar kelas dengan absensi & nilai
    const students = cls.students
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((st) => {
        const att = s.attendances.find((a) => a.studentId === st.id);
        const ex = s.examResults.find((e) => e.studentId === st.id);
        return {
          id: st.id,
          name: st.name,
          avatarUrl: st.avatarUrl,
          attendance: att ? { status: att.status, note: att.note } : null,
          exam: ex ? { score: ex.score, grade: ex.grade, note: ex.note } : null,
        };
      });
    const { attendances: _a, examResults: _e, teacher, ...rest } = s;
    return { ...rest, teacher: { id: teacher.id, name: teacher.name }, students };
  }

  async create(actor: AuthUser, dto: CreateSessionDto) {
    const cls = await this.classes.entity(actor, dto.classId);
    await this.assertTeaches(actor, cls);
    if (cls.students.length === 0) throw new BadRequestException('Kelas belum memiliki pelajar');
    const session = await this.repo.save(
      this.repo.create({
        classId: cls.id,
        teacherId: actor.id,
        date: dto.date ?? today(),
        type: dto.type,
        topic: dto.topic,
        report: dto.report ?? null,
        attendances: cls.students.map((s) => this.attendances.create({ studentId: s.id, status: AttendanceStatus.HADIR })),
        examResults:
          dto.type === SessionType.UJIAN ? cls.students.map((s) => this.exams.create({ studentId: s.id })) : [],
      }),
    );
    return this.get(actor, session.id);
  }

  async update(actor: AuthUser, id: string, dto: UpdateSessionDto) {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Sesi kelas tidak ditemukan');
    const cls = await this.classes.entity(actor, s.classId);
    await this.assertTeaches(actor, cls);
    const studentIds = new Set(cls.students.map((x) => x.id));
    const type = dto.type ?? s.type;

    await this.ds.transaction(async (m) => {
      await m.update(ClassSession, id, {
        ...(dto.date ? { date: dto.date } : {}),
        ...(dto.type ? { type: dto.type } : {}),
        ...(dto.topic ? { topic: dto.topic } : {}),
        ...(dto.report !== undefined ? { report: dto.report } : {}),
      });
      for (const a of dto.attendances ?? []) {
        if (!studentIds.has(a.studentId)) continue;
        await m.upsert(Attendance, { sessionId: id, studentId: a.studentId, status: a.status, note: a.note ?? null }, [
          'sessionId',
          'studentId',
        ]);
      }
      if (type === SessionType.UJIAN) {
        for (const e of dto.examResults ?? []) {
          if (!studentIds.has(e.studentId)) continue;
          await m.upsert(
            ExamResult,
            { sessionId: id, studentId: e.studentId, score: e.score ?? null, grade: e.grade ?? null, note: e.note ?? null },
            ['sessionId', 'studentId'],
          );
        }
      }
    });
    return this.get(actor, id);
  }

  async remove(actor: AuthUser, id: string) {
    const s = await this.repo.findOne({ where: { id } });
    if (!s) throw new NotFoundException('Sesi kelas tidak ditemukan');
    const cls = await this.classes.entity(actor, s.classId);
    await this.assertTeaches(actor, cls);
    assertBranch(actor, cls.branchId);
    await this.repo.delete(id);
    return { ok: true };
  }
}

@Controller('teacher/sessions')
@Auth(Role.TEACHER)
export class TeacherSessionsController {
  constructor(private svc: SessionsService) {}
  @Get() list(@CurrentUser() u: AuthUser, @Query() q: Record<string, string>) {
    return this.svc.list(u, q);
  }
  @Get(':id') get(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.get(u, id);
  }
  @Post() create(@CurrentUser() u: AuthUser, @Body() dto: CreateSessionDto) {
    return this.svc.create(u, dto);
  }
  @Patch(':id') update(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateSessionDto) {
    return this.svc.update(u, id, dto);
  }
  @Delete(':id') remove(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(u, id);
  }
}

/** Admin dapat memantau sesi kelas di cabangnya */
@Controller('admin/sessions')
@Auth(...ADMIN_ROLES)
export class AdminSessionsController {
  constructor(private svc: SessionsService) {}
  @Get() list(@CurrentUser() u: AuthUser, @Query() q: Record<string, string>) {
    return this.svc.list(u, q);
  }
  @Get(':id') get(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.get(u, id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([ClassSession, Attendance, ExamResult]), ClassesModule],
  controllers: [TeacherSessionsController, AdminSessionsController],
  providers: [SessionsService],
})
export class SessionsModule {}
