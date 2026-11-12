import {
  BadRequestException, Body, Controller, Get, Injectable, Logger, Module, NotFoundException, OnApplicationBootstrap, Param, ParseUUIDPipe, Post,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize, IsArray, IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min, MinLength, ValidateIf, ValidateNested,
} from 'class-validator';
import { In, LessThan, Repository } from 'typeorm';
import { InvoiceItem, InvoiceStatus, NotificationTarget, Organization, PlatformInvoice, PlatformSetting, Role, User } from '../entities';
import { Auth, AuthUser, CurrentUser } from '../common/auth';
import { PLATFORM_NAME } from '../common/tenant';
import { addDays, clean, rupiah, todayLocal } from '../common/util';
import { NotificationsModule, NotificationsService } from '../notifications/notifications';

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
/** Periode bulanan "YYYY-MM" → "November 2026"; tahunan "YYYY" → "Tahun 2027" */
export const periodLabel = (p: string) => (p.length === 4 ? `Tahun ${p}` : `${MONTHS[Number(p.slice(5, 7)) - 1]} ${p.slice(0, 4)}`);
const pad = (n: number) => String(n).padStart(2, '0');
type Cycle = Pick<Organization, 'billingCycle' | 'dueDay' | 'dueMonth'>;
/** Tanggal jatuh tempo untuk satu periode */
const dueDateOf = (o: Cycle, p: string) => (o.billingCycle === 'YEARLY' ? `${p}-${pad(o.dueMonth)}-${pad(o.dueDay)}` : `${p}-${pad(o.dueDay)}`);
/** Periode berjalan & berikutnya */
const periodsAround = (o: Cycle, today: string) =>
  o.billingCycle === 'YEARLY' ? [today.slice(0, 4), String(Number(today.slice(0, 4)) + 1)] : [today.slice(0, 7), nextPeriod(today.slice(0, 7))];
const fmtDate = (d: string) => `${Number(d.slice(8, 10))} ${MONTHS[Number(d.slice(5, 7)) - 1]} ${d.slice(0, 4)}`;
const nextPeriod = (p: string) => {
  const y = Number(p.slice(0, 4));
  const m = Number(p.slice(5, 7));
  return m === 12 ? `${y + 1}-01` : `${y}-${String(m + 1).padStart(2, '0')}`;
};
const PERIOD = /^\d{4}-(0[1-9]|1[0-2])$/;
const PERIOD_ANY = /^\d{4}(-(0[1-9]|1[0-2]))?$/;

// ---------------------------------------------------------------- DTO

export class SubscriptionDto {
  @IsOptional() @IsBoolean() subscriptionEnabled?: boolean;
  @IsOptional() @IsIn(['MONTHLY', 'YEARLY']) billingCycle?: 'MONTHLY' | 'YEARLY';
  @IsOptional() @IsInt() @Min(1) @Max(12) dueMonth?: number;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(60) planName?: string | null;
  @IsOptional() @IsInt() @Min(0) baseFee?: number;
  @IsOptional() @IsInt() @Min(0) perStudentFee?: number;
  @IsOptional() @IsInt() @Min(1) @Max(28) dueDay?: number;
  @IsOptional() @IsInt() @Min(0) @Max(60) invoiceLeadDays?: number;
  @IsOptional() @ValidateIf((_, v) => v !== null) @Matches(PERIOD, { message: 'Periode mulai harus format YYYY-MM' }) subscriptionStart?: string | null;
}

class BankAccountDto {
  @IsString() @MinLength(2) bank: string;
  @IsString() @MinLength(3) number: string;
  @IsString() @MinLength(2) holder: string;
}

export class BillingSettingsDto {
  @IsArray() @ArrayMaxSize(5) @ValidateNested({ each: true }) @Type(() => BankAccountDto) bankAccounts: BankAccountDto[];
  @IsOptional() @IsString() @MaxLength(1000) instructions?: string;
}

export class GenerateInvoiceDto {
  /** YYYY-MM (bulanan) atau YYYY (tahunan) */
  @IsOptional() @Matches(PERIOD_ANY, { message: 'Periode harus format YYYY-MM (bulanan) atau YYYY (tahunan)' }) period?: string;
}

export class VerifyInvoiceDto {
  @IsBoolean() approve: boolean;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

export class UpdateInvoiceDto {
  @IsOptional() @IsIn([InvoiceStatus.BELUM_BAYAR, InvoiceStatus.LUNAS, InvoiceStatus.BATAL]) status?: InvoiceStatus;
  @IsOptional() @ValidateIf((_, v) => v !== null) @IsString() @MaxLength(1000) note?: string | null;
}

export class InvoiceProofDto {
  @IsString() @MinLength(5) proofUrl: string;
  @IsOptional() @IsString() @MaxLength(500) proofNote?: string;
}

export interface BillingSettings {
  bankAccounts: { bank: string; number: string; holder: string }[];
  instructions: string;
}

// ---------------------------------------------------------------- service

@Injectable()
export class SubscriptionsService {
  private log = new Logger('Langganan');

  constructor(
    @InjectRepository(PlatformInvoice) private invoices: Repository<PlatformInvoice>,
    @InjectRepository(PlatformSetting) private settings: Repository<PlatformSetting>,
    @InjectRepository(Organization) private orgs: Repository<Organization>,
    @InjectRepository(User) private users: Repository<User>,
    private notifications: NotificationsService,
  ) {}

  // ----- pengaturan rekening platform

  async billingSettings(): Promise<BillingSettings> {
    const s = await this.settings.findOneBy({ key: 'billing' });
    const v = (s?.value ?? {}) as Partial<BillingSettings>;
    return { bankAccounts: v.bankAccounts ?? [], instructions: v.instructions ?? '' };
  }

  async saveBillingSettings(dto: BillingSettingsDto) {
    await this.settings.save({ key: 'billing', value: { bankAccounts: dto.bankAccounts, instructions: dto.instructions ?? '' } });
    return this.billingSettings();
  }

  // ----- pengaturan langganan per lembaga

  async updateSubscription(orgId: string, dto: SubscriptionDto) {
    const o = await this.orgs.findOneBy({ id: orgId });
    if (!o) throw new NotFoundException('Lembaga tidak ditemukan');
    const patch = clean(dto) as Partial<Organization>;
    if (dto.planName === '') patch.planName = null;
    // Saat pertama diaktifkan tanpa periode mulai: mulai bulan berjalan
    if (dto.subscriptionEnabled && !o.subscriptionStart && !dto.subscriptionStart) patch.subscriptionStart = todayLocal().slice(0, 7);
    await this.orgs.update(orgId, patch);
    return this.orgs.findOneBy({ id: orgId });
  }

  private activeStudents(orgId: string) {
    return this.users.countBy({ organizationId: orgId, role: Role.STUDENT, isActive: true });
  }

  /** Rincian tagihan berdasarkan pengaturan saat ini */
  private async buildItems(o: Organization, period: string): Promise<InvoiceItem[]> {
    const items: InvoiceItem[] = [];
    const plan = o.planName || `Langganan ${PLATFORM_NAME}`;
    if (o.baseFee > 0) items.push({ description: `${plan} — ${periodLabel(period)}`, qty: 1, unitPrice: o.baseFee, amount: o.baseFee });
    if (o.perStudentFee > 0) {
      const n = await this.activeStudents(o.id);
      if (n > 0) items.push({ description: `Pelajar aktif — ${periodLabel(period)}`, qty: n, unitPrice: o.perStudentFee, amount: n * o.perStudentFee });
    }
    return items;
  }

  async estimate(o: Organization) {
    const items = await this.buildItems(o, periodsAround(o, todayLocal())[0]);
    return { activeStudents: await this.activeStudents(o.id), amount: items.reduce((s, i) => s + i.amount, 0) };
  }

  private async nextNumber(period: string) {
    const n = await this.invoices.countBy({ period });
    // Bulanan: NFS-202611-0001 · Tahunan: NFS-2027-0001
    return `NFS-${period.replace('-', '')}-${String(n + 1).padStart(4, '0')}`;
  }

  private async admins(orgId: string) {
    return (await this.users.find({ where: { organizationId: orgId, role: Role.SUPER_ADMIN, isActive: true }, select: ['id'] })).map((u) => u.id);
  }

  private async notify(orgId: string, title: string, body: string) {
    const userIds = await this.admins(orgId);
    if (userIds.length) await this.notifications.send({ title, body, target: NotificationTarget.USERS, branchId: null, userIds });
  }

  /** Buat tagihan satu periode. Mengembalikan null bila sudah ada / nominal 0 (mode otomatis). */
  async createInvoice(o: Organization, period: string, opts: { manual?: boolean } = {}) {
    const existing = await this.invoices.findOneBy({ organizationId: o.id, period });
    if (existing) {
      if (opts.manual) throw new BadRequestException(`Tagihan periode ${periodLabel(period)} sudah ada (${existing.number})`);
      return null;
    }
    const items = await this.buildItems(o, period);
    const amount = items.reduce((s, i) => s + i.amount, 0);
    if (amount <= 0) {
      if (opts.manual) throw new BadRequestException('Nominal tagihan Rp 0 — isi biaya langganan terlebih dahulu');
      return null;
    }
    const today = todayLocal();
    let dueDate = dueDateOf(o, period);
    if (dueDate < today) dueDate = addDays(today, Math.max(3, o.invoiceLeadDays));
    for (let attempt = 0; ; attempt++) {
      try {
        const inv = await this.invoices.save(
          this.invoices.create({ organizationId: o.id, period, number: await this.nextNumber(period), issueDate: today, dueDate, items, amount }),
        );
        await this.notify(
          o.id,
          `Tagihan ${PLATFORM_NAME} ${periodLabel(period)}`,
          `Tagihan langganan sistem ${inv.number} sebesar ${rupiah(amount)}, jatuh tempo ${fmtDate(dueDate)}. Lihat di menu Langganan Sistem.`,
        );
        return inv;
      } catch (e) {
        if (attempt >= 3) throw e; // nomor bentrok (jarang) — coba lagi
      }
    }
  }

  /** Terbitkan manual (tombol di panel). Tanpa periode: periode terdekat yang belum lewat jatuh tempo. */
  async generateNow(orgId: string, period?: string) {
    const o = await this.orgs.findOneBy({ id: orgId });
    if (!o) throw new NotFoundException('Lembaga tidak ditemukan');
    const today = todayLocal();
    const yearly = o.billingCycle === 'YEARLY';
    let p = period;
    if (p && p.length !== (yearly ? 4 : 7)) throw new BadRequestException(yearly ? 'Siklus tahunan: periode berupa tahun (YYYY)' : 'Siklus bulanan: periode berupa bulan (YYYY-MM)');
    if (!p) {
      const [cur, next] = periodsAround(o, today);
      p = dueDateOf(o, cur) >= today ? cur : next;
    }
    return this.createInvoice(o, p, { manual: true });
  }

  /** Harian: terbitkan tagihan yang sudah masuk jendela terbit, kirim pengingat */
  async runDaily() {
    const today = todayLocal();
    const orgs = await this.orgs.find({ where: { subscriptionEnabled: true, isActive: true } });
    let created = 0;
    for (const o of orgs) {
      for (const p of periodsAround(o, today)) {
        // Periode mulai (YYYY-MM): tahunan dibandingkan per tahun
        if (o.subscriptionStart && p < o.subscriptionStart.slice(0, p.length)) continue;
        const due = dueDateOf(o, p);
        // Hanya periode yang jatuh temponya belum lewat & sudah masuk jendela terbit (H-invoiceLeadDays)
        if (due < today || addDays(due, -o.invoiceLeadDays) > today) continue;
        if (await this.createInvoice(o, p)) created++;
      }
    }
    // Pengingat H-3
    const soon = await this.invoices.find({ where: { status: InvoiceStatus.BELUM_BAYAR } });
    let reminded = 0;
    for (const inv of soon) {
      if (inv.remindedDueSoonAt || inv.dueDate < today || inv.dueDate > addDays(today, 3)) continue;
      await this.notify(inv.organizationId, `Tagihan ${PLATFORM_NAME} jatuh tempo ${fmtDate(inv.dueDate)}`, `${inv.number} sebesar ${rupiah(inv.amount)} belum dibayar.`);
      await this.invoices.update(inv.id, { remindedDueSoonAt: new Date() });
      reminded++;
    }
    // Lewat jatuh tempo (sekali)
    const overdue = await this.invoices.find({ where: { status: InvoiceStatus.BELUM_BAYAR, dueDate: LessThan(today) } });
    for (const inv of overdue) {
      if (inv.remindedOverdueAt) continue;
      await this.notify(inv.organizationId, `Tagihan ${PLATFORM_NAME} lewat jatuh tempo`, `${inv.number} sebesar ${rupiah(inv.amount)} jatuh tempo ${fmtDate(inv.dueDate)}. Mohon segera dibayar.`);
      await this.invoices.update(inv.id, { remindedOverdueAt: new Date() });
      reminded++;
    }
    if (created || reminded) this.log.log(`${created} tagihan langganan dibuat, ${reminded} pengingat dikirim`);
    return { created, reminded };
  }

  // ----- sisi pengelola platform

  async list(q: { status?: string; orgId?: string }) {
    const qb = this.invoices
      .createQueryBuilder('i')
      .leftJoin('i.organization', 'o')
      .addSelect(['o.id', 'o.name', 'o.slug', 'o.logoUrl', 'o.brandColor'])
      // Yang perlu verifikasi & belum dibayar di atas
      .addSelect("CASE i.status WHEN 'MENUNGGU' THEN 0 WHEN 'BELUM_BAYAR' THEN 1 ELSE 2 END", 'prio')
      .orderBy('prio', 'ASC')
      .addOrderBy('i.dueDate', 'DESC')
      .limit(300);
    if (q.status && q.status in InvoiceStatus) qb.andWhere('i.status = :s', { s: q.status });
    if (q.status === 'TERLAMBAT') qb.andWhere('i.status = :s AND i.dueDate < :t', { s: InvoiceStatus.BELUM_BAYAR, t: todayLocal() });
    if (q.orgId) qb.andWhere('i.organizationId = :org', { org: q.orgId });
    return qb.getMany();
  }

  async counts() {
    const today = todayLocal();
    const [waiting, unpaid, overdue] = await Promise.all([
      this.invoices.countBy({ status: InvoiceStatus.MENUNGGU }),
      this.invoices.countBy({ status: InvoiceStatus.BELUM_BAYAR }),
      this.invoices.countBy({ status: InvoiceStatus.BELUM_BAYAR, dueDate: LessThan(today) }),
    ]);
    return { waiting, unpaid, overdue };
  }

  private async get(id: string) {
    const inv = await this.invoices.findOneBy({ id });
    if (!inv) throw new NotFoundException('Tagihan tidak ditemukan');
    return inv;
  }

  async verify(adminId: string, id: string, dto: VerifyInvoiceDto) {
    const inv = await this.get(id);
    if (inv.status !== InvoiceStatus.MENUNGGU) throw new BadRequestException('Tagihan ini tidak sedang menunggu verifikasi');
    if (dto.approve) {
      await this.invoices.update(id, { status: InvoiceStatus.LUNAS, paidAt: new Date(), verifiedById: adminId, rejectReason: null });
      await this.notify(inv.organizationId, `Pembayaran ${inv.number} diterima ✅`, `Terima kasih. Tagihan ${periodLabel(inv.period)} sebesar ${rupiah(inv.amount)} sudah lunas.`);
    } else {
      if (!dto.reason) throw new BadRequestException('Isi alasan penolakan');
      await this.invoices.update(id, { status: InvoiceStatus.BELUM_BAYAR, rejectReason: dto.reason, verifiedById: adminId });
      await this.notify(inv.organizationId, `Bukti pembayaran ${inv.number} ditolak`, `Alasan: ${dto.reason}. Silakan unggah ulang bukti transfer.`);
    }
    return this.get(id);
  }

  async update(adminId: string, id: string, dto: UpdateInvoiceDto) {
    await this.get(id);
    const patch: Partial<PlatformInvoice> = {};
    if (dto.note !== undefined) patch.note = dto.note || null;
    if (dto.status) {
      patch.status = dto.status;
      if (dto.status === InvoiceStatus.LUNAS) Object.assign(patch, { paidAt: new Date(), verifiedById: adminId });
      if (dto.status === InvoiceStatus.BELUM_BAYAR) patch.paidAt = null;
    }
    await this.invoices.update(id, patch);
    return this.get(id);
  }

  // ----- sisi lembaga (Super Admin klien)

  async forOrg(orgId: string) {
    const o = await this.orgs.findOneBy({ id: orgId });
    if (!o) throw new NotFoundException();
    const invoices = await this.invoices.find({ where: { organizationId: orgId, status: In([InvoiceStatus.BELUM_BAYAR, InvoiceStatus.MENUNGGU, InvoiceStatus.LUNAS]) }, order: { period: 'DESC' } });
    return {
      platformName: PLATFORM_NAME,
      enabled: o.subscriptionEnabled,
      billingCycle: o.billingCycle,
      dueMonth: o.dueMonth,
      planName: o.planName,
      baseFee: o.baseFee,
      perStudentFee: o.perStudentFee,
      dueDay: o.dueDay,
      ...(await this.estimate(o)),
      today: todayLocal(),
      invoices,
      ...(await this.billingSettings()),
    };
  }

  async uploadProof(orgId: string, id: string, dto: InvoiceProofDto) {
    const inv = await this.invoices.findOneBy({ id, organizationId: orgId });
    if (!inv) throw new NotFoundException('Tagihan tidak ditemukan');
    if (inv.status !== InvoiceStatus.BELUM_BAYAR && inv.status !== InvoiceStatus.MENUNGGU) throw new BadRequestException('Tagihan ini sudah lunas / dibatalkan');
    await this.invoices.update(id, { proofUrl: dto.proofUrl, proofNote: dto.proofNote ?? null, proofUploadedAt: new Date(), status: InvoiceStatus.MENUNGGU, rejectReason: null });
    return this.invoices.findOneBy({ id });
  }
}

/** Tagihan langganan dibuat & diingatkan setiap hari 06.10 WIB (dan saat API start) */
@Injectable()
export class SubscriptionScheduler implements OnApplicationBootstrap {
  private log = new Logger('Langganan');
  constructor(private svc: SubscriptionsService) {}

  onApplicationBootstrap() {
    if (process.env.BILLING_SCHEDULER === 'false') return;
    setTimeout(() => this.run(), 7000);
  }

  @Cron('10 6 * * *', { timeZone: process.env.TZ_APP || 'Asia/Jakarta' })
  async run() {
    if (process.env.BILLING_SCHEDULER === 'false') return;
    try {
      await this.svc.runDaily();
    } catch (e) {
      this.log.error(`Gagal menjalankan tagihan langganan: ${(e as Error).message}`);
    }
  }
}

/** Super Admin lembaga: tagihan langganan sistem */
@Controller('admin/subscription')
@Auth(Role.SUPER_ADMIN)
export class OrgSubscriptionController {
  constructor(private svc: SubscriptionsService) {}

  @Get() get(@CurrentUser() u: AuthUser) {
    return this.svc.forOrg(u.organizationId);
  }

  @Post('invoices/:id/proof') proof(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: InvoiceProofDto) {
    return this.svc.uploadProof(u.organizationId, id, dto);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([PlatformInvoice, PlatformSetting, Organization, User]), NotificationsModule],
  controllers: [OrgSubscriptionController],
  providers: [SubscriptionsService, SubscriptionScheduler],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
