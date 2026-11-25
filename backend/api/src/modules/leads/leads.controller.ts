import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { SkipThrottle, Throttle } from '@nestjs/throttler';
import { LeadsService } from './leads.service';
import { CreateLeadValidator } from './leads.interface';
import { CustomRequest } from 'src/shared/request';

@Controller()
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Get('lead')
  @SkipThrottle()
  syncLead(@Req() req: CustomRequest) {
    return this.leadsService.sync(req);
  }

  @Post('leads')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  createLead(@Req() req: CustomRequest, @Body() data: CreateLeadValidator) {
    return this.leadsService.create(req, data);
  }
}
