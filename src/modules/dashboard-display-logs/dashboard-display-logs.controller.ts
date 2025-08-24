import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PermissionsEnum } from '../permissions/permissions.enum';

// const defaultPermissions = [
//   PermissionsEnum.ADVERTISER,
//   PermissionsEnum.NEWS,
//   PermissionsEnum.LOCAL,
// ];

@Controller()
export class DashboardDisplayLogsController {
  constructor() {} // private readonly jobDashboardDisplayLogsService: JobDashboardDisplayLogsService, // private readonly getDashboardDisplayLogsService: GetDashboardDisplayLogsService,

  // @Post('dashboard/display-logs')
  // @Throttle({ default: { limit: 100, ttl: 60000 } })
  // @UseGuards(AuthJwtGuard, PermissionsGuard)
  // @PermissionsAllowed(defaultPermissions)
  // async getDashboardData(
  //   @Body() body: GetDashboardDisplayLogsDto,
  // ): Promise<IDashboardResponse> {
  //   return this.getDashboardDisplayLogsService.getDashboardData(body);
  // }

  // @Post('dashboard/display-logs/job/run')
  // @Throttle({ default: { limit: 10, ttl: 60000 } })
  // @UseGuards(AuthJwtGuard, PermissionsGuard)
  // @PermissionsAllowed(defaultPermissions)
  // async runAggregationJob(
  //   @Body() body: IJobRequest,
  // ): Promise<IJobResponse> {
  //   return this.jobDashboardDisplayLogsService.processManualAggregation(body);
  // }
}
