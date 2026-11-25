import { Module } from '@nestjs/common';
import { SyncNewsService } from './sync-news/sync-news.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';
import { NewsController } from './news.controller';
import { PaginateNewsService } from './paginate/paginate.service';
import { CreateNewsService } from './create/create.service';
import { UpdateNewsService } from './update/update.service';
import { DeleteNewsService } from './delete/delete.service';

@Module({
  imports: [MongooseModule.forFeature([MongoCollection.news])],
  controllers: [NewsController],
  providers: [
    SyncNewsService,
    PaginateNewsService,
    CreateNewsService,
    UpdateNewsService,
    DeleteNewsService,
  ],
  exports: [],
})
export class NewsModule {}
