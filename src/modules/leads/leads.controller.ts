import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { LeadsService } from './leads.service';
import { CreateLeadValidator } from './leads.interface';

@Controller()
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('leads')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  createLead(@Body() data: CreateLeadValidator) {
    return this.leadsService.create(data);
  }
}
