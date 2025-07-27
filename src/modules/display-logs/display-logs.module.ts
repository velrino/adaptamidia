import { MongooseModule } from '@nestjs/mongoose';
import { CreateDisplayLogService } from './create/create.service';
import { MongoCollection } from 'src/shared/mongo.schema';
import { Module } from '@nestjs/common';
import { DisplayLogController } from './display-logs.controller';
import { DetectionDisplayLogService } from './detection/detection.service';
import { GetDisplayLogService } from './get/get.service';
import { DetectionService } from 'src/shared/detection/detection.service';
import { GoogleCloudStorageService } from 'src/shared/google/cloud/google-cloud-storage.service';

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
  providers: [
    CreateDisplayLogService,
    GetDisplayLogService,
    DetectionDisplayLogService,
    DetectionService,
    GoogleCloudStorageService,
  ],
})
export class DisplayLogsModule {}
