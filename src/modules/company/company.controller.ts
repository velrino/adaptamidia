import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthJwtGuard } from '../auth/auth.guard';
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
  @PermissionsAllowed()
  createCompany(
    @Req() req: AuthenticatedRequest,
    @Body() data: CreateCompanyValidator,
  ) {
    return this.createCompanyService.executeFromRequest(req, data);
  }
}
