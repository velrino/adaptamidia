import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthJwtGuard } from '../auth/auth.guard';
import { Throttle } from '@nestjs/throttler';
import { AuthenticatedRequest } from 'src/shared/request';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('user/me')
  @UseGuards(AuthJwtGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.userService.hiddenFields(JSON.parse(JSON.stringify(req.user)));
  }
}
