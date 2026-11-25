import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardDisplayLogService } from './display/display.service';
import { DashboardAdvertisementService } from './advertisement/advertisement.service';
import { DashboardGeneralService } from './general/general.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      MongoCollection.advertisement,
      MongoCollection.companies,
      MongoCollection.company_units,
      MongoCollection.display_logs,
      MongoCollection.news,
    ]),
  ],
  controllers: [DashboardController],
  providers: [
    DashboardDisplayLogService,
    DashboardAdvertisementService,
    DashboardGeneralService,
  ],
})
export class DashboardModule {}
