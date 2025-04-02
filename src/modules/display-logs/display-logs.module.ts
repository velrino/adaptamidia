import { MongooseModule } from '@nestjs/mongoose';
import { CreateDisplayLogService } from './create/create.service';
import { MongoCollection } from 'src/shared/mongo.schema';
import { Module } from '@nestjs/common';
import { DisplayLogController } from './display-logs.controller';
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
  controllers: [DisplayLogController],
  providers: [CreateDisplayLogService, DashboardDisplayLogService],
})
export class DisplayLogsModule {}
