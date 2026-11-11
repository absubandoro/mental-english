import {
  CanActivate, createParamDecorator, ExecutionContext, ForbiddenException, Injectable, SetMetadata, UseGuards, applyDecorators,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Role } from '../entities';

export interface AuthUser {
  id: string;
  role: Role;
  branchId: string | null;
  name: string;
  /** Organisasi (lembaga) pemilik akun */
  organizationId: string;
  /** Semua cabang milik organisasi (diisi untuk Super Admin) */
  branchIds: string[];
}

export const ROLES_KEY = 'roles';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}
  canActivate(ctx: ExecutionContext): boolean {
    const roles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [ctx.getHandler(), ctx.getClass()]);
    if (!roles || roles.length === 0) return true;
    const user = ctx.switchToHttp().getRequest().user as AuthUser | undefined;
    if (!user || !roles.includes(user.role)) throw new ForbiddenException('Akses ditolak');
    return true;
  }
}

/** Wajib login. Jika role diberikan, hanya role tersebut yang boleh mengakses. */
export const Auth = (...roles: Role[]) =>
  applyDecorators(SetMetadata(ROLES_KEY, roles), UseGuards(AuthGuard('jwt'), RolesGuard));

export const CurrentUser = createParamDecorator((_: unknown, ctx: ExecutionContext): AuthUser => {
  return ctx.switchToHttp().getRequest().user;
});

export const ADMIN_ROLES = [Role.SUPER_ADMIN, Role.ADMIN];
/** Boleh mengelola tagihan & verifikasi pembayaran */
export const FINANCE_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE];

/** UUID yang tidak pernah ada — agar filter IN (...) kosong tetap valid */
const NONE = '00000000-0000-0000-0000-000000000000';

/**
 * Daftar cabang yang boleh diakses (selalu berupa daftar, dipakai dengan `IN (:...ids)`).
 * Super admin: semua cabang di organisasinya, atau satu cabang yang dipilih (harus milik organisasinya).
 * Admin/pengajar/keuangan: terkunci di cabangnya sendiri.
 */
export function scopeBranch(user: AuthUser, requested?: string | null): string[] {
  if (user.role === Role.SUPER_ADMIN) {
    if (requested) {
      if (!user.branchIds.includes(requested)) throw new ForbiddenException('Cabang tidak ditemukan');
      return [requested];
    }
    return user.branchIds.length ? user.branchIds : [NONE];
  }
  if (!user.branchId) throw new ForbiddenException('Akun tidak terhubung ke cabang manapun');
  return [user.branchId];
}

/** Wajib menghasilkan satu cabang (untuk membuat data). */
export function requireBranch(user: AuthUser, requested?: string | null): string {
  if (user.role === Role.SUPER_ADMIN) {
    if (!requested) throw new ForbiddenException('Pilih cabang terlebih dahulu');
    if (!user.branchIds.includes(requested)) throw new ForbiddenException('Cabang tidak ditemukan');
    return requested;
  }
  if (!user.branchId) throw new ForbiddenException('Akun tidak terhubung ke cabang manapun');
  return user.branchId;
}

export function assertBranch(user: AuthUser, branchId: string | null | undefined) {
  const ok = user.role === Role.SUPER_ADMIN ? !!branchId && user.branchIds.includes(branchId) : !!branchId && branchId === user.branchId;
  if (!ok) throw new ForbiddenException('Data ini milik cabang lain');
}
