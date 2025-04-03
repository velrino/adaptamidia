import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';
import { Module } from '@nestjs/common';
import { DashboardController } from './dashboard.controller';
import { DashboardDisplayLogService } from './dashboard/dashboard.service';

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
  providers: [DashboardDisplayLogService],
})
export class DashboardModule {}
