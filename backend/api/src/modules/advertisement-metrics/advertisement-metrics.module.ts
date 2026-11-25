import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';

@Module({
  imports: [MongooseModule.forFeature([MongoCollection.advertisement_metrics])],
  controllers: [],
  providers: [],
})
export class AdvertisementMetricsModule {}
