import {
  BadRequestException, Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { Between, In, Repository } from 'typeorm';
import { CalendarEvent, CalendarEventType, ClassRoom, ClassSession, NotificationTarget, Role, User } from '../entities';
import { ADMIN_ROLES, assertBranch, Auth, AuthUser, CurrentUser, requireBranch, scopeBranch } from '../common/auth';
import { addDays, clean, dayOfWeek } from '../common/util';
import { NotificationsModule, NotificationsService } from '../notifications/notifications';

const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CalendarEventDto {
  @IsString() @MinLength(2) @MaxLength(150) title: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsEnum(CalendarEventType) type: CalendarEventType;
  @IsDateString() startDate: string;
  @IsOptional() @IsDateString() endDate?: string;
  @IsOptional() @ValidateIf((_, v) => v !== null && v !== '') @Matches(TIME) startTime?: string | null;
  @IsOptional() @ValidateIf((_, v) => v !== null && v !== '') @Matches(TIME) endTime?: string | null;
  /** Kosong = berlaku untuk seluruh cabang */
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsUUID() classId?: string | null;
  @IsOptional() @IsUUID() branchId?: string;
  /** Kirim notifikasi ke orang tua (saat membuat) */
  @IsOptional() @IsBoolean() notify?: boolean;
}

interface CalendarQuery {
  from?: string;
  to?: string;
  classId?: string;
  mine?: string;
  branchId?: string;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;

@Injectable()
export class CalendarService {
  constructor(
    @InjectRepository(CalendarEvent) private events: Repository<CalendarEvent>,
    @InjectRepository(ClassRoom) private classes: Repository<ClassRoom>,
    @InjectRepository(ClassSession) private sessions: Repository<ClassSession>,
    @InjectRepository(User) private users: Repository<User>,
    private notifications: NotificationsService,
  ) {}

  /** Cabang & kelas yang boleh dilihat oleh user */
  private async scope(user: AuthUser, q: CalendarQuery): Promise<{ branchIds: string[] | null; classIds: string[] | null }> {
    if (user.role === Role.PARENT || user.role === Role.STUDENT) {
      const students =
        user.role === Role.PARENT
          ? await this.users.find({ where: { parentId: user.id, role: Role.STUDENT }, select: ['id', 'branchId'] })
          : await this.users.find({ where: { id: user.id }, select: ['id', 'branchId'] });
      const ids = students.map((s) => s.id);
      const branchIds = [...new Set(students.map((s) => s.branchId).filter((x): x is string => !!x))];
      if (!ids.length) return { branchIds: [], classIds: [] };
      const cls = await this.classes
        .createQueryBuilder('c')
        .innerJoin('c.students', 's', 's.id IN (:...ids)', { ids })
        .select('c.id')
        .getMany();
      return { branchIds, classIds: cls.map((c) => c.id) };
    }
    const branchId = scopeBranch(user, q.branchId);
    let classIds: string[] | null = null;
    if (user.role === Role.TEACHER && q.mine === 'true') {
      const mine = await this.classes
        .createQueryBuilder('c')
        .innerJoin('c.teachers', 't', 't.id = :me', { me: user.id })
        .select('c.id')
        .getMany();
      classIds = mine.map((c) => c.id);
    }
    return { branchIds: branchId ? [branchId] : null, classIds };
  }

  async range(user: AuthUser, q: CalendarQuery) {
    const from = q.from && ISO.test(q.from) ? q.from : new Date().toISOString().slice(0, 8) + '01';
    const to = q.to && ISO.test(q.to) ? q.to : addDays(from, 41);
    if (to < from) throw new BadRequestException('Rentang tanggal tidak valid');
    if ((Date.parse(to) - Date.parse(from)) / 86400000 > 92) throw new BadRequestException('Rentang maksimal 3 bulan');

    const { branchIds, classIds: scopeClassIds } = await this.scope(user, q);
    let classIds = scopeClassIds;
    if (q.classId) {
      if (classIds && !classIds.includes(q.classId)) return { from, to, events: [], occurrences: [] };
      classIds = [q.classId];
    }
    if (branchIds && !branchIds.length) return { from, to, events: [], occurrences: [] };

    // Agenda cabang (umum) + agenda khusus kelas yang relevan
    const eqb = this.events
      .createQueryBuilder('e')
      .leftJoin('e.classRoom', 'c')
      .addSelect(['c.id', 'c.name'])
      .leftJoin('e.branch', 'b')
      .addSelect(['b.id', 'b.name'])
      .where('e.startDate <= :to AND e.endDate >= :from', { from, to })
      .orderBy('e.startDate', 'ASC')
      .addOrderBy('e.startTime', 'ASC', 'NULLS FIRST');
    if (branchIds) eqb.andWhere('e.branchId IN (:...branchIds)', { branchIds });
    if (classIds) {
      if (classIds.length) eqb.andWhere('(e.classId IS NULL OR e.classId IN (:...classIds))', { classIds });
      else eqb.andWhere('e.classId IS NULL');
    }
    const events = await eqb.getMany();

    // Jadwal kelas mingguan -> kemunculan per tanggal
    const cqb = this.classes
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.schedules', 'sc')
      .leftJoin('c.teachers', 't')
      .addSelect(['t.id', 't.name']);
    if (branchIds) cqb.andWhere('c.branchId IN (:...branchIds)', { branchIds });
    if (classIds) {
      if (!classIds.length) return { from, to, events, occurrences: [] };
      cqb.andWhere('c.id IN (:...classIds)', { classIds });
    }
    const classes = await cqb.getMany();
    const sessions = classes.length
      ? await this.sessions.find({
          where: { classId: In(classes.map((c) => c.id)), date: Between(from, to) },
          select: ['id', 'classId', 'date', 'type', 'topic'],
        })
      : [];

    const holidays = events.filter((e) => e.type === CalendarEventType.LIBUR);
    const holidayFor = (date: string, cls: ClassRoom) =>
      holidays.find((h) => h.branchId === cls.branchId && (!h.classId || h.classId === cls.id) && h.startDate <= date && h.endDate >= date);

    const occurrences: Record<string, unknown>[] = [];
    const used = new Set<string>();
    for (let d = from; d <= to; d = addDays(d, 1)) {
      const dow = dayOfWeek(d);
      for (const c of classes) {
        for (const s of c.schedules.filter((x) => x.dayOfWeek === dow)) {
          const hol = holidayFor(d, c);
          const ses = sessions.find((x) => x.classId === c.id && x.date === d && !used.has(x.id));
          if (ses) used.add(ses.id);
          occurrences.push({
            date: d,
            classId: c.id,
            className: c.name,
            branchId: c.branchId,
            startTime: s.startTime,
            endTime: s.endTime,
            room: s.room,
            teachers: c.teachers.map((t) => t.name),
            holiday: !!hol,
            holidayTitle: hol?.title ?? null,
            session: ses ? { id: ses.id, type: ses.type, topic: ses.topic } : null,
          });
        }
      }
    }
    // Pertemuan di luar jadwal rutin (kelas tambahan / pengganti)
    for (const ses of sessions.filter((x) => !used.has(x.id))) {
      const c = classes.find((x) => x.id === ses.classId)!;
      occurrences.push({
        date: ses.date,
        classId: c.id,
        className: c.name,
        branchId: c.branchId,
        startTime: null,
        endTime: null,
        room: null,
        teachers: c.teachers.map((t) => t.name),
        holiday: false,
        holidayTitle: null,
        extra: true,
        session: { id: ses.id, type: ses.type, topic: ses.topic },
      });
    }
    occurrences.sort((a, b) => `${a.date}${a.startTime ?? ''}`.localeCompare(`${b.date}${b.startTime ?? ''}`));
    return { from, to, events, occurrences };
  }

  private async get(id: string) {
    const e = await this.events.findOne({ where: { id } });
    if (!e) throw new NotFoundException('Agenda tidak ditemukan');
    return e;
  }

  private async validateClass(classId: string | null | undefined, branchId: string) {
    if (!classId) return;
    const c = await this.classes.findOneBy({ id: classId });
    if (!c || c.branchId !== branchId) throw new BadRequestException('Kelas tidak valid untuk cabang ini');
  }

  async create(user: AuthUser, dto: CalendarEventDto) {
    const branchId = requireBranch(user, dto.branchId);
    const endDate = dto.endDate && dto.endDate >= dto.startDate ? dto.endDate : dto.startDate;
    await this.validateClass(dto.classId, branchId);
    const { notify, branchId: _b, ...rest } = dto;
    const e = await this.events.save(
      this.events.create({
        ...rest,
        startTime: rest.startTime || null,
        endTime: rest.endTime || null,
        classId: rest.classId || null,
        endDate,
        branchId,
        createdById: user.id,
      }),
    );
    if (notify) await this.notify(user, e);
    return e;
  }

  private async notify(user: AuthUser, e: CalendarEvent) {
    let parentIds: string[];
    if (e.classId) {
      const c = await this.classes.findOne({ where: { id: e.classId }, relations: { students: true } });
      parentIds = (c?.students ?? []).map((s) => s.parentId).filter((x): x is string => !!x);
    } else {
      parentIds = (await this.users.find({ where: { branchId: e.branchId, role: Role.PARENT, isActive: true }, select: ['id'] })).map((u) => u.id);
    }
    if (!parentIds.length) return;
    const label = { LIBUR: 'Libur', ACARA: 'Acara', UJIAN: 'Ujian', LAINNYA: 'Agenda' }[e.type];
    const date = e.endDate !== e.startDate ? `${e.startDate} s.d. ${e.endDate}` : e.startDate;
    await this.notifications.send({
      title: `${label}: ${e.title}`,
      body: `${date}${e.startTime ? ` pukul ${e.startTime}` : ''}${e.description ? ` — ${e.description}` : ''}`,
      target: e.classId ? NotificationTarget.CLASS_PARENTS : NotificationTarget.BRANCH_PARENTS,
      branchId: e.branchId,
      userIds: parentIds,
      createdById: user.id,
    });
  }

  async update(user: AuthUser, id: string, dto: Partial<CalendarEventDto>) {
    const e = await this.get(id);
    assertBranch(user, e.branchId);
    const { notify: _n, branchId: _b, ...rest } = dto;
    if (rest.classId !== undefined) await this.validateClass(rest.classId, e.branchId);
    const patch = clean({
      ...rest,
      startTime: rest.startTime === '' ? null : rest.startTime,
      endTime: rest.endTime === '' ? null : rest.endTime,
    }) as Partial<CalendarEvent>;
    const start = patch.startDate ?? e.startDate;
    if ((patch.endDate ?? e.endDate) < start) patch.endDate = start;
    await this.events.update(id, patch);
    return this.get(id);
  }

  async remove(user: AuthUser, id: string) {
    const e = await this.get(id);
    assertBranch(user, e.branchId);
    await this.events.delete(id);
    return { ok: true };
  }
}

/** Semua role yang login dapat melihat kalender sesuai cakupannya */
@Controller('calendar')
@Auth()
export class CalendarController {
  constructor(private svc: CalendarService) {}
  @Get() range(@CurrentUser() u: AuthUser, @Query() q: CalendarQuery) {
    return this.svc.range(u, q);
  }
}

@Controller('admin/calendar')
@Auth(...ADMIN_ROLES)
export class AdminCalendarController {
  constructor(private svc: CalendarService) {}
  @Post() create(@CurrentUser() u: AuthUser, @Body() dto: CalendarEventDto) {
    return this.svc.create(u, dto);
  }
  @Patch(':id') update(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: CalendarEventDto) {
    return this.svc.update(u, id, dto);
  }
  @Delete(':id') remove(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(u, id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([CalendarEvent, ClassRoom, ClassSession, User]), NotificationsModule],
  controllers: [CalendarController, AdminCalendarController],
  providers: [CalendarService],
})
export class CalendarModule {}
