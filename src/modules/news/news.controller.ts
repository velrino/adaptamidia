import { Controller, Get, Query, Req, UseGuards } from '@nestjs/common';
import { CustomRequest } from 'src/shared/request';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthJwtGuard } from '../auth/auth.guard';
import { PaginateNewsService } from './paginate/paginate.service';
import { NewsPaginateDto } from './paginate/paginate.interface';

@Controller()
export class NewsController {
  constructor(private readonly paginateNewsService: PaginateNewsService) {}

  @Get('news')
  @UseGuards(AuthJwtGuard)
  @SkipThrottle()
  listAll(
    @Req() currentRequest: CustomRequest,
    @Query() query: NewsPaginateDto,
  ) {
    return this.paginateNewsService.execute(query);
  }
}
