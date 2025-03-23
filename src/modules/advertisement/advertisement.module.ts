import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';
import { AdvertisementController } from './advertisement.controller';
import { CreateAdvertisementService } from './create/create.service';
import { AdvertisementService } from './advertisement.service';
import { GoogleCloudStorageService } from 'src/shared/google/cloud/google-cloud-storage.service';

@Module({
  imports: [MongooseModule.forFeature([MongoCollection.advertisement])],
  controllers: [AdvertisementController],
  providers: [
    AdvertisementService,
    CreateAdvertisementService,
    GoogleCloudStorageService,
  ],
})
export class AdvertisementModule {}
