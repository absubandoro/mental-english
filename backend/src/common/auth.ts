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

/**
 * Menentukan cabang yang boleh diakses.
 * Super admin bebas memilih cabang (atau semua), admin/pengajar terkunci di cabangnya sendiri.
 */
export function scopeBranch(user: AuthUser, requested?: string | null): string | undefined {
  if (user.role === Role.SUPER_ADMIN) return requested || undefined;
  if (!user.branchId) throw new ForbiddenException('Akun tidak terhubung ke cabang manapun');
  return user.branchId;
}

/** Sama seperti scopeBranch, tapi wajib menghasilkan satu cabang (untuk membuat data). */
export function requireBranch(user: AuthUser, requested?: string | null): string {
  const b = scopeBranch(user, requested);
  if (!b) throw new ForbiddenException('Pilih cabang terlebih dahulu');
  return b;
}

export function assertBranch(user: AuthUser, branchId: string | null | undefined) {
  if (user.role === Role.SUPER_ADMIN) return;
  if (!branchId || branchId !== user.branchId) throw new ForbiddenException('Data ini milik cabang lain');
}
