import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { PermissionsEnum } from '../permissions/permissions.enum';
import { Throttle } from '@nestjs/throttler';
import { AuthJwtGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { PermissionsAllowed } from '../permissions/permissions.decorator';
import { ListDashboardDisplayLogsDto } from './list/list.interface';
import { ListDashboardDisplayLogsService } from './list/list.service';
import { AuthenticatedRequest } from 'src/shared/request';

const defaultPermissions = [
  PermissionsEnum.ADVERTISER,
  PermissionsEnum.NEWS,
  PermissionsEnum.LOCAL,
];

@Controller('dashboard')
export class DashboardDisplayLogsController {
  constructor(
    private listDashboardDisplayLogsService: ListDashboardDisplayLogsService,
  ) {}

  @Post('display-logs')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @UseGuards(AuthJwtGuard, PermissionsGuard)
  @PermissionsAllowed(defaultPermissions)
  async getDashboardData(
    @Req() req: AuthenticatedRequest,
    @Body() body: ListDashboardDisplayLogsDto,
  ) {
    return this.listDashboardDisplayLogsService.executeFromRequest(req, body);
  }
}
