import { Body, Controller, Post, Req } from '@nestjs/common';
import { CustomRequest } from 'src/shared/request';

import { SkipThrottle } from '@nestjs/throttler';
import { LinkDeviceWithCompanyUnitService } from './link/link.service';
import { LinkDeviceWithCompanyUnitDto } from './link/link.interface';

@Controller()
export class CompanyUnitDevicesController {
  constructor(
    private readonly linkDeviceWithCompanyUnitService: LinkDeviceWithCompanyUnitService,
  ) {}

  @Post('company/unit/device')
  @SkipThrottle()
  linkDeviceWithCompanyUnit(
    @Req() req: CustomRequest,
    @Body() body: LinkDeviceWithCompanyUnitDto,
  ) {
    return this.linkDeviceWithCompanyUnitService.executeFromRequest(req, body);
  }
}
