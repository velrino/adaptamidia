import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthJwtGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { PermissionsAllowed } from '../permissions/permissions.decorator';
import { AuthenticatedRequest } from 'src/shared/request';
import { CreateAdvertisementService } from './create/create.service';
import { CreateAdvertisementDto } from './create/create.interface';

@Controller()
export class AdvertisementController {
  constructor(
    private readonly createAdvertisementService: CreateAdvertisementService,
  ) {}

  @Post('advertisement')
  @UseGuards(AuthJwtGuard, PermissionsGuard)
  @PermissionsAllowed()
  create(
    @Req() req: AuthenticatedRequest,
    @Body() query: CreateAdvertisementDto,
  ) {
    return this.createAdvertisementService.executeFromRequest(req, query);
  }
}
