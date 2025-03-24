import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
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
import { UpdateCompanyService } from './update/update.service';

@Controller()
export class CompanyController {
  constructor(
    private readonly createCompanyService: CreateCompanyService,
    private readonly listCompanyService: ListCompanyService,
    private readonly updateCompanyService: UpdateCompanyService,
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

  @Put('company/:id')
  @UseGuards(AuthJwtGuard, PermissionsGuard)
  @PermissionsAllowed()
  updateCompany(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: CreateCompanyValidator,
  ) {
    return this.updateCompanyService.executeFromRequest(req, id, data);
  }
}
