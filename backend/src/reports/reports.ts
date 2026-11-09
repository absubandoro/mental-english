import {
  BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Injectable, Module, NotFoundException, Param, ParseUUIDPipe, Patch,
  Post, Query,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsDateString, IsNumber, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength, ValidateIf, ValidateNested,
} from 'class-validator';
import { Between, Repository } from 'typeorm';
import {
  Attendance, AttendanceStatus, AttendanceSummary, ClassRoom, ExamResult, ExamSummary, NotificationTarget, ProgressReport, ReportStatus, Role,
  SkillScore, User,
} from '../entities';
import { Auth, AuthUser, CurrentUser, scopeBranch } from '../common/auth';
import { MediaDto, MediaField } from '../common/media';
import { paginate } from '../common/util';
import { NotificationsModule, NotificationsService } from '../notifications/notifications';

/** Aspek penilaian bawaan rapor Mental English */
export const DEFAULT_SKILLS: { key: string; label: string }[] = [
  { key: 'speaking', label: 'Speaking' },
  { key: 'listening', label: 'Listening' },
  { key: 'reading', label: 'Reading' },
  { key: 'writing', label: 'Writing' },
  { key: 'vocabulary', label: 'Vocabulary' },
  { key: 'grammar', label: 'Grammar' },
  { key: 'confidence', label: 'Mental & Kepercayaan Diri' },
  { key: 'focus', label: 'Fokus & Konsentrasi' },
];

export function gradeFor(score: number | null) {
  if (score == null) return null;
  if (score >= 90) return 'A';
  if (score >= 80) return 'B+';
  if (score >= 70) return 'B';
  if (score >= 60) return 'C';
  return 'D';
}

class SkillDto {
  @IsString() @MaxLength(40) key: string;
  @IsString() @MaxLength(60) label: string;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsNumber() @Min(0) @Max(100) score?: number | null;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(500) note?: string | null;
}

export class CreateReportDto {
  @IsUUID() studentId: string;
  @IsUUID() classId: string;
  @IsString() @MinLength(3) @MaxLength(120) title: string;
  @IsDateString() periodStart: string;
  @IsDateString() periodEnd: string;
}

export class BulkReportDto {
  @IsUUID() classId: string;
  @IsString() @MinLength(3) @MaxLength(120) title: string;
  @IsDateString() periodStart: string;
  @IsDateString() periodEnd: string;
}

export class UpdateReportDto {
  @IsOptional() @IsString() @MinLength(3) @MaxLength(120) title?: string;
  @IsOptional() @IsDateString() periodStart?: string;
  @IsOptional() @IsDateString() periodEnd?: string;
  @IsOptional() @IsArray() @ArrayMaxSize(15) @ValidateNested({ each: true }) @Type(() => SkillDto) skills?: SkillDto[];
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(10) overallGrade?: string | null;
  @IsOptional() @IsString() @MaxLength(3000) teacherComment?: string;
  @IsOptional() @IsString() @MaxLength(3000) recommendation?: string;
  @MediaField() media?: MediaDto[];
}

interface ReportQuery {
  classId?: string;
  studentId?: string;
  status?: ReportStatus;
  branchId?: string;
  q?: string;
  page?: string;
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(ProgressReport) private repo: Repository<ProgressReport>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(ClassRoom) private classes: Repository<ClassRoom>,
    @InjectRepository(Attendance) private attendances: Repository<Attendance>,
    @InjectRepository(ExamResult) private exams: Repository<ExamResult>,
    private notifications: NotificationsService,
  ) {}

  // ---------- hak akses

  private async teaches(user: AuthUser, classId: string | null) {
    if (!classId) return false;
    return this.classes
      .createQueryBuilder('c')
      .innerJoin('c.teachers', 't', 't.id = :me', { me: user.id })
      .where('c.id = :classId', { classId })
      .getExists();
  }

  private async canEdit(user: AuthUser, r: ProgressReport) {
    if (user.role === Role.SUPER_ADMIN) return true;
    if (user.role === Role.ADMIN) return r.branchId === user.branchId;
    if (user.role === Role.TEACHER) return r.branchId === user.branchId && ((await this.teaches(user, r.classId)) || r.authorId === user.id);
    return false;
  }

  private async assertEdit(user: AuthUser, r: ProgressReport) {
    if (!(await this.canEdit(user, r))) throw new ForbiddenException('Anda tidak dapat mengubah rapor ini');
  }

  private async canView(user: AuthUser, r: ProgressReport) {
    if (await this.canEdit(user, r)) return true;
    if (r.status !== ReportStatus.PUBLISHED) return false;
    if (user.role === Role.STUDENT) return r.studentId === user.id;
    if (user.role === Role.PARENT) return r.student?.parentId === user.id;
    return false;
  }

  // ---------- ringkasan otomatis

  private async summarize(studentId: string, classId: string | null, from: string, to: string) {
    const sessionWhere = { date: Between(from, to), ...(classId ? { classId } : {}) };
    const atts = await this.attendances.find({ where: { studentId, session: sessionWhere }, relations: { session: true } });
    const counts = { HADIR: 0, IZIN: 0, SAKIT: 0, ALPA: 0 } as Record<AttendanceStatus, number>;
    atts.forEach((a) => counts[a.status]++);
    const attendance: AttendanceSummary = {
      total: atts.length,
      ...counts,
      ratio: atts.length ? Math.round((counts.HADIR / atts.length) * 1000) / 10 : null,
    };
    const ex = await this.exams.find({ where: { studentId, session: sessionWhere }, relations: { session: true } });
    ex.sort((a, b) => a.session.date.localeCompare(b.session.date));
    const scored = ex.filter((e) => e.score != null);
    const exam: ExamSummary = {
      count: ex.length,
      average: scored.length ? Math.round((scored.reduce((s, e) => s + (e.score ?? 0), 0) / scored.length) * 10) / 10 : null,
      items: ex.map((e) => ({ date: e.session.date, topic: e.session.topic, score: e.score, grade: e.grade })),
    };
    return { attendance, exam };
  }

  private present(r: ProgressReport) {
    const scores = (r.skills ?? []).map((s) => s.score).filter((x): x is number => x != null);
    const overallScore = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10 : null;
    const { student, author, classRoom, branch, ...rest } = r;
    return {
      ...rest,
      overallScore,
      suggestedGrade: gradeFor(overallScore),
      student: student
        ? { id: student.id, name: student.name, avatarUrl: student.avatarUrl, birthDate: student.birthDate, school: student.school, level: student.level }
        : undefined,
      author: author ? { id: author.id, name: author.name } : null,
      classRoom: classRoom ? { id: classRoom.id, name: classRoom.name, level: classRoom.level } : null,
      branch: branch ? { id: branch.id, name: branch.name, address: branch.address } : undefined,
    };
  }

  private async load(id: string) {
    const r = await this.repo.findOne({ where: { id }, relations: { student: true, author: true, classRoom: true, branch: true } });
    if (!r) throw new NotFoundException('Rapor tidak ditemukan');
    return r;
  }

  // ---------- query

  async list(user: AuthUser, q: ReportQuery) {
    const { page, limit, skip } = paginate({ page: q.page, limit: 30 });
    const qb = this.repo
      .createQueryBuilder('r')
      .leftJoin('r.student', 's')
      .addSelect(['s.id', 's.name', 's.avatarUrl', 's.parentId'])
      .leftJoin('r.classRoom', 'c')
      .addSelect(['c.id', 'c.name'])
      .leftJoin('r.author', 'a')
      .addSelect(['a.id', 'a.name'])
      .orderBy('r.periodEnd', 'DESC')
      .addOrderBy('s.name', 'ASC')
      .skip(skip)
      .take(limit);

    if (user.role === Role.PARENT) {
      qb.where('s.parentId = :me AND r.status = :pub', { me: user.id, pub: ReportStatus.PUBLISHED });
    } else if (user.role === Role.STUDENT) {
      qb.where('r.studentId = :me AND r.status = :pub', { me: user.id, pub: ReportStatus.PUBLISHED });
    } else if (user.role === Role.TEACHER) {
      qb.innerJoin('c.teachers', 'ct', 'ct.id = :me', { me: user.id }).where('r.branchId = :b', { b: user.branchId });
    } else if (user.role === Role.ADMIN || user.role === Role.SUPER_ADMIN) {
      const branchId = scopeBranch(user, q.branchId);
      qb.where(branchId ? 'r.branchId = :b' : '1=1', { b: branchId });
    } else {
      throw new ForbiddenException();
    }
    if (q.classId) qb.andWhere('r.classId = :classId', { classId: q.classId });
    if (q.studentId) qb.andWhere('r.studentId = :studentId', { studentId: q.studentId });
    if (q.status && user.role !== Role.PARENT && user.role !== Role.STUDENT) qb.andWhere('r.status = :st', { st: q.status });
    if (q.q) qb.andWhere('(s.name ILIKE :q OR r.title ILIKE :q)', { q: `%${q.q}%` });
    const [rows, total] = await qb.getManyAndCount();
    return { data: rows.map((r) => this.present(r)), total, page, limit };
  }

  async get(user: AuthUser, id: string) {
    const r = await this.load(id);
    if (!(await this.canView(user, r))) throw new ForbiddenException('Rapor tidak dapat diakses');
    return { ...this.present(r), canEdit: await this.canEdit(user, r) };
  }

  // ---------- tulis

  private async checkClassAndStudent(user: AuthUser, classId: string, studentId?: string) {
    const cls = await this.classes.findOne({ where: { id: classId }, relations: { students: true } });
    if (!cls) throw new BadRequestException('Kelas tidak ditemukan');
    if (user.role !== Role.SUPER_ADMIN && cls.branchId !== user.branchId) throw new ForbiddenException('Kelas milik cabang lain');
    if (user.role === Role.TEACHER && !(await this.teaches(user, classId))) throw new ForbiddenException('Anda belum di-assign ke kelas ini');
    if (studentId && !cls.students.some((s) => s.id === studentId)) throw new BadRequestException('Pelajar tidak terdaftar di kelas ini');
    return cls;
  }

  private assertRole(user: AuthUser) {
    if (![Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER].includes(user.role)) throw new ForbiddenException();
  }

  private async build(user: AuthUser, cls: ClassRoom, studentId: string, dto: { title: string; periodStart: string; periodEnd: string }) {
    if (dto.periodEnd < dto.periodStart) throw new BadRequestException('Periode akhir harus setelah periode awal');
    const { attendance, exam } = await this.summarize(studentId, cls.id, dto.periodStart, dto.periodEnd);
    return this.repo.create({
      title: dto.title,
      periodStart: dto.periodStart,
      periodEnd: dto.periodEnd,
      studentId,
      classId: cls.id,
      branchId: cls.branchId,
      authorId: user.id,
      skills: DEFAULT_SKILLS.map((s) => ({ ...s, score: null, note: null })),
      attendanceSummary: attendance,
      examSummary: exam,
      status: ReportStatus.DRAFT,
    });
  }

  async create(user: AuthUser, dto: CreateReportDto) {
    this.assertRole(user);
    const cls = await this.checkClassAndStudent(user, dto.classId, dto.studentId);
    const saved = await this.repo.save(await this.build(user, cls, dto.studentId, dto));
    return this.get(user, saved.id);
  }

  /** Buat draf rapor untuk semua pelajar di kelas yang belum punya rapor dengan judul yang sama */
  async bulk(user: AuthUser, dto: BulkReportDto) {
    this.assertRole(user);
    const cls = await this.checkClassAndStudent(user, dto.classId);
    const existing = await this.repo.find({ where: { classId: cls.id, title: dto.title }, select: ['studentId'] });
    const has = new Set(existing.map((e) => e.studentId));
    let created = 0;
    for (const s of cls.students.filter((x) => !has.has(x.id))) {
      await this.repo.save(await this.build(user, cls, s.id, dto));
      created++;
    }
    return { created, skipped: has.size };
  }

  async update(user: AuthUser, id: string, dto: UpdateReportDto) {
    const r = await this.load(id);
    await this.assertEdit(user, r);
    if (dto.skills) r.skills = dto.skills.map((s) => ({ key: s.key, label: s.label, score: s.score ?? null, note: s.note ?? null })) as SkillScore[];
    for (const k of ['title', 'periodStart', 'periodEnd', 'teacherComment', 'recommendation', 'media'] as const) {
      if (dto[k] !== undefined) (r as unknown as Record<string, unknown>)[k] = dto[k];
    }
    if (dto.overallGrade !== undefined) r.overallGrade = dto.overallGrade || null;
    if (r.periodEnd < r.periodStart) throw new BadRequestException('Periode akhir harus setelah periode awal');
    if (dto.periodStart || dto.periodEnd) {
      const { attendance, exam } = await this.summarize(r.studentId, r.classId, r.periodStart, r.periodEnd);
      r.attendanceSummary = attendance;
      r.examSummary = exam;
    }
    await this.repo.save(r);
    return this.get(user, id);
  }

  async refresh(user: AuthUser, id: string) {
    const r = await this.load(id);
    await this.assertEdit(user, r);
    const { attendance, exam } = await this.summarize(r.studentId, r.classId, r.periodStart, r.periodEnd);
    await this.repo.update(id, { attendanceSummary: attendance, examSummary: exam });
    return this.get(user, id);
  }

  async setPublished(user: AuthUser, id: string, publish: boolean) {
    const r = await this.load(id);
    await this.assertEdit(user, r);
    if (publish) {
      if (!r.skills.some((s) => s.score != null)) throw new BadRequestException('Isi minimal satu nilai aspek sebelum menerbitkan rapor');
      await this.repo.update(id, { status: ReportStatus.PUBLISHED, publishedAt: new Date() });
      if (r.student.parentId) {
        await this.notifications.send({
          title: `Rapor baru: ${r.title}`,
          body: `Rapor perkembangan ${r.student.name} (${r.periodStart} s.d. ${r.periodEnd}) sudah terbit. Lihat di menu Rapor.`,
          target: NotificationTarget.USERS,
          branchId: r.branchId,
          userIds: [r.student.parentId],
          createdById: user.id,
        });
      }
    } else {
      await this.repo.update(id, { status: ReportStatus.DRAFT, publishedAt: null });
    }
    return this.get(user, id);
  }

  async remove(user: AuthUser, id: string) {
    const r = await this.load(id);
    await this.assertEdit(user, r);
    if (r.status === ReportStatus.PUBLISHED && user.role === Role.TEACHER) {
      throw new BadRequestException('Rapor yang sudah terbit hanya bisa dihapus admin. Batalkan terbit terlebih dahulu.');
    }
    await this.repo.delete(id);
    return { ok: true };
  }

  async defaults() {
    return { skills: DEFAULT_SKILLS };
  }

}

const EDITORS = [Role.SUPER_ADMIN, Role.ADMIN, Role.TEACHER];

@Controller('reports')
export class ReportsController {
  constructor(private svc: ReportsService) {}

  @Get() @Auth() list(@CurrentUser() u: AuthUser, @Query() q: ReportQuery) {
    return this.svc.list(u, q);
  }
  @Get('defaults') @Auth(...EDITORS) defaults() {
    return this.svc.defaults();
  }
  @Get(':id') @Auth() get(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.get(u, id);
  }
  @Post() @Auth(...EDITORS) create(@CurrentUser() u: AuthUser, @Body() dto: CreateReportDto) {
    return this.svc.create(u, dto);
  }
  @Post('bulk') @Auth(...EDITORS) bulk(@CurrentUser() u: AuthUser, @Body() dto: BulkReportDto) {
    return this.svc.bulk(u, dto);
  }
  @Patch(':id') @Auth(...EDITORS) update(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateReportDto) {
    return this.svc.update(u, id, dto);
  }
  @Post(':id/refresh') @Auth(...EDITORS) refresh(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.refresh(u, id);
  }
  @Post(':id/publish') @Auth(...EDITORS) publish(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.setPublished(u, id, true);
  }
  @Post(':id/unpublish') @Auth(...EDITORS) unpublish(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.setPublished(u, id, false);
  }
  @Delete(':id') @Auth(...EDITORS) remove(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(u, id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([ProgressReport, User, ClassRoom, Attendance, ExamResult]), NotificationsModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
