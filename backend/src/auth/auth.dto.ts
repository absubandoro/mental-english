import { IsEmail, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
  /** Wajib untuk admin & pengajar: mereka hanya bisa login ke cabangnya sendiri */
  @IsOptional() @IsUUID() branchId?: string;
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
