import { Module } from '@nestjs/common';
import { SyncNewsService } from './sync-news/sync-news.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';
import { NewsController } from './news.controller';
import { PaginateNewsService } from './paginate/paginate.service';
import { CreateNewsService } from './create/create.service';

@Module({
  imports: [MongooseModule.forFeature([MongoCollection.news])],
  controllers: [NewsController],
  providers: [SyncNewsService, PaginateNewsService, CreateNewsService],
  exports: [],
})
export class NewsModule {}
