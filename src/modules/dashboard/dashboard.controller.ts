import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthenticatedRequest } from 'src/shared/request';
import { DashboardDisplayLogService } from './dashboard/dashboard.service';
import { AuthJwtGuard } from '../auth/auth.guard';
import { IDashboardDisplayLogDto } from './dashboard/dashboard.interface';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardDisplayLogService: DashboardDisplayLogService,
  ) {}

  @Post('display')
  @SkipThrottle()
  @UseGuards(AuthJwtGuard)
  dashboard(
    @Req() req: AuthenticatedRequest,
    @Body() body: IDashboardDisplayLogDto,
  ) {
    return this.dashboardDisplayLogService.executeFromRequest(req, body);
  }
}
