import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GoogleCloudStorageService } from 'src/shared/google/cloud/google-cloud-storage.service';
import { RESULT } from 'src/shared/result.enum';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { IUplodadCameraFile, UplodadCameraFileDto } from './camera.interface';
import { InjectModel } from '@nestjs/mongoose';
import {
  DisplayLog,
  DisplayLogDocument,
} from 'src/modules/display-logs/display-logs.schema';
import { Model, Types } from 'mongoose';
import { DisplayType } from 'src/modules/display/unit/unit.interface';
import { QueueService } from 'src/modules/queue/queue.service';

@Injectable()
export class UplodadCameraFileService {
  constructor(
    private googleCloudStorageService: GoogleCloudStorageService,
    private readonly queueService: QueueService,
    @InjectModel(DisplayLog.name)
    public readonly displayLogModel: Model<DisplayLogDocument>,
  ) {}

  executeFromRequest(body: UplodadCameraFileDto, file: Express.Multer.File) {
    return this.execute({
      ...body,
      file,
    });
  }

  async execute(parameters: IUplodadCameraFile) {
    if (
      !parameters.file ||
      !['image/jpeg', 'image/png', 'image/webp'].includes(
        parameters.file.mimetype,
      )
    ) {
      throw new BadRequestException(
        'A câmera deve enviar uma imagem JPEG, PNG ou WebP.',
      );
    }

    const field =
      parameters.type === DisplayType.NEWS ? 'news' : 'advertisement';
    const log = await this.displayLogModel
      .findOne({
        local_unit: new Types.ObjectId(parameters.unit),
        type: parameters.type,
        identifier: parameters.timestamp,
        [field]: new Types.ObjectId(parameters.record),
      })
      .select('_id')
      .lean<{ _id: Types.ObjectId }>();

    if (!log)
      throw new NotFoundException('Registro de exibição ainda não encontrado.');

    try {
      const currentBucket =
        this.googleCloudStorageService.getDisplayCaptureBucket();

      const storage = await this.googleCloudStorageService.uploadFile(
        `logs/${parameters.unit}/${parameters.type.toLowerCase()}/${parameters.record}`,
        parameters.timestamp,
        parameters.file,
        currentBucket,
      );

      Log(
        LogType.INFO,
        UplodadCameraFileService.name,
        this.execute.name,
        LogAction.SUCCESS,
        { storage },
      );

      await this.displayLogModel.updateOne(
        { _id: log._id },
        { $set: { capture: storage.path, bucket: currentBucket } },
      );

      const job = await this.queueService.addQueueDetectImage(
        { id: log._id, return: false },
        { jobId: `capture-${log._id}` },
      );
      if (job instanceof Error) throw job;

      return { storage };
    } catch (error) {
      Log(
        LogType.ERROR,
        UplodadCameraFileService.name,
        this.execute.name,
        LogAction.FAILED,
        { parameters: { ...parameters, file: null }, error },
      );
      throw new HttpException(
        error?.message || RESULT.UPLOAD_FILE_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
