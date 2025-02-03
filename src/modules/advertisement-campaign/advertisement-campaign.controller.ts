import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthJwtGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { PermissionsAllowed } from '../permissions/permissions.decorator';
import { AuthenticatedRequest } from 'src/shared/request';
import { CreateAdvertisementCampaignService } from './create/create.service';

@Controller()
export class AdvertisementCampaignController {
  constructor(
    private readonly createAdvertisementService: CreateAdvertisementCampaignService,
  ) {}

  @Post('advertisement/campaign')
  @UseGuards(AuthJwtGuard, PermissionsGuard)
  @PermissionsAllowed()
  create(@Req() req: AuthenticatedRequest, @Body() query: any) {
    return this.createAdvertisementService.executeFromRequest(req, query);
  }
}
