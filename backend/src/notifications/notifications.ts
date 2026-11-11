import {
  BadRequestException, Body, Controller, Get, Injectable, Module, Param, ParseUUIDPipe, Patch, Post, Query,
} from '@nestjs/common';
import { InjectRepository, TypeOrmModule } from '@nestjs/typeorm';
import { IsArray, IsEnum, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { In, IsNull, Repository } from 'typeorm';
import { ClassRoom, Notification, NotificationRecipient, NotificationTarget, Role, User } from '../entities';
import { ADMIN_ROLES, assertBranch, Auth, AuthUser, CurrentUser, requireBranch, scopeBranch } from '../common/auth';
import { paginate } from '../common/util';

export class PushNotificationDto {
  @IsString() @MinLength(3) title: string;
  @IsString() @MinLength(3) body: string;
  @IsEnum(NotificationTarget) target: NotificationTarget;
  @IsOptional() @IsUUID() branchId?: string;
  @IsOptional() @IsUUID() classId?: string;
  @IsOptional() @IsArray() @IsUUID('all', { each: true }) userIds?: string[];
}

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification) private repo: Repository<Notification>,
    @InjectRepository(NotificationRecipient) private recipients: Repository<NotificationRecipient>,
    @InjectRepository(User) private users: Repository<User>,
    @InjectRepository(ClassRoom) private classes: Repository<ClassRoom>,
  ) {}

  /** Dipakai modul lain (mis. pembayaran) untuk mengirim notifikasi otomatis */
  async send(opts: { title: string; body: string; target: NotificationTarget; branchId: string | null; userIds: string[]; createdById?: string | null }) {
    const ids = [...new Set(opts.userIds)];
    const n = await this.repo.save(
      this.repo.create({ title: opts.title, body: opts.body, target: opts.target, branchId: opts.branchId, createdById: opts.createdById ?? null }),
    );
    if (ids.length) {
      await this.recipients.insert(ids.map((userId) => ({ notificationId: n.id, userId })));
    }
    return { ...n, recipientCount: ids.length };
  }

  async push(actor: AuthUser, dto: PushNotificationDto) {
    const branchId = requireBranch(actor, dto.branchId);
    let userIds: string[] = [];
    if (dto.target === NotificationTarget.BRANCH_PARENTS) {
      userIds = (await this.users.find({ where: { branchId, role: Role.PARENT, isActive: true }, select: ['id'] })).map((u) => u.id);
    } else if (dto.target === NotificationTarget.CLASS_PARENTS) {
      if (!dto.classId) throw new BadRequestException('Pilih kelas');
      const cls = await this.classes.findOne({ where: { id: dto.classId }, relations: { students: true } });
      if (!cls) throw new BadRequestException('Kelas tidak ditemukan');
      assertBranch(actor, cls.branchId);
      userIds = cls.students.map((s) => s.parentId).filter((x): x is string => !!x);
    } else {
      if (!dto.userIds?.length) throw new BadRequestException('Pilih minimal satu penerima');
      const users = await this.users.find({ where: { id: In(dto.userIds), organizationId: actor.organizationId }, select: ['id', 'branchId'] });
      if (users.length !== new Set(dto.userIds).size) throw new BadRequestException('Sebagian penerima tidak ditemukan');
      users.forEach((u) => (actor.role === Role.SUPER_ADMIN && !u.branchId) || assertBranch(actor, u.branchId));
      userIds = users.map((u) => u.id);
    }
    if (!userIds.length) throw new BadRequestException('Tidak ada penerima untuk target ini');
    return this.send({ title: dto.title, body: dto.body, target: dto.target, branchId, userIds, createdById: actor.id });
  }

  async sent(actor: AuthUser, q: { branchId?: string; page?: string }) {
    const { page, limit, skip } = paginate({ page: q.page, limit: 20 });
    const qb = this.repo
      .createQueryBuilder('n')
      .leftJoin('n.createdBy', 'cb')
      .addSelect(['cb.id', 'cb.name'])
      .loadRelationCountAndMap('n.recipientCount', 'n.recipients')
      .loadRelationCountAndMap('n.readCount', 'n.recipients', 'r', (sq) => sq.where('r.readAt IS NOT NULL'))
      .orderBy('n.createdAt', 'DESC')
      .skip(skip)
      .take(limit);
    qb.where('n.branchId IN (:...branchIds)', { branchIds: scopeBranch(actor, q.branchId) });
    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit };
  }

  async inbox(userId: string, q: { page?: string }) {
    const { page, limit, skip } = paginate({ page: q.page, limit: 20 });
    const [rows, total] = await this.recipients.findAndCount({
      where: { userId },
      relations: { notification: true },
      order: { createdAt: 'DESC' },
      skip,
      take: limit,
    });
    const unread = await this.recipients.count({ where: { userId, readAt: IsNull() } });
    return {
      data: rows.map((r) => ({
        id: r.id,
        title: r.notification.title,
        body: r.notification.body,
        createdAt: r.notification.createdAt,
        readAt: r.readAt,
      })),
      total,
      unread,
      page,
      limit,
    };
  }

  async unreadCount(userId: string) {
    return { unread: await this.recipients.count({ where: { userId, readAt: IsNull() } }) };
  }

  async markRead(userId: string, id: string) {
    await this.recipients.update({ id, userId }, { readAt: new Date() });
    return { ok: true };
  }

  async markAllRead(userId: string) {
    await this.recipients.update({ userId, readAt: IsNull() }, { readAt: new Date() });
    return { ok: true };
  }
}

@Controller('admin/notifications')
@Auth(...ADMIN_ROLES)
export class AdminNotificationsController {
  constructor(private svc: NotificationsService) {}
  @Get() list(@CurrentUser() u: AuthUser, @Query() q: { branchId?: string; page?: string }) {
    return this.svc.sent(u, q);
  }
  @Post() push(@CurrentUser() u: AuthUser, @Body() dto: PushNotificationDto) {
    return this.svc.push(u, dto);
  }
}

/** Kotak masuk notifikasi untuk semua user yang login */
@Controller('notifications')
@Auth()
export class NotificationsController {
  constructor(private svc: NotificationsService) {}
  @Get() inbox(@CurrentUser() u: AuthUser, @Query() q: { page?: string }) {
    return this.svc.inbox(u.id, q);
  }
  @Get('unread-count') unread(@CurrentUser() u: AuthUser) {
    return this.svc.unreadCount(u.id);
  }
  @Patch('read-all') readAll(@CurrentUser() u: AuthUser) {
    return this.svc.markAllRead(u.id);
  }
  @Patch(':id/read') read(@CurrentUser() u: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.svc.markRead(u.id, id);
  }
}

@Module({
  imports: [TypeOrmModule.forFeature([Notification, NotificationRecipient, User, ClassRoom])],
  controllers: [AdminNotificationsController, NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService],
})
export class NotificationsModule {}
