import { Controller, Get, Param, Query } from '@nestjs/common';
import { FindByIdParamsDto } from 'src/shared/interfaces/paginate.dto';
import { DisplayByUnitService } from './unit/display.service';
import { DisplayAdvertisementPaginateDto } from './unit/display.interface';

@Controller('display')
export class DisplayController {
  constructor(private readonly displayByUnitService: DisplayByUnitService) {}

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
