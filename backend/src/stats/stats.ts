import { Controller, Get, Module, Query } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ClassRoom, ClassSession, Mading, Payment, PaymentStatus, Post, Role, User } from '../entities';
import { ADMIN_ROLES, Auth, AuthUser, CurrentUser, scopeBranch } from '../common/auth';

/** Ringkasan untuk dashboard admin */
@Controller('admin/stats')
@Auth(...ADMIN_ROLES)
export class AdminStatsController {
  constructor(@InjectDataSource() private ds: DataSource) {}

  @Get()
  async stats(@CurrentUser() u: AuthUser, @Query('branchId') requested?: string) {
    const branchId = scopeBranch(u, requested);
    const w = branchId ? { branchId } : {};
    const users = this.ds.getRepository(User);
    const [students, parents, teachers, classes, posts, mading, unpaid, sessions] = await Promise.all([
      users.count({ where: { ...w, role: Role.STUDENT } }),
      users.count({ where: { ...w, role: Role.PARENT } }),
      users.count({ where: { ...w, role: Role.TEACHER } }),
      this.ds.getRepository(ClassRoom).count({ where: w }),
      this.ds.getRepository(Post).count({ where: w }),
      this.ds.getRepository(Mading).count({ where: w }),
      this.ds.getRepository(Payment).count({ where: { ...w, status: PaymentStatus.BELUM_BAYAR } }),
      this.ds
        .getRepository(ClassSession)
        .createQueryBuilder('s')
        .innerJoin('s.classRoom', 'c')
        .where(branchId ? 'c.branchId = :branchId' : '1=1', { branchId })
        .getCount(),
    ]);
    return { students, parents, teachers, classes, posts, mading, unpaid, sessions };
  }
}

@Module({ controllers: [AdminStatsController] })
export class StatsModule {}
