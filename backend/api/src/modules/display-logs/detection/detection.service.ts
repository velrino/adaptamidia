import { Process, Processor } from '@nestjs/bull';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { QueuesEnum } from 'src/modules/queue/queue.interface';
import { News, NewsDocument } from 'src/modules/news/news.schema';
import { FlattenMaps, Model } from 'mongoose';
import {
  IDetectionDisplayLog,
  IDetectionDisplayLogDto,
  IDetectionDisplayLogProcessor,
} from './detection.interface';
import { Job } from 'bull';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { GetDisplayLogService } from '../get/get.service';
import { DetectionService } from 'src/shared/detection/detection.service';
import { GoogleCloudStorageService } from 'src/shared/google/cloud/google-cloud-storage.service';
import { IGoogleStorageBucket } from 'src/shared/google/cloud/google-cloud-storage.interface';
import {
  ApiDetectInsightfaceDefault,
  IApiDetectInsightface,
  IApiYoloResult,
} from 'src/shared/detection/detection.interface';
import { DisplayLogStatus } from '../display-logs.interface';
import { DisplayLog, DisplayLogDocument } from '../display-logs.schema';
import { RESULT } from 'src/shared/result.enum';
import { AuthenticatedRequest, CustomRequest } from 'src/shared/request';
import { ConvertToObjectId } from 'src/shared/general';
import { QueueService } from 'src/modules/queue/queue.service';

@Processor(QueuesEnum.DISPLAY_LOG_DETECT_IMAGE)
@Injectable()
export class DetectionDisplayLogService {
  constructor(
    @InjectModel(News.name)
    readonly newsModel: Model<NewsDocument>,
    private readonly displayLogService: GetDisplayLogService,
    private readonly detectionService: DetectionService,
    private readonly googleCloudStorageService: GoogleCloudStorageService,
    private readonly queueService: QueueService,
  ) {}

  @Process({ concurrency: 5 })
  async processJob(job: Job<IDetectionDisplayLogProcessor>) {
    try {
      console.log({ DetectionDisplayLogService: job.data });
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
      throw error;
    }
  }

  executeFromAuthenticatedRequest(
    currentRequest: CustomRequest, //AuthenticatedRequest,
    parameters: IDetectionDisplayLogDto,
  ) {
    try {
      //   VerifyUserCanProced({
      //     need_company: parameters.company_id,
      //     user_permissions: currentRequest.user.user.permissions,
      //     user_companies: currentRequest.user.user.companies,
      //     need_permissions: [],
      //   });

      return this.execute({
        id: ConvertToObjectId(parameters.id),
        return: true,
      });
    } catch (error) {
      throw new HttpException(
        error?.message || RESULT.DISPLAY_LOG_DETECTION_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async generateSignedCaptureUrls(
    item: FlattenMaps<DisplayLogDocument> &
      Required<{
        _id: FlattenMaps<unknown>;
      }> & {
        __v: number;
      },
    googleCloudStorageService: GoogleCloudStorageService,
  ): Promise<any> {
    const expiresInMs = 60 * 60 * 1000; // 1 hour
    let capturePublicUrl: string | null = null;
    let captureBboxPublicUrl: string | null = null;

    if (item.capture) {
      capturePublicUrl = await googleCloudStorageService.getSignedUrlSafe(
        item.capture,
        item.bucket as IGoogleStorageBucket,
        false,
        expiresInMs,
      );
    }

    if (item.capture_bbox) {
      captureBboxPublicUrl = await googleCloudStorageService.getSignedUrlSafe(
        item.capture_bbox,
        item.bucket as IGoogleStorageBucket,
        false,
        expiresInMs,
      );
    }

    return {
      ...item,
      capture: capturePublicUrl || null,
      capture_bbox: captureBboxPublicUrl || null,
    };
  }

  async execute(payload: IDetectionDisplayLog) {
    try {
      let errorMessage: string | null = null;
      const displayLog = await this.displayLogService.get({ _id: payload.id });

      // Baixar imagem do Google Cloud Storage
      const recordId =
        displayLog?.news?._id.toString() ||
        displayLog?.advertisement?._id.toString();

      const currentBucket =
        displayLog.bucket || IGoogleStorageBucket.ADAPTA_MIDIA_RECORD;
      const capturePath =
        displayLog.capture ||
        `logs/${displayLog.local_unit._id.toString()}/${displayLog.type.toLowerCase()}/${recordId}/${displayLog.identifier}`;
      const filePath = capturePath.slice(0, capturePath.lastIndexOf('/'));

      const imageFile =
        await this.googleCloudStorageService.downloadRecordFileAsMulter(
          currentBucket,
          capturePath,
        );

      let status = displayLog.status;
      // Enviar para detecção YOLO
      let yolo: IApiYoloResult | undefined;
      // const deepface: IApiDeepFaceAnalysisResult = ApiDeepFaceAnalysisResult;
      let insightface: IApiDetectInsightface | undefined;
      let detectPeopleBbox: Buffer | null = null;

      try {
        yolo = await this.detectionService.detectYolo(imageFile);
        status = DisplayLogStatus.DETECTION_YOLO;

        if (yolo.people === 0) {
          insightface = ApiDetectInsightfaceDefault;
          status = DisplayLogStatus.DETECTION_INSIGHTFACE;
        } else {
          insightface =
            await this.detectionService.detectInsightface(imageFile);
          status = DisplayLogStatus.DETECTION_INSIGHTFACE;
        }

        detectPeopleBbox =
          await this.detectionService.detectPeopleBbox(imageFile);
      } catch (error) {
        if (!yolo) throw error;
        Log(
          LogType.ERROR,
          DetectionDisplayLogService.name,
          this.execute.name,
          LogAction.FAILED,
          { displayLogId: payload.id, status, error },
        );
        errorMessage = error.message || String(error);
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
          errorMessage = error.message || String(error);
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
          | 'capture'
          | 'capture_bbox'
          | 'insightface'
          | 'bucket'
        >
      > = {
        status,
        yolo,
        insightface,
        capture: capturePath,
        capture_bbox: bboxPath ?? undefined,
        bucket: currentBucket,
      };

      const filter = { _id: displayLog._id };

      if (errorMessage) {
        Log(
          LogType.ERROR,
          DetectionDisplayLogService.name,
          this.execute.name,
          LogAction.FAILED,
          { about: 'BEFORE_RETURN', payload, errorMessage },
        );
      }

      const updateColumns = {
        $set: updateQuery,
        $unset: { processing_lock: 1, processing_instance: 1 },
      };

      if (payload.return === false) {
        const result = await this.displayLogService.displayLogModel.updateOne(
          filter,
          updateColumns,
        );

        if (process.env.DISPLAY_AUTO_INSIGHTS !== 'false') {
          await this.queueService.addQueueDisplayLogInsight({
            id: String(displayLog._id),
          });
        }

        return result;
      }

      const result = await this.displayLogService.displayLogModel
        .findOneAndUpdate(filter, updateColumns, { new: true })
        .select(['-data'])
        .populate({
          path: 'news',
          select: [
            '_id',
            'description',
            'title',
            'source_name',
            'author',
            'image',
            'url',
          ],
        })
        .populate({
          path: 'advertisement',
          select: ['_id', 'description', 'title', 'items'],
        })
        .populate({
          path: 'local_unit',
          select: ['_id', 'full_address', 'type', 'name'],
        })
        .lean();

      if (!result) {
        throw new HttpException(
          RESULT.DISPLAY_LOG_DETECTION_UPDATE_FAILED,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

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

      return {
        result: await this.generateSignedCaptureUrls(
          result,
          this.googleCloudStorageService,
        ),
        error: errorMessage,
      };
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
