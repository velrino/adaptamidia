import { Body, Controller, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LeadsService } from './leads.service';
import { CreateLeadValidator } from './leads.interface';
import { CustomRequest } from 'src/shared/request';

@Controller()
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('leads')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  createLead(@Req() req: CustomRequest, @Body() data: CreateLeadValidator) {
    return this.leadsService.execute(req, data);
  }
}
