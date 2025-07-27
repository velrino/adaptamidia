import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueuesEnum } from 'src/modules/queue/queue.interface';
import {
  Advertisement,
  AdvertisementDocument,
} from 'src/modules/advertisement/advertisement.schema';
import {
  CompanyUnit,
  CompanyUnitDocument,
} from 'src/modules/company-unit/company-unit.schema';
import { News, NewsDocument } from 'src/modules/news/news.schema';
import { Model } from 'mongoose';
import { RedisService } from 'src/shared/redis/redis.service';
import { QueueService } from 'src/modules/queue/queue.service';
import {
  IDetectionDisplayLog,
  IDetectionDisplayLogProcessor,
} from './detection.interface';
import { Job } from 'bull';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { GetDisplayLogService } from '../get/get.service';
import { DetectionService } from 'src/shared/detection/detection.service';
import { GoogleCloudStorageService } from 'src/shared/google/cloud/google-cloud-storage.service';
import { IGoogleStorageBucket } from 'src/shared/google/cloud/google-cloud-storage.interface';
import {
  ApiDeepFaceAnalysisResult,
  ApiYoloResultDefault,
  IApiDeepFaceAnalysisResult,
  IApiYoloResult,
} from 'src/shared/detection/detection.interface';

@Processor(QueuesEnum.DETECT_IMAGE)
@Injectable()
export class DetectionDisplayLogService {
  constructor(
    private readonly queueService: QueueService,
    @InjectModel(Advertisement.name)
    private readonly advertisementModel: Model<AdvertisementDocument>,
    @InjectModel(CompanyUnit.name)
    private readonly companyUnitModel: Model<CompanyUnitDocument>,
    @InjectModel(News.name)
    readonly newsModel: Model<NewsDocument>,
    private readonly redisService: RedisService,
    private readonly displayLogService: GetDisplayLogService,
    private readonly detectionService: DetectionService,
    private readonly googleCloudStorageService: GoogleCloudStorageService,
  ) {}

  @Process({ concurrency: 5 })
  async processJob(job: Job<IDetectionDisplayLogProcessor>) {
    try {
      await this.execute(job.data.parameters);
      await job.isCompleted();
    } catch (error) {
      Log(
        LogType.ERROR,
        DetectionDisplayLogService.name,
        this.processJob.name,
        LogAction.FAILED,
        { error },
      );
      await job.remove();
      throw error;
    }
  }

  async execute(payload: IDetectionDisplayLog) {
    try {
      const displayLog = await this.displayLogService.get({ _id: payload.id });

      // Baixar imagem do Google Cloud Storage
      const recordId =
        displayLog?.news?._id.toString() ||
        displayLog?.advertisement?._id.toString();

      const filePath = `logs/${displayLog.local_unit._id.toString()}/${displayLog.type.toLowerCase()}/${recordId}`;

      const imageFile =
        await this.googleCloudStorageService.downloadRecordFileAsMulter(
          IGoogleStorageBucket.ADAPTA_MIDIA_RECORD,
          `${filePath}/${displayLog.identifier}`,
        );

      // Enviar para detecção YOLO
      let yolo: IApiYoloResult = ApiYoloResultDefault;
      let deepface: IApiDeepFaceAnalysisResult = ApiDeepFaceAnalysisResult;
      let detectPeopleBbox: Buffer | null = null;

      try {
        yolo = await this.detectionService.detectYolo(imageFile);
        detectPeopleBbox =
          await this.detectionService.detectPeopleBbox(imageFile);
        deepface = await this.detectionService.detectDeepFace(imageFile);
      } catch (error) {
        Log(
          LogType.ERROR,
          DetectionDisplayLogService.name,
          this.execute.name,
          LogAction.FAILED,
          { displayLogId: payload.id, error },
        );
      }

      let bboxPath: string | null = null;

      if (detectPeopleBbox) {
        try {
          const bboxFile = this.googleCloudStorageService.bufferToMulterFile(
            detectPeopleBbox,
            `${displayLog.identifier}_bbox.jpg`,
            'image/jpeg',
          );
          const bboxResult = await this.googleCloudStorageService.uploadFile(
            filePath,
            `${displayLog.identifier}_bbox`,
            bboxFile,
            IGoogleStorageBucket.ADAPTA_MIDIA_RECORD,
          );

          bboxPath = bboxResult.path;
        } catch (error) {
          Log(
            LogType.ERROR,
            DetectionDisplayLogService.name,
            'bboxResult_uploadFile',
            LogAction.FAILED,
            { error },
          );
        }
      }
      console.log({ bboxPath, yolo, deepface });
      Log(
        LogType.INFO,
        DetectionDisplayLogService.name,
        this.execute.name,
        LogAction.SUCCESS,
        {
          displayLogId: payload.id,
          filePath,
          bboxPath,
          yolo,
          deepface,
          detectPeopleBbox,
        },
      );

      // Aqui você pode salvar o resultado da detecção no banco ou processar conforme necessário
      //   console.log({ displayLog, yolo });
    } catch (error) {
      Log(
        LogType.ERROR,
        DetectionDisplayLogService.name,
        this.execute.name,
        LogAction.FAILED,
        { payload, error },
      );
      throw error;
    }
  }
}
