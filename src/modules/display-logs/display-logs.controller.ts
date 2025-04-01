import { Body, Controller, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { CustomRequest } from 'src/shared/request';
import { CreateDisplayLogService } from './create/create.service';
import { ICreateDisplayLogDto } from './create/create.interface';

@Controller()
export class DisplayLogController {
  constructor(
    private readonly createDisplayLogService: CreateDisplayLogService,
  ) {}

  @Post('display/log')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  preview(@Req() req: CustomRequest, @Body() body: ICreateDisplayLogDto) {
    return this.createDisplayLogService.executeFromGuestRequest(req, body);
  }
}
