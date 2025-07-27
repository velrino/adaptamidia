import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { AuthenticatedRequest, CustomRequest } from 'src/shared/request';
import { CreateDisplayLogService } from './create/create.service';
import { ICreateDisplayLogDto } from './create/create.interface';
import { ListDisplayLogService } from './list/list.service';
import { ListDisplayLogsPaginateDto } from './list/list.interface';
import { AuthJwtGuard } from '../auth/auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { PermissionsAllowed } from '../permissions/permissions.decorator';

@Controller()
export class DisplayLogController {
  constructor(
    private readonly createDisplayLogService: CreateDisplayLogService,
    private readonly listDisplayLogService: ListDisplayLogService,
  ) {}

  @Get('display/logs')
  @SkipThrottle()
  @UseGuards(AuthJwtGuard, PermissionsGuard)
  @PermissionsAllowed()
  paginate(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListDisplayLogsPaginateDto,
  ) {
    return this.listDisplayLogService.executeFromRequest(req, query);
  }

  @Post('display/log')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  createLog(@Req() req: CustomRequest, @Body() body: ICreateDisplayLogDto) {
    return this.createDisplayLogService.executeFromGuestRequest(req, body);
  }
}
