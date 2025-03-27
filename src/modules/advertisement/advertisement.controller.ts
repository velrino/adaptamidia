import {
  Body,
  Controller,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthJwtGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { PermissionsAllowed } from '../permissions/permissions.decorator';
import { AuthenticatedRequest } from 'src/shared/request';
import { CreateAdvertisementService } from './create/create.service';
import { CreateAdvertisementDto } from './create/create.interface';
import {
  ActionType,
  FindByIdParamsDto,
} from 'src/shared/interfaces/paginate.dto';

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
    @Body() body: CreateAdvertisementDto,
  ) {
    return this.createAdvertisementService.executeFromRequest(
      req,
      ActionType.CREATE,
      body,
    );
  }

  @Put('advertisement/:id')
  @UseGuards(AuthJwtGuard, PermissionsGuard)
  @PermissionsAllowed()
  update(
    @Req() req: AuthenticatedRequest,
    @Body() body: CreateAdvertisementDto,
    @Param() params: FindByIdParamsDto,
  ) {
    const { id } = params;

    return this.createAdvertisementService.executeFromRequest(
      req,
      ActionType.UPDATE,
      body,
      id,
    );
  }
}
