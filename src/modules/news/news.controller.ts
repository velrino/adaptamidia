import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthenticatedRequest, CustomRequest } from 'src/shared/request';
import { SkipThrottle } from '@nestjs/throttler';
import { AuthJwtGuard } from '../auth/auth.guard';
import { PaginateNewsService } from './paginate/paginate.service';
import { NewsPaginateDto } from './paginate/paginate.interface';
import { CreateNewsService } from './create/create.service';
import { CreateNewsDto } from './create/create.interface';

@Controller()
export class NewsController {
  constructor(
    private readonly paginateNewsService: PaginateNewsService,
    private readonly createNewsService: CreateNewsService,
  ) {}

  @Get('news')
  @UseGuards(AuthJwtGuard)
  @SkipThrottle()
  listAll(
    @Req() currentRequest: CustomRequest,
    @Query() query: NewsPaginateDto,
  ) {
    return this.paginateNewsService.execute(query);
  }

  @Post('news')
  @UseGuards(AuthJwtGuard)
  @SkipThrottle()
  create(
    @Req() authenticatedRequest: AuthenticatedRequest,
    @Body() body: CreateNewsDto,
  ) {
    return this.createNewsService.executeFromController(
      authenticatedRequest,
      body,
    );
  }
}
