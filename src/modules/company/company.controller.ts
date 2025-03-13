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
import { CreateCompanyService } from './create/create.service';
import { CreateCompanyValidator } from './create/create.interface';
import { PermissionsAllowed } from '../permissions/permissions.decorator';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { ListCompanyPaginateDto } from './list/list.interface';
import { ListCompanyService } from './list/list.service';

@Controller()
export class CompanyController {
  constructor(
    private readonly createCompanyService: CreateCompanyService,
    private readonly listCompanyService: ListCompanyService,
  ) {}

  @Post('company')
  @UseGuards(AuthJwtGuard, PermissionsGuard)
  @PermissionsAllowed()
  createCompany(
    @Req() req: AuthenticatedRequest,
    @Body() data: CreateCompanyValidator,
  ) {
    return this.createCompanyService.executeFromRequest(req, data);
  }

  @Get('company')
  @UseGuards(AuthJwtGuard, PermissionsGuard)
  @PermissionsAllowed()
  list(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListCompanyPaginateDto,
  ) {
    return this.listCompanyService.executeFromRequest(req, query);
  }
}
