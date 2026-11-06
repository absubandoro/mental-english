import {
  BadRequestException, Body, Controller, Delete, Get, Injectable, Module, NotFoundException, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsDateString, IsEnum, IsInt, IsOptional, IsString, IsUUID, Matches, Min } from 'class-validator';
import { Repository } from 'typeorm';
import { NotificationTarget, Payment, PaymentStatus, Role, User } from '../entities';
import { ADMIN_ROLES, assertBranch, Auth, AuthUser, CurrentUser, scopeBranch } from '../common/auth';
import { clean, paginate } from '../common/util';
import { NotificationsModule, NotificationsService } from '../notifications/notifications';

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

const rupiah = (n: number) => 'Rp ' + n.toLocaleString('id-ID');

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment) private repo: Repository<Payment>,
    @InjectRepository(User) private users: Repository<User>,
    private notifications: NotificationsService,
  ) {}

  async list(actor: AuthUser, q: { branchId?: string; status?: PaymentStatus; period?: string; q?: string; studentId?: string; page?: string }) {
    const { page, limit, skip } = paginate({ page: q.page, limit: 20 });
    const qb = this.repo
      .createQueryBuilder('p')
      .leftJoin('p.student', 's')
      .addSelect(['s.id', 's.name', 's.parentId'])
      .leftJoin('s.parent', 'par')
      .addSelect(['par.id', 'par.name'])
      .orderBy('p.period', 'DESC')
      .addOrderBy('s.name', 'ASC')
      .skip(skip)
      .take(limit);
    const branchId = scopeBranch(actor, q.branchId);
    if (branchId) qb.andWhere('p.branchId = :branchId', { branchId });
    if (q.status) qb.andWhere('p.status = :status', { status: q.status });
    if (q.period) qb.andWhere('p.period = :period', { period: q.period });
    if (q.studentId) qb.andWhere('p.studentId = :studentId', { studentId: q.studentId });
    if (q.q) qb.andWhere('(s.name ILIKE :q OR p.description ILIKE :q)', { q: `%${q.q}%` });
    const [data, total] = await qb.getManyAndCount();

    const summaryQb = this.repo.createQueryBuilder('p').select('p.status', 'status').addSelect('SUM(p.amount)', 'amount').addSelect('COUNT(*)', 'count').groupBy('p.status');
    if (branchId) summaryQb.where('p.branchId = :branchId', { branchId });
    if (q.period) summaryQb.andWhere('p.period = :period', { period: q.period });
    const summary = (await summaryQb.getRawMany()).map((r) => ({ status: r.status, amount: Number(r.amount), count: Number(r.count) }));
    return { data, total, page, limit, summary };
  }

  private async get(id: string) {
    const p = await this.repo.findOne({ where: { id }, relations: { student: true } });
    if (!p) throw new NotFoundException('Data pembayaran tidak ditemukan');
    return p;
  }

  private async notifyParent(actor: AuthUser, p: Payment, student: User, title: string, body: string) {
    if (!student.parentId) return;
    await this.notifications.send({
      title,
      body,
      target: NotificationTarget.USERS,
      branchId: p.branchId,
      userIds: [student.parentId],
      createdById: actor.id,
    });
  }

  async create(actor: AuthUser, dto: CreatePaymentDto) {
    const student = await this.users.findOneBy({ id: dto.studentId });
    if (!student || student.role !== Role.STUDENT) throw new BadRequestException('Pelajar tidak valid');
    assertBranch(actor, student.branchId);
    const status = dto.status ?? PaymentStatus.BELUM_BAYAR;
    const p = await this.repo.save(
      this.repo.create({ ...dto, status, branchId: student.branchId!, paidAt: status === PaymentStatus.LUNAS ? new Date() : null }),
    );
    await this.notifyParent(actor, p, student, `Tagihan baru: ${p.description}`, `Tagihan ${student.name} periode ${p.period} sebesar ${rupiah(p.amount)}.`);
    return p;
  }

  async update(actor: AuthUser, id: string, dto: UpdatePaymentDto) {
    const p = await this.get(id);
    assertBranch(actor, p.branchId);
    const patch: Partial<Payment> = clean({ ...dto, paidAt: dto.paidAt ? new Date(dto.paidAt) : undefined }) as Partial<Payment>;
    if (dto.status === PaymentStatus.LUNAS && !p.paidAt && !dto.paidAt) patch.paidAt = new Date();
    if (dto.status && dto.status !== PaymentStatus.LUNAS) patch.paidAt = null;
    await this.repo.update(id, patch);
    const updated = await this.get(id);
    if (dto.status && dto.status !== p.status) {
      const label = { LUNAS: 'Lunas', MENUNGGU: 'Menunggu verifikasi', BELUM_BAYAR: 'Belum dibayar' }[dto.status];
      await this.notifyParent(actor, updated, updated.student, `Status pembayaran: ${label}`, `${updated.description} (${updated.period}) untuk ${updated.student.name} kini berstatus ${label}.`);
    }
    return updated;
  }

  async remove(actor: AuthUser, id: string) {
    const p = await this.get(id);
    assertBranch(actor, p.branchId);
    await this.repo.delete(id);
    return { ok: true };
  }
}

@Controller('admin/payments')
@Auth(...ADMIN_ROLES)
export class AdminPaymentsController {
  constructor(private svc: PaymentsService) {}
  @Get() list(@CurrentUser() u: AuthUser, @Query() q: Record<string, string>) {
    return this.svc.list(u, q as any);
  }
  @Post() create(@CurrentUser() u: AuthUser, @Body() dto: CreatePaymentDto) {
    return this.svc.create(u, dto);
  }
  @Patch(':id') update(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdatePaymentDto) {
    return this.svc.update(u, id, dto);
  }
  @Delete(':id') remove(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.remove(u, id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Payment, User]), NotificationsModule],
  controllers: [AdminPaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
