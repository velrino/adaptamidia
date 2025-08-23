import { MongooseModule } from '@nestjs/mongoose';
import { CreateDisplayLogService } from './create/create.service';
import { MongoCollection } from 'src/shared/mongo.schema';
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { DisplayLogController } from './display-logs.controller';
import { DetectionDisplayLogService } from './detection/detection.service';
import { GetDisplayLogService } from './get/get.service';
import { DetectionService } from 'src/shared/detection/detection.service';
import { GoogleCloudStorageService } from 'src/shared/google/cloud/google-cloud-storage.service';
import { ListDisplayLogService } from './list/list.service';
import { GoogleGenAiProvider } from 'src/shared/google/llm/llm.service';
import { InsightDisplayLogService } from './insights/insights.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      MongoCollection.advertisement,
      MongoCollection.companies,
      MongoCollection.company_units,
      MongoCollection.display_logs,
      MongoCollection.news,
    ]),
    JwtModule,
  ],
  controllers: [DisplayLogController],
  providers: [
    CreateDisplayLogService,
    GetDisplayLogService,
    DetectionDisplayLogService,
    DetectionService,
    GoogleCloudStorageService,
    ListDisplayLogService,
    GoogleGenAiProvider,
    InsightDisplayLogService,
  ],
})
export class DisplayLogsModule {}
