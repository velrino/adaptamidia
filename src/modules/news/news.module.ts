import { Module } from '@nestjs/common';
import { SyncNewsService } from './sync-news/sync-news.service';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';

@Module({
  imports: [MongooseModule.forFeature([MongoCollection.news])],
  controllers: [],
  providers: [SyncNewsService],
  exports: [],
})
export class NewsModule {}
