import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';
import { AdvertisementController } from './advertisement.controller';
import { CreateAdvertisementService } from './create/create.service';
import { AdvertisementService } from './advertisement.service';
import { ListAdvertisementService } from './list/list.service';
import { DisplayAdvertisementService } from './display/display.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      MongoCollection.advertisement,
      MongoCollection.companies,
      MongoCollection.company_units,
    ]),
  ],
  controllers: [AdvertisementController],
  providers: [
    AdvertisementService,
    CreateAdvertisementService,
    ListAdvertisementService,
    DisplayAdvertisementService,
  ],
})
export class AdvertisementModule {}
