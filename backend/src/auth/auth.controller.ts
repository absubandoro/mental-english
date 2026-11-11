import { Body, Controller, Get, Patch, Post } from '@nestjs/common';
import { Auth, AuthUser, CurrentUser } from '../common/auth';
import { CurrentOrg } from '../common/tenant';
import { Organization } from '../entities';
import { LoginDto, UpdateProfileDto } from './auth.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('login') login(@CurrentOrg() org: Organization, @Body() dto: LoginDto) {
    return this.auth.login(org, dto);
  }

  @Get('me') @Auth() me(@CurrentUser() user: AuthUser) {
    return this.auth.me(user.id);
  }

  @Patch('me') @Auth() update(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return this.auth.updateProfile(user.id, dto);
  }
}
