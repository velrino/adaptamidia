import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthenticatedRequest } from 'src/shared/request';
import { DashboardDisplayLogService } from './display/display.service';
import { AuthJwtGuard } from '../auth/auth.guard';
import { IDashboardDisplayLogDto } from './display/display.interface';
import { DashboardAdvertisementService } from './advertisement/advertisement.service';
import { IDashboardAdvertisementDto } from './advertisement/advertisement.interface';
import { DashboardGeneralService } from './general/general.service';
import { IDashboardGeneralDto } from './general/general.interface';

@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardGeneralService: DashboardGeneralService,
    private readonly dashboardDisplayLogService: DashboardDisplayLogService,
    private readonly dashboardAdvertisementService: DashboardAdvertisementService,
  ) {}

  @Post('general')
  @SkipThrottle()
  @UseGuards(AuthJwtGuard)
  general(
    @Req() req: AuthenticatedRequest,
    @Body() body: IDashboardGeneralDto,
  ) {
    return this.dashboardGeneralService.executeFromRequest(req, body);
  }

  @Post('display')
  @SkipThrottle()
  @UseGuards(AuthJwtGuard)
  displayLog(
    @Req() req: AuthenticatedRequest,
    @Body() body: IDashboardDisplayLogDto,
  ) {
    return this.dashboardDisplayLogService.executeFromRequest(req, body);
  }

  @Post('advertisement')
  @SkipThrottle()
  @UseGuards(AuthJwtGuard)
  advertisement(
    @Req() req: AuthenticatedRequest,
    @Body() body: IDashboardAdvertisementDto,
  ) {
    return this.dashboardAdvertisementService.executeFromRequest(req, body);
  }
}
