import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthJwtGuard } from '../auth/auth.guard';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AuthenticatedRequest } from 'src/shared/request';
import { UserService } from './user.service';

@Controller()
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('user/me')
  @UseGuards(AuthJwtGuard)
  @SkipThrottle()
  getProfile(@Req() req: AuthenticatedRequest) {
    return this.userService.hiddenFields(JSON.parse(JSON.stringify(req.user)));
  }
}
