import { Process, Processor } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueuesEnum } from 'src/modules/queue/queue.interface';
import { News, NewsDocument } from 'src/modules/news/news.schema';
import { Model } from 'mongoose';
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
  ApiDetectInsightfaceDefault,
  ApiYoloResultDefault,
  IApiDeepFaceAnalysisResult,
  IApiDetectInsightface,
  IApiYoloResult,
} from 'src/shared/detection/detection.interface';
import { DisplayLogStatus } from '../display-logs.interface';
import { DisplayLog } from '../display-logs.schema';

@Processor(QueuesEnum.DETECT_IMAGE)
@Injectable()
export class DetectionDisplayLogService {
  constructor(
    @InjectModel(News.name)
    readonly newsModel: Model<NewsDocument>,
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

      const currentBucket = IGoogleStorageBucket.ADAPTA_MIDIA_RECORD;
      const filePath = `logs/${displayLog.local_unit._id.toString()}/${displayLog.type.toLowerCase()}/${recordId}`;

      const imageFile =
        await this.googleCloudStorageService.downloadRecordFileAsMulter(
          currentBucket,
          `${filePath}/${displayLog.identifier}`,
        );

      let status = displayLog.status;
      // Enviar para detecção YOLO
      let yolo: IApiYoloResult = ApiYoloResultDefault;
      let deepface: IApiDeepFaceAnalysisResult = ApiDeepFaceAnalysisResult;
      let insightface: IApiDetectInsightface = ApiDetectInsightfaceDefault;
      let detectPeopleBbox: Buffer | null = null;

      try {
        yolo = await this.detectionService.detectYolo(imageFile);
        detectPeopleBbox =
          await this.detectionService.detectPeopleBbox(imageFile);
        status = DisplayLogStatus.DETECTION_YOLO;

        insightface = await this.detectionService.detectInsightface(imageFile);
        status = DisplayLogStatus.DETECTION_INSIGHTFACE;

        deepface = await this.detectionService.detectDeepFace(imageFile);
        status = DisplayLogStatus.DETECTION_DEEPFACE;
      } catch (error) {
        Log(
          LogType.ERROR,
          DetectionDisplayLogService.name,
          this.execute.name,
          LogAction.FAILED,
          { displayLogId: payload.id, status, error },
        );
      } finally {
        // Limpar memória do imageFile
        if (imageFile?.buffer) {
          imageFile.buffer = Buffer.alloc(0);
        }
      }

      let bboxPath: string | null = null;

      if (detectPeopleBbox) {
        let bboxFile: Express.Multer.File | null = null;
        try {
          bboxFile = this.googleCloudStorageService.bufferToMulterFile(
            detectPeopleBbox,
            `${displayLog.identifier}_bbox.jpg`,
            'image/jpeg',
          );
          const bboxResult = await this.googleCloudStorageService.uploadFile(
            filePath,
            `${displayLog.identifier}_bbox`,
            bboxFile,
            currentBucket,
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
        } finally {
          // Limpar memória do bboxFile
          if (bboxFile?.buffer) {
            bboxFile.buffer = Buffer.alloc(0);
          }
        }
      }

      const updateQuery: Partial<
        Pick<
          DisplayLog,
          | 'status'
          | 'yolo'
          | 'deepface'
          | 'capture'
          | 'capture_bbox'
          | 'insightface'
          | 'bucket'
        >
      > = {
        status,
        yolo,
        deepface,
        insightface,
        capture: `${filePath}/${displayLog.identifier}`,
        capture_bbox: bboxPath ?? undefined,
        bucket: currentBucket,
      };

      const filter = { _id: displayLog._id };

      await this.displayLogService.displayLogModel.updateOne(
        filter,
        updateQuery,
      );

      Log(
        LogType.INFO,
        DetectionDisplayLogService.name,
        this.execute.name,
        LogAction.SUCCESS,
        {
          filter,
          updateQuery,
        },
      );
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
