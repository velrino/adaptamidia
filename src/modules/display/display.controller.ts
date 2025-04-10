import { Controller, Get, Param, Query } from '@nestjs/common';
import { FindByIdParamsDto } from 'src/shared/interfaces/paginate.dto';
import { DisplayByUnitService } from './unit/unit.service';
import { DisplayAdvertisementPaginateDto } from './unit/unit.interface';
import { DisplayUnitInfoService } from './info/info.service';
import { DisplayUnitInfoDto } from './info/info.interface';

@Controller('display')
export class DisplayController {
  constructor(
    private readonly displayByUnitService: DisplayByUnitService,
    private readonly displayUnitInfoService: DisplayUnitInfoService,
  ) {}

  @Get('unit/:id/info')
  info(@Param() params: FindByIdParamsDto, @Query() query: DisplayUnitInfoDto) {
    return this.displayUnitInfoService.executeFromRequest({
      ...query,
      id: params.id,
    });
  }

  @Get('unit/:id')
  // @Throttle({ default: { limit: 50, ttl: 60000 } })
  display(
    @Param() params: FindByIdParamsDto,
    @Query() query: DisplayAdvertisementPaginateDto,
  ) {
    return this.displayByUnitService.executeFromRequest({
      ...query,
      id: params.id,
    });
  }
}
