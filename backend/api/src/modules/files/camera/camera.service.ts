import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GoogleCloudStorageService } from 'src/shared/google/cloud/google-cloud-storage.service';
import { RESULT } from 'src/shared/result.enum';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { IUplodadCameraFile, UplodadCameraFileDto } from './camera.interface';
import { IGoogleStorageBucket } from 'src/shared/google/cloud/google-cloud-storage.interface';
import { InjectModel } from '@nestjs/mongoose';
import {
  DisplayLog,
  DisplayLogDocument,
} from 'src/modules/display-logs/display-logs.schema';
import { Model, Types } from 'mongoose';
import { DisplayType } from 'src/modules/display/unit/unit.interface';

@Injectable()
export class UplodadCameraFileService {
  constructor(
    private googleCloudStorageService: GoogleCloudStorageService,
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
    try {
      const currentBucket = IGoogleStorageBucket.ADAPTA_MIDIA_RECORD;

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

      const typeUpper = parameters.type.toUpperCase() as DisplayType;

      const filter: Record<string, any> = {
        local_unit: new Types.ObjectId(parameters.unit),
        type: parameters.type,
        identifier: parameters.timestamp,
      };

      const recordId = new Types.ObjectId(parameters.record);
      const typeToFieldMap: Record<DisplayType, string> = {
        [DisplayType.NEWS]: 'news',
        [DisplayType.ADVERTISEMENT]: 'advertisement',
      };

      const field = typeToFieldMap[typeUpper];
      if (field) {
        filter[field] = recordId;
      }

      if (storage?.path) {
        const result = await this.displayLogModel.updateOne(
          filter,
          {
            $set: {
              capture: storage.path,
              bucket: currentBucket,
            },
          },
          { upsert: false }, // Evita criar um novo se não encontrar
        );

        if (result.matchedCount === 0) {
          Log(
            LogType.INFO,
            UplodadCameraFileService.name,
            'NOT_FOUND_DISPLAY_LOG',
            LogAction.EMPTY,
            { storage, filter },
          );
        }
      }

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
