import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
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
import { UpdateNewsService } from './update/update.service';
import { DeleteNewsService } from './delete/delete.service';

@Controller()
export class NewsController {
  constructor(
    private readonly paginateNewsService: PaginateNewsService,
    private readonly createNewsService: CreateNewsService,
    private readonly updateNewsService: UpdateNewsService,
    private readonly deleteNewsService: DeleteNewsService,
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

  @Put('news/:id')
  @UseGuards(AuthJwtGuard)
  @SkipThrottle()
  update(
    @Req() authenticatedRequest: AuthenticatedRequest,
    @Body() body: CreateNewsDto,
    @Param('id') id: string,
  ) {
    return this.updateNewsService.executeFromController(
      id,
      authenticatedRequest,
      body,
    );
  }

  @Delete('news/:id')
  @UseGuards(AuthJwtGuard)
  @SkipThrottle()
  delete(@Param('id') id: string) {
    return this.deleteNewsService.executeFromController(id);
  }
}
