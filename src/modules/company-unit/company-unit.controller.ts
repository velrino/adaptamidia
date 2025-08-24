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
import { PermissionsAllowed } from '../permissions/permissions.decorator';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { CreateCompanyUnitService } from './create/create.service';
import { CreateCompanyUnitValidator } from './create/create.interface';
import { ListCompanyUnitService } from './list/list.service';
import { ListCompanyUnitPaginateDto } from './list/list.interface';
import { GroupCompanyUnitPaginateDto } from './group/group.interface';
import { GroupCompanyUnitService } from './group/group.service';
import { UpdateCompanyUnitService } from './update/update.service';
import { UpdateCompanyUnitValidator } from './update/update.interface';
import { SkipThrottle } from '@nestjs/throttler';
import { PermissionsEnum } from '../permissions/permissions.enum';

const defaultPermissions = [PermissionsEnum.LOCAL];

@Controller()
export class CompanyUnitController {
  constructor(
    private readonly createCompanyUnitService: CreateCompanyUnitService,
    private readonly listCompanyUnitService: ListCompanyUnitService,
    private readonly groupCompanyUnitService: GroupCompanyUnitService,
    private readonly updateCompanyUnitService: UpdateCompanyUnitService,
  ) {}

  @Get('company/unit/group')
  @UseGuards(AuthJwtGuard, PermissionsGuard)
  @PermissionsAllowed([...defaultPermissions, PermissionsEnum.ADVERTISER])
  group(
    @Req() req: AuthenticatedRequest,
    @Query() query: GroupCompanyUnitPaginateDto,
  ) {
    return this.groupCompanyUnitService.executeFromRequest(req, query);
  }

  @Get('company/unit')
  @UseGuards(AuthJwtGuard, PermissionsGuard)
  @SkipThrottle()
  @PermissionsAllowed([...defaultPermissions, PermissionsEnum.ADVERTISER])
  list(
    @Req() req: AuthenticatedRequest,
    @Query() query: ListCompanyUnitPaginateDto,
  ) {
    return this.listCompanyUnitService.executeFromRequest(req, query);
  }

  @Post('company/unit/list')
  @UseGuards(AuthJwtGuard, PermissionsGuard)
  @SkipThrottle()
  @PermissionsAllowed(defaultPermissions)
  listPost(
    @Req() req: AuthenticatedRequest,
    @Body() body: ListCompanyUnitPaginateDto,
  ) {
    return this.listCompanyUnitService.executeFromRequest(req, body);
  }

  @Post('company/unit')
  @UseGuards(AuthJwtGuard, PermissionsGuard)
  @PermissionsAllowed(defaultPermissions)
  createCompany(
    @Req() req: AuthenticatedRequest,
    @Body() data: CreateCompanyUnitValidator,
  ) {
    return this.createCompanyUnitService.executeFromRequest(req, data);
  }

  @Put('company/unit/:id')
  @UseGuards(AuthJwtGuard, PermissionsGuard)
  @PermissionsAllowed(defaultPermissions)
  updateCompanyUnit(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() data: UpdateCompanyUnitValidator,
  ) {
    return this.updateCompanyUnitService.executeFromRequest(req, id, data);
  }

  @Get('company/unit/:id')
  @UseGuards(AuthJwtGuard, PermissionsGuard)
  @PermissionsAllowed([...defaultPermissions, PermissionsEnum.ADVERTISER])
  get(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Query() query: ListCompanyUnitPaginateDto,
  ) {
    return this.listCompanyUnitService.executeFromRequest(req, query);
  }
}
