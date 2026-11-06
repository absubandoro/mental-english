import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { Auth, AuthUser, CurrentUser } from '../common/auth';
import { LoginDto, RegisterDto, UpdateProfileDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login') login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Post('register') register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Get('me') @Auth() me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @Patch('me') @Auth() update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user.id, dto);
  }
}
