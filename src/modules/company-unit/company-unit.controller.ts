import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthJwtGuard } from '../auth/auth.guard';
import { AuthenticatedRequest } from 'src/shared/request';
import { PermissionsAllowed } from '../permissions/permissions.decorator';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { CreateCompanyUnitService } from './create/create.service';
import { CreateCompanyUnitValidator } from './create/create.interface';
import { ListCompanyUnitService } from './list/list.service';
import { ListCompanyUnitPaginateDto } from './list/list.interface';

@Controller()
export class CompanyUnitController {
  constructor(
    private readonly createCompanyUnitService: CreateCompanyUnitService,
    private readonly listCompanyUnitService: ListCompanyUnitService,
  ) {}

  @Get('company/unit')
  @UseGuards(AuthJwtGuard, PermissionsGuard)
  @PermissionsAllowed()
  list(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListCompanyUnitPaginateDto,
  ) {
    return this.listCompanyUnitService.executeFromRequest(req, query);
  }

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
