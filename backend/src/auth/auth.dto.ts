import { IsEmail, IsIn, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';
import { Role } from '../entities';

export class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
  /** Wajib untuk admin & pengajar: mereka hanya bisa login ke cabangnya sendiri */
  @IsOptional() @IsUUID() branchId?: string;
}

export class RegisterDto {
  @IsString() @MinLength(2) name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
  @IsOptional() @IsString() phone?: string;
  @IsUUID() branchId: string;
  @IsIn([Role.PARENT, Role.STUDENT]) role: Role.PARENT | Role.STUDENT;
}

export class UpdateProfileDto {
  @IsOptional() @IsString() @MinLength(2) name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() birthDate?: string;
  @IsOptional() @IsString() school?: string;
  @IsOptional() @IsString() avatarUrl?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsString() currentPassword?: string;
  @IsOptional() @IsString() @MinLength(6) newPassword?: string;
}
