import { Body, Controller, Post } from '@nestjs/common';
import { LeadsService } from './leads.service';
import { CreateLeadValidator } from './leads.interface';

@Controller()
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('leads')
  createLead(@Body() data: CreateLeadValidator) {
    return this.leadsService.create(data);
  }
}
