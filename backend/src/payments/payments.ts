import {
  BadRequestException, Body, Controller, Delete, ForbiddenException, Get, Injectable, Logger, Module, NotFoundException, OnApplicationBootstrap,
  Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength,
  ValidateNested,
} from 'class-validator';
import { In, LessThan, LessThanOrEqual, Repository } from 'typeorm';
import { Branch, NotificationTarget, Payment, PaymentSource, PaymentStatus, Role, User } from '../entities';
import { assertBranch, Auth, AuthUser, CurrentUser, FINANCE_ROLES, requireBranch, scopeBranch } from '../common/auth';
import { addDays, clean, paginate, rupiah, todayLocal } from '../common/util';
import { NotificationsModule, NotificationsService } from '../notifications/notifications';

// ---------------------------------------------------------------- DTO

export class CreatePaymentDto {
  @IsUUID() studentId: string;
  @Matches(/^\d{4}-\d{2}$/, { message: 'Periode harus berformat YYYY-MM' }) period: string;
  @IsString() description: string;
  @IsInt() @Min(0) amount: number;
  @IsOptional() @IsEnum(PaymentStatus) status?: PaymentStatus;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsString() method?: string;
  @IsOptional() @IsString() note?: string;
}

export class UpdatePaymentDto {
  @IsOptional() @Matches(/^\d{4}-\d{2}$/) period?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsInt() @Min(0) amount?: number;
  @IsOptional() @IsEnum(PaymentStatus) status?: PaymentStatus;
  @IsOptional() @IsDateString() dueDate?: string;
  @IsOptional() @IsDateString() paidAt?: string;
  @IsOptional() @IsString() method?: string;
  @IsOptional() @IsString() note?: string;
}

export class VerifyPaymentDto {
  @IsBoolean() approve: boolean;
  /** Wajib saat menolak */
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
  @IsOptional() @IsString() method?: string;
}

export class UploadProofDto {
  @IsString() @MaxLength(500) proofUrl: string;
  @IsOptional() @IsString() @MaxLength(100) method?: string;
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

class BankAccountDto {
  @IsString() @MinLength(2) bank: string;
  @IsString() @MinLength(4) number: string;
  @IsString() @MinLength(2) holder: string;
}

export class BillingSettingsDto {
  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @IsBoolean() billingEnabled?: boolean;
  @IsOptional() @IsInt() @Min(1) @Max(28) billingDay?: number;
  @IsOptional() @IsInt() @Min(0) billingAmount?: number;
  @IsOptional() @IsString() @MinLength(2) billingDescription?: string;
  @IsOptional() @IsInt() @Min(0) @Max(60) billingDueDays?: number;
  @IsOptional() @IsArray() @ArrayMaxSize(5) @ValidateNested({ each: true }) @Type(() => BankAccountDto) bankAccounts?: BankAccountDto[];
  @IsOptional() @IsString() @MaxLength(1000) paymentInstructions?: string;
}

const BILLING_FIELDS = [
  'id', 'name', 'billingEnabled', 'billingDay', 'billingAmount', 'billingDescription', 'billingDueDays', 'bankAccounts', 'paymentInstructions',
] as const;

// ---------------------------------------------------------------- Service

@Injectable()
export class PaymentsService {
  private log = new Logger('Tagihan');

  constructor(
    @InjectRepository(Payment) private repo: Repository<Payment>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(Branch) private branches: Repository<Branch>,
    private notifications: NotificationsService,
  ) {}

  // ----- daftar & CRUD manual

  async list(
    actor: AuthUser,
    q: { branchId?: string; status?: PaymentStatus; period?: string; q?: string; studentId?: string; source?: PaymentSource; page?: string },
  ) {
    const { page, limit, skip } = paginate({ page: q.page, limit: 20 });
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoin('p.student', 's')
      .addSelect(['s.id', 's.name', 's.parentId', 's.avatarUrl'])
      .leftJoin('s.parent', 'par')
      .addSelect(['par.id', 'par.name', 'par.phone'])
      .leftJoin('p.verifiedBy', 'vb')
      .addSelect(['vb.id', 'vb.name'])
      .skip(skip)
      .take(limit);
    // Antrian verifikasi: yang paling lama menunggu di atas
    if (q.status === PaymentStatus.MENUNGGU) qb.orderBy('p.proofUploadedAt', 'ASC', 'NULLS LAST');
    else qb.orderBy('p.period', 'DESC').addOrderBy('s.name', 'ASC');
    const branchIds = scopeBranch(actor, q.branchId);
    qb.andWhere('p.branchId IN (:...branchIds)', { branchIds });
    if (q.status) qb.andWhere('p.status = :status', { status: q.status });
    if (q.source) qb.andWhere('p.source = :source', { source: q.source });
    if (q.period) qb.andWhere('p.period = :period', { period: q.period });
    if (q.studentId) qb.andWhere('p.studentId = :studentId', { studentId: q.studentId });
    if (q.q) qb.andWhere('(s.name ILIKE :q OR p.description ILIKE :q)', { q: `%${q.q}%` });
    const [data, total] = await qb.getManyAndCount();

    const summaryQb = this.repo
      .createQueryBuilder('p')
      .select('p.status', 'status')
      .addSelect('SUM(p.amount)', 'amount')
      .addSelect('COUNT(*)', 'count')
      .groupBy('p.status');
    summaryQb.where('p.branchId IN (:...branchIds)', { branchIds });
    if (q.period) summaryQb.andWhere('p.period = :period', { period: q.period });
    const summary = (await summaryQb.getRawMany()).map((r) => ({ status: r.status, amount: Number(r.amount), count: Number(r.count) }));
    return { data, total, page, limit, summary };
  }

  async pendingCount(actor: AuthUser, requested?: string) {
    const count = await this.repo.count({ where: { status: PaymentStatus.MENUNGGU, branchId: In(scopeBranch(actor, requested)) } });
    return { count };
  }

  private async get(id: string) {
    const p = await this.repo.findOne({ where: { id }, relations: { student: true } });
    if (!p) throw new NotFoundException('Data pembayaran tidak ditemukan');
    return p;
  }

  private async notifyParent(p: Payment, student: User, title: string, body: string, createdById: string | null) {
    if (!student.parentId) return;
    await this.notifications.send({
      title,
      body,
      target: NotificationTarget.USERS,
      branchId: p.branchId,
      userIds: [student.parentId],
      createdById,
    });
  }

  async create(actor: AuthUser, dto: CreatePaymentDto) {
    const student = await this.users.findOneBy({ id: dto.studentId });
    if (!student || student.role !== Role.STUDENT) throw new BadRequestException('Pelajar tidak valid');
    assertBranch(actor, student.branchId);
    const status = dto.status ?? PaymentStatus.BELUM_BAYAR;
    const p = await this.repo.save(
      this.repo.create({
        ...dto,
        status,
        source: PaymentSource.MANUAL,
        branchId: student.branchId!,
        paidAt: status === PaymentStatus.LUNAS ? new Date() : null,
        ...(status === PaymentStatus.LUNAS ? { verifiedById: actor.id, verifiedAt: new Date() } : {}),
      }),
    );
    await this.notifyParent(p, student, `Tagihan baru: ${p.description}`, `Tagihan ${student.name} periode ${p.period} sebesar ${rupiah(p.amount)}.`, actor.id);
    return p;
  }

  async update(actor: AuthUser, id: string, dto: UpdatePaymentDto) {
    const p = await this.get(id);
    assertBranch(actor, p.branchId);
    const patch: Partial<Payment> = clean({ ...dto, paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined }) as Partial<Payment>;
    if (dto.status === PaymentStatus.LUNAS && p.status !== PaymentStatus.LUNAS) {
      if (!dto.paidAt) patch.paidAt = new Date();
      patch.verifiedById = actor.id;
      patch.verifiedAt = new Date();
    }
    if (dto.status && dto.status !== PaymentStatus.LUNAS) patch.paidAt = null;
    await this.repo.update(id, patch);
    const updated = await this.get(id);
    if (dto.status && dto.status !== p.status) {
      const label = { LUNAS: 'Lunas', MENUNGGU: 'Menunggu verifikasi', BELUM_BAYAR: 'Belum dibayar' }[dto.status];
      await this.notifyParent(
        updated,
        updated.student,
        `Status pembayaran: ${label}`,
        `${updated.description} (${updated.period}) untuk ${updated.student.name} kini berstatus ${label}.`,
        actor.id,
      );
    }
    return updated;
  }

  async remove(actor: AuthUser, id: string) {
    const p = await this.get(id);
    assertBranch(actor, p.branchId);
    await this.repo.delete(id);
    return { ok: true };
  }

  // ----- bukti bayar (orang tua) & verifikasi (admin/keuangan)

  async uploadProof(parentId: string, id: string, dto: UploadProofDto) {
    const p = await this.get(id);
    if (p.student.parentId !== parentId) throw new ForbiddenException('Tagihan ini bukan milik anak Anda');
    if (p.status === PaymentStatus.LUNAS) throw new BadRequestException('Tagihan ini sudah lunas');
    await this.repo.update(id, {
      proofUrl: dto.proofUrl,
      proofNote: dto.note ?? null,
      method: dto.method ?? p.method,
      proofUploadedAt: new Date(),
      status: PaymentStatus.MENUNGGU,
      rejectionReason: null,
    });
    return this.get(id).then(({ student, ...rest }) => ({ ...rest, student: { id: student.id, name: student.name } }));
  }

  async verify(actor: AuthUser, id: string, dto: VerifyPaymentDto) {
    const p = await this.get(id);
    assertBranch(actor, p.branchId);
    if (p.status === PaymentStatus.LUNAS) throw new BadRequestException('Tagihan ini sudah lunas');
    if (dto.approve) {
      await this.repo.update(id, {
        status: PaymentStatus.LUNAS,
        paidAt: new Date(),
        verifiedById: actor.id,
        verifiedAt: new Date(),
        rejectionReason: null,
        ...(dto.method ? { method: dto.method } : {}),
      });
      await this.notifyParent(
        p,
        p.student,
        'Pembayaran diterima ✅',
        `Pembayaran ${p.description} (${p.period}) untuk ${p.student.name} sebesar ${rupiah(p.amount)} sudah diverifikasi. Terima kasih!`,
        actor.id,
      );
    } else {
      if (!dto.reason?.trim()) throw new BadRequestException('Tuliskan alasan penolakan agar orang tua bisa memperbaiki');
      await this.repo.update(id, { status: PaymentStatus.BELUM_BAYAR, rejectionReason: dto.reason.trim(), verifiedById: actor.id, verifiedAt: new Date() });
      await this.notifyParent(
        p,
        p.student,
        'Bukti pembayaran perlu diperbaiki',
        `Bukti pembayaran ${p.description} (${p.period}) untuk ${p.student.name} belum dapat diterima: ${dto.reason.trim()}. Silakan unggah ulang bukti yang benar.`,
        actor.id,
      );
    }
    return this.get(id);
  }

  // ----- pengaturan tagihan otomatis

  async getSettings(actor: AuthUser, requested?: string) {
    const branchId = requireBranch(actor, requested);
    const b = await this.branches.findOne({ where: { id: branchId }, select: [...BILLING_FIELDS] });
    if (!b) throw new NotFoundException('Cabang tidak ditemukan');
    const today = todayLocal();
    const period = today.slice(0, 7);
    const students = await this.users.find({ where: { branchId, role: Role.STUDENT, isActive: true }, select: ['id', 'name', 'monthlyFee'] });
    const generated = await this.repo.count({ where: { branchId, period, source: PaymentSource.AUTO } });
    return {
      ...b,
      preview: {
        period,
        nextRun: this.nextRunDate(b.billingDay, today),
        activeStudents: students.length,
        customFeeStudents: students.filter((s) => s.monthlyFee != null).length,
        estimatedTotal: students.reduce((sum, s) => sum + (s.monthlyFee ?? b.billingAmount), 0),
        generatedThisPeriod: generated,
      },
    };
  }

  private nextRunDate(day: number, today: string) {
    const [y, m, d] = today.split('-').map(Number);
    if (d <= day) return `${today.slice(0, 7)}-${String(day).padStart(2, '0')}`;
    const next = new Date(Date.UTC(y, m, day));
    return next.toISOString().slice(0, 10);
  }

  async updateSettings(actor: AuthUser, dto: BillingSettingsDto) {
    const branchId = requireBranch(actor, dto.branchId);
    const { branchId: _b, ...rest } = dto;
    await this.branches.update(branchId, clean(rest));
    return this.getSettings(actor, branchId);
  }

  /** Buat tagihan bulan berjalan untuk satu cabang (dipanggil scheduler atau tombol admin) */
  async generateForBranch(branchId: string, opts: { force?: boolean; actorId?: string | null } = {}) {
    const b = await this.branches.findOne({ where: { id: branchId }, select: [...BILLING_FIELDS] });
    if (!b) throw new NotFoundException('Cabang tidak ditemukan');
    const today = todayLocal();
    const period = today.slice(0, 7);
    const day = Number(today.slice(8, 10));
    if (!opts.force && (!b.billingEnabled || day < b.billingDay)) return { created: 0, skipped: 0, period };

    const students = await this.users.find({ where: { branchId, role: Role.STUDENT, isActive: true } });
    const existing = await this.repo.find({ where: { branchId, period, source: PaymentSource.AUTO }, select: ['studentId'] });
    const has = new Set(existing.map((e) => e.studentId));
    const dueDate = addDays(`${period}-${String(b.billingDay).padStart(2, '0')}`, b.billingDueDays);
    const bank = b.bankAccounts?.[0];
    let created = 0;
    let skipped = 0;
    for (const s of students) {
      const amount = s.monthlyFee ?? b.billingAmount;
      if (has.has(s.id) || !amount || amount <= 0) {
        skipped++;
        continue;
      }
      try {
        const p = await this.repo.save(
          this.repo.create({
            studentId: s.id,
            branchId,
            period,
            description: b.billingDescription,
            amount,
            dueDate,
            source: PaymentSource.AUTO,
            status: PaymentStatus.BELUM_BAYAR,
          }),
        );
        created++;
        await this.notifyParent(
          p,
          s,
          `Tagihan ${b.billingDescription} ${period}`,
          `Tagihan ${s.name} sebesar ${rupiah(amount)}, jatuh tempo ${dueDate}.` +
            (bank ? ` Transfer ke ${bank.bank} ${bank.number} a.n. ${bank.holder}, lalu unggah bukti di menu Pembayaran.` : ' Unggah bukti pembayaran di menu Pembayaran.'),
          opts.actorId ?? null,
        );
      } catch {
        // tagihan otomatis periode ini sudah ada (unique index) — abaikan
        skipped++;
      }
    }
    if (created) this.log.log(`${b.name}: ${created} tagihan ${period} dibuat`);
    return { created, skipped, period };
  }

  async generateNow(actor: AuthUser, requested?: string) {
    const branchId = requireBranch(actor, requested);
    return this.generateForBranch(branchId, { force: true, actorId: actor.id });
  }

  /** Pengingat H-3 jatuh tempo & saat terlambat (masing-masing sekali) */
  async sendReminders() {
    const today = todayLocal();
    const soon = await this.repo.find({
      where: { status: PaymentStatus.BELUM_BAYAR, remindedDueSoon: false, dueDate: LessThanOrEqual(addDays(today, 3)) },
      relations: { student: true },
    });
    for (const p of soon.filter((x) => x.dueDate && x.dueDate >= today)) {
      await this.notifyParent(p, p.student, 'Pengingat jatuh tempo', `${p.description} (${p.period}) untuk ${p.student.name} sebesar ${rupiah(p.amount)} jatuh tempo ${p.dueDate}.`, null);
      await this.repo.update(p.id, { remindedDueSoon: true });
    }
    const overdue = await this.repo.find({
      where: { status: PaymentStatus.BELUM_BAYAR, remindedOverdue: false, dueDate: LessThan(today) },
      relations: { student: true },
    });
    for (const p of overdue) {
      await this.notifyParent(p, p.student, 'Tagihan melewati jatuh tempo', `${p.description} (${p.period}) untuk ${p.student.name} sebesar ${rupiah(p.amount)} sudah melewati jatuh tempo ${p.dueDate}. Mohon segera dibayar.`, null);
      await this.repo.update(p.id, { remindedOverdue: true, remindedDueSoon: true });
    }
    return { dueSoon: soon.length, overdue: overdue.length };
  }

  async runDaily() {
    const branches = await this.branches.find({ where: { billingEnabled: true }, select: ['id'] });
    for (const b of branches) await this.generateForBranch(b.id);
    await this.sendReminders();
  }

  // ----- sisi orang tua

  async billingInfo(parentId: string) {
    const kids = await this.users.find({ where: { parentId, role: Role.STUDENT }, select: ['id', 'branchId'] });
    const ids = [...new Set(kids.map((k) => k.branchId).filter((x): x is string => !!x))];
    if (!ids.length) return [];
    return this.branches.find({ where: { id: In(ids) }, select: ['id', 'name', 'bankAccounts', 'paymentInstructions'] });
  }
}

/** Menjalankan tagihan otomatis & pengingat setiap hari jam 06.00 WIB, dan sekali saat aplikasi start */
@Injectable()
export class BillingScheduler implements OnApplicationBootstrap {
  private log = new Logger('Tagihan');
  constructor(private svc: PaymentsService) {}

  onApplicationBootstrap() {
    if (process.env.BILLING_SCHEDULER === 'false') return;
    setTimeout(() => this.run(), 5000);
  }

  @Cron('0 6 * * *', { timeZone: process.env.TZ_APP || 'Asia/Jakarta' })
  async run() {
    if (process.env.BILLING_SCHEDULER === 'false') return;
    try {
      await this.svc.runDaily();
    } catch (e) {
      this.log.error(`Gagal menjalankan tagihan otomatis: ${(e as Error).message}`);
    }
  }
}

// ---------------------------------------------------------------- Controller

@Controller('admin/payments')
@Auth(...FINANCE_ROLES)
export class AdminPaymentsController {
  constructor(private svc: PaymentsService) {}
  @Get() list(@CurrentUser() u: AuthUser, @Query() q: Record<string, string>) {
    return this.svc.list(u, q as never);
  }
  @Get('pending-count') pending(@CurrentUser() u: AuthUser, @Query('branchId') branchId?: string) {
    return this.svc.pendingCount(u, branchId);
  }
  @Post() create(@CurrentUser() u: AuthUser, @Body() dto: CreatePaymentDto) {
    return this.svc.create(u, dto);
  }
  @Patch(':id') update(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePaymentDto) {
    return this.svc.update(u, id, dto);
  }
  @Post(':id/verify') verify(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: VerifyPaymentDto) {
    return this.svc.verify(u, id, dto);
  }
  @Delete(':id') remove(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(u, id);
  }
}

@Controller('admin/billing')
@Auth(...FINANCE_ROLES)
export class AdminBillingController {
  constructor(private svc: PaymentsService) {}
  @Get() get(@CurrentUser() u: AuthUser, @Query('branchId') branchId?: string) {
    return this.svc.getSettings(u, branchId);
  }
  @Patch() update(@CurrentUser() u: AuthUser, @Body() dto: BillingSettingsDto) {
    return this.svc.updateSettings(u, dto);
  }
  /** Buat tagihan bulan ini sekarang juga (tanpa menunggu tanggal tagihan) */
  @Post('generate') generate(@CurrentUser() u: AuthUser, @Body('branchId') branchId?: string) {
    return this.svc.generateNow(u, branchId);
  }
}

@Controller('parent')
@Auth(Role.PARENT)
export class ParentPaymentsController {
  constructor(private svc: PaymentsService) {}
  @Get('billing-info') info(@CurrentUser() u: AuthUser) {
    return this.svc.billingInfo(u.id);
  }
  @Post('payments/:id/proof') proof(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UploadProofDto) {
    return this.svc.uploadProof(u.id, id, dto);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Payment, User, Branch]), NotificationsModule],
  controllers: [AdminPaymentsController, AdminBillingController, ParentPaymentsController],
  providers: [PaymentsService, BillingScheduler],
})
export class PaymentsModule {}

