import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthJwtGuard } from '../auth/auth.guard';
import { Throttle } from '@nestjs/throttler';
import { AuthenticatedRequest } from 'src/shared/request';
import { CreateCompanyService } from './create/create.service';
import { CreateCompanyValidator } from './create/create.interface';
import { PermissionsAllowed } from '../permissions/permissions.decorator';
import { PermissionsGuard } from '../permissions/permissions.guard';

@Controller()
export class CompanyController {
  constructor(private readonly createCompanyService: CreateCompanyService) {}

  @Post('company')
  @UseGuards(AuthJwtGuard, PermissionsGuard)
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  @PermissionsAllowed()
  createCompany(
    @Req() req: AuthenticatedRequest,
    @Body() data: CreateCompanyValidator,
  ) {
    return this.createCompanyService.executeFromRequest(req, data);
  }
}
