import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { MongoCollection } from 'src/shared/mongo.schema';
import { DashboardDisplayLogsController } from './dashboard-display-logs.controller';
import { DashboardDisplayLogsProcessService } from './process/process.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      MongoCollection.display_logs,
      MongoCollection.dashboard_display_logs_aggregations,
    ]),
    ScheduleModule.forRoot(),
  ],
  controllers: [DashboardDisplayLogsController],
  providers: [DashboardDisplayLogsProcessService],
})
export class DashboardDisplayLogsModule {}
