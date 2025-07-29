import {
  Body,
  Controller,
  Post,
  Req,
  Sse,
  UseGuards,
  Query,
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
import { DetectionDisplayLogService } from './detection/detection.service';
import { IDetectionDisplayLogDto } from './detection/detection.interface';
import { Observable } from 'rxjs';
import { InsightDisplayLogService } from './insights/insights.service';

@Controller()
export class DisplayLogController {
  constructor(
    private readonly createDisplayLogService: CreateDisplayLogService,
    private readonly listDisplayLogService: ListDisplayLogService,
    private readonly detectionDisplayLogService: DetectionDisplayLogService,
    private readonly insightDisplayLogService: InsightDisplayLogService,
  ) {}

  @Post('display/logs/paginate')
  @SkipThrottle()
  @UseGuards(AuthJwtGuard, PermissionsGuard)
  @PermissionsAllowed()
  paginate(
    @Req() req: AuthenticatedRequest,
    @Body() body: ListDisplayLogsPaginateDto,
  ) {
    return this.listDisplayLogService.executeFromRequest(req, body);
  }

  @Post('display/log')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  createLog(@Req() req: CustomRequest, @Body() body: ICreateDisplayLogDto) {
    return this.createDisplayLogService.executeFromGuestRequest(req, body);
  }

  @Post('display/log/detect')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  detectDisplayLog(
    @Req() req: AuthenticatedRequest,
    @Body() body: IDetectionDisplayLogDto,
  ) {
    return this.detectionDisplayLogService.executeFromAuthenticatedRequest(
      req,
      body,
    );
  }

  @Sse('display/generate-stream')
  generateStream(@Query('prompt') prompt: string): Observable<MessageEvent> {
    return this.insightDisplayLogService.generateStream(prompt);
  }
}
