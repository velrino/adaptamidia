import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';
import { AdvertisementCampaignController } from './advertisement-campaign.controller';
import { CreateAdvertisementCampaignService } from './create/create.service';

@Module({
  imports: [
    MongooseModule.forFeature([MongoCollection.advertisement_campaign]),
  ],
  controllers: [AdvertisementCampaignController],
  providers: [CreateAdvertisementCampaignService],
})
export class AdvertisementCampaignModule {}
