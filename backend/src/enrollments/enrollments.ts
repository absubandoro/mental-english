import {
  BadRequestException, Body, ConflictException, Controller, Get, Injectable, Module, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import * as bcrypt from 'bcryptjs';
import { IsDateString, IsEmail, IsEnum, IsOptional, IsString, IsUUID, Matches, MaxLength, MinLength } from 'class-validator';
import { DataSource, In, Repository } from 'typeorm';
import { Branch, ClassRoom, Organization, Enrollment, EnrollmentStatus, NotificationTarget, Role, User } from '../entities';
import { ADMIN_ROLES, assertBranch, Auth, AuthUser, CurrentUser, scopeBranch } from '../common/auth';
import { CurrentOrg } from '../common/tenant';
import { paginate, randomSuffix, slugify } from '../common/util';
import { NotificationsModule, NotificationsService } from '../notifications/notifications';

export class EnrollDto {
  @IsUUID() branchId: string;
  @IsString() @MinLength(2) @MaxLength(100) studentName: string;
  @IsOptional() @IsDateString() studentBirthDate?: string;
  @IsOptional() @IsString() @MaxLength(120) studentSchool?: string;
  @IsOptional() @IsString() @MaxLength(60) program?: string;
  @IsOptional() @IsEmail() studentEmail?: string;
  @IsString() @MinLength(2) @MaxLength(100) parentName: string;
  @Matches(/^[0-9+\-\s()]{8,20}$/, { message: 'Nomor WhatsApp tidak valid' }) parentPhone: string;
  @IsEmail() parentEmail: string;
  @IsString() @MinLength(6) @MaxLength(100) password: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
  /** Jebakan bot — harus kosong */
  @IsOptional() @IsString() website?: string;
}

export class UpdateEnrollmentDto {
  @IsOptional() @IsEnum(EnrollmentStatus) status?: EnrollmentStatus;
  @IsOptional() @IsString() @MaxLength(1000) adminNote?: string;
}

export class AcceptEnrollmentDto {
  /** Opsional: langsung masukkan ke kelas */
  @IsOptional() @IsUUID() classId?: string;
  @IsOptional() @IsString() @MaxLength(1000) adminNote?: string;
}

@Injectable()
export class EnrollmentsService {
  constructor(
    @InjectRepository(Enrollment) private repo: Repository<Enrollment>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Branch) private branches: Repository<Branch>,
    @InjectRepository(ClassRoom) private classes: Repository<ClassRoom>,
    private ds: DataSource,
    private notifications: NotificationsService,
  ) {}

  async submit(org: Organization, dto: EnrollDto) {
    if (dto.website) return { ok: true }; // bot
    const branch = await this.branches.findOneBy({ id: dto.branchId, organizationId: org.id });
    if (!branch) throw new BadRequestException('Cabang tidak ditemukan');
    const parentEmail = dto.parentEmail.toLowerCase();
    const existing = await this.users.findOneBy({ email: parentEmail, organizationId: org.id });
    if (existing && existing.role !== Role.PARENT) throw new ConflictException('Email orang tua sudah dipakai akun lain');
    const dup = await this.repo.exists({ where: { parentEmail, studentName: dto.studentName, status: EnrollmentStatus.BARU, branchId: branch.id } });
    if (dup) throw new ConflictException('Pendaftaran untuk siswa ini sudah kami terima dan sedang diproses');
    const { password, website: _w, ...rest } = dto;
    await this.repo.save(
      this.repo.create({
        ...rest,
        parentEmail,
        studentEmail: dto.studentEmail?.toLowerCase() ?? null,
        passwordHash: await bcrypt.hash(password, 10),
      }),
    );
    // Beri tahu admin cabang (kotak masuk notifikasi)
    const admins = await this.users.find({ where: { branchId: branch.id, role: Role.ADMIN, isActive: true }, select: ['id'] });
    if (admins.length) {
      await this.notifications.send({
        title: 'Pendaftaran siswa baru',
        body: `${dto.studentName} (orang tua: ${dto.parentName}, ${dto.parentPhone}) mendaftar di ${branch.name}.`,
        target: NotificationTarget.USERS,
        branchId: branch.id,
        userIds: admins.map((a) => a.id),
      });
    }
    return { ok: true, branch: branch.name };
  }

  async list(user: AuthUser, q: { status?: EnrollmentStatus; q?: string; branchId?: string; page?: string }) {
    const { page, limit, skip } = paginate({ page: q.page, limit: 20 });
    const qb = this.repo
      .createQueryBuilder('e')
      .leftJoinAndSelect('e.branch', 'b')
      // Yang baru & sedang dihubungi di atas
      .addSelect("CASE e.status WHEN 'BARU' THEN 0 WHEN 'DIHUBUNGI' THEN 1 ELSE 2 END", 'prio')
      .orderBy('prio', 'ASC')
      .addOrderBy('e.createdAt', 'DESC')
      .offset(skip)
      .limit(limit);
    const branchIds = scopeBranch(user, q.branchId);
    qb.andWhere('e.branchId IN (:...branchIds)', { branchIds });
    if (q.status) qb.andWhere('e.status = :status', { status: q.status });
    if (q.q) qb.andWhere('(e.studentName ILIKE :q OR e.parentName ILIKE :q OR e.parentPhone ILIKE :q)', { q: `%${q.q}%` });
    const [data, total] = await qb.getManyAndCount();
    const counts = await this.repo
      .createQueryBuilder('e')
      .select('e.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .where('e.branchId IN (:...branchIds)', { branchIds })
      .groupBy('e.status')
      .getRawMany();
    return { data, total, page, limit, counts: Object.fromEntries(counts.map((c) => [c.status, Number(c.count)])) };
  }

  private async get(id: string) {
    const e = await this.repo.findOne({ where: { id }, relations: { branch: true } });
    if (!e) throw new NotFoundException('Pendaftaran tidak ditemukan');
    return e;
  }

  async update(user: AuthUser, id: string, dto: UpdateEnrollmentDto) {
    const e = await this.get(id);
    assertBranch(user, e.branchId);
    if (e.status === EnrollmentStatus.DITERIMA && dto.status && dto.status !== EnrollmentStatus.DITERIMA) {
      throw new BadRequestException('Pendaftaran yang sudah diterima tidak dapat diubah statusnya');
    }
    if (dto.status === EnrollmentStatus.DITERIMA) throw new BadRequestException('Gunakan tombol Terima untuk membuat akun');
    await this.repo.update(id, { ...dto, handledById: user.id });
    return this.get(id);
  }

  /** Terima pendaftaran: buat/tautkan akun orang tua, buat akun pelajar, opsional masukkan ke kelas */
  async accept(user: AuthUser, id: string, dto: AcceptEnrollmentDto) {
    const e = await this.repo
      .createQueryBuilder('e')
      .addSelect('e.passwordHash')
      .leftJoinAndSelect('e.branch', 'b')
      .leftJoinAndSelect('b.organization', 'o')
      .where('e.id = :id', { id })
      .getOne();
    if (!e) throw new NotFoundException('Pendaftaran tidak ditemukan');
    assertBranch(user, e.branchId);
    const org = e.branch.organization;
    if (e.status === EnrollmentStatus.DITERIMA) throw new BadRequestException('Pendaftaran ini sudah diterima');
    let cls: ClassRoom | null = null;
    if (dto.classId) {
      cls = await this.classes.findOne({ where: { id: dto.classId }, relations: { students: true } });
      if (!cls || cls.branchId !== e.branchId) throw new BadRequestException('Kelas tidak valid untuk cabang ini');
    }

    const result = await this.ds.transaction(async (m) => {
      const users = m.getRepository(User);
      let parent = await users.findOneBy({ email: e.parentEmail, organizationId: org.id });
      if (parent && parent.role !== Role.PARENT) throw new ConflictException('Email orang tua sudah dipakai akun lain');
      const parentCreated = !parent;
      if (!parent) {
        parent = await users.save(
          users.create({ name: e.parentName, email: e.parentEmail, phone: e.parentPhone, role: Role.PARENT, organizationId: org.id, branchId: e.branchId, password: e.passwordHash }),
        );
      }
      let studentEmail = e.studentEmail;
      if (!studentEmail || (await users.exists({ where: { email: studentEmail, organizationId: org.id } }))) {
        studentEmail = `${slugify(e.studentName).replace(/-/g, '.') || 'siswa'}.${randomSuffix()}@${org.slug}.siswa.id`;
      }
      const student = await users.save(
        users.create({
          name: e.studentName,
          email: studentEmail,
          role: Role.STUDENT,
          organizationId: org.id,
          branchId: e.branchId,
          parentId: parent.id,
          birthDate: e.studentBirthDate,
          school: e.studentSchool,
          level: e.program,
          password: e.passwordHash,
        }),
      );
      if (cls) {
        cls.students.push(student);
        await m.getRepository(ClassRoom).save(cls);
      }
      await m.getRepository(Enrollment).update(e.id, {
        status: EnrollmentStatus.DITERIMA,
        studentId: student.id,
        parentId: parent.id,
        handledById: user.id,
        ...(dto.adminNote ? { adminNote: dto.adminNote } : {}),
      });
      return { parent, student, parentCreated };
    });

    await this.notifications.send({
      title: `Selamat datang di ${org.name}! 🎉`,
      body:
        `Pendaftaran ${result.student.name} telah diterima${cls ? ` di kelas ${cls.name}` : ''}. ` +
        `Akun pelajar: ${result.student.email} (password sama dengan saat mendaftar).`,
      target: NotificationTarget.USERS,
      branchId: e.branchId,
      userIds: [result.parent.id],
      createdById: user.id,
    });
    return {
      ...(await this.get(id)),
      accounts: {
        parentEmail: result.parent.email,
        parentCreated: result.parentCreated,
        studentEmail: result.student.email,
        className: cls?.name ?? null,
      },
    };
  }

  async newCount(user: AuthUser, requested?: string) {
    return { count: await this.repo.count({ where: { status: EnrollmentStatus.BARU, branchId: In(scopeBranch(user, requested)) } }) };
  }
}

/** Publik: formulir pendaftaran siswa baru */
@Controller('enrollments')
export class EnrollmentsController {
  constructor(private svc: EnrollmentsService) {}
  @Post() submit(@CurrentOrg() org: Organization, @Body() dto: EnrollDto) {
    return this.svc.submit(org, dto);
  }
}

@Controller('admin/enrollments')
@Auth(...ADMIN_ROLES)
export class AdminEnrollmentsController {
  constructor(private svc: EnrollmentsService) {}
  @Get() list(@CurrentUser() u: AuthUser, @Query() q: Record<string, string>) {
    return this.svc.list(u, q as never);
  }
  @Get('new-count') count(@CurrentUser() u: AuthUser, @Query('branchId') branchId?: string) {
    return this.svc.newCount(u, branchId);
  }
  @Patch(':id') update(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateEnrollmentDto) {
    return this.svc.update(u, id, dto);
  }
  @Post(':id/accept') accept(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: AcceptEnrollmentDto) {
    return this.svc.accept(u, id, dto);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Enrollment, User, Branch, ClassRoom]), NotificationsModule],
  controllers: [EnrollmentsController, AdminEnrollmentsController],
  providers: [EnrollmentsService],
})
export class EnrollmentsModule {}
