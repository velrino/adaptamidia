import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthJwtGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from 'src/shared/request';
import { PermissionsAllowed } from '../permissions/permissions.decorator';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { CreateCompanyUnitService } from './create/create.service';
import { CreateCompanyUnitValidator } from './create/create.interface';

@Controller()
export class CompanyUnitController {
  constructor(
    private readonly createCompanyUnitService: CreateCompanyUnitService,
  ) {}

  @Post('company/unit')
  @UseGuards(AuthJwtGuard, PermissionsGuard)
  @PermissionsAllowed()
  createCompany(
    @Req() req: AuthenticatedRequest,
    @Body() data: CreateCompanyUnitValidator,
  ) {
    return this.createCompanyUnitService.executeFromRequest(req, data);
  }
}
