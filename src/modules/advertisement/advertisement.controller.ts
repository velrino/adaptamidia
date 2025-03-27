import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
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
import { ListAdvertisementPaginateDto } from './list/list.interface';
import { ListAdvertisementService } from './list/list.service';

@Controller()
export class AdvertisementController {
  constructor(
    private readonly createAdvertisementService: CreateAdvertisementService,
    private readonly listAdvertisementService: ListAdvertisementService,
  ) {}

  @Get('advertisement')
  @UseGuards(AuthJwtGuard, PermissionsGuard)
  @PermissionsAllowed()
  list(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListAdvertisementPaginateDto,
  ) {
    return this.listAdvertisementService.executeFromRequest(req, query);
  }

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
