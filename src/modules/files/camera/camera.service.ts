import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { GoogleCloudStorageService } from 'src/shared/google/cloud/google-cloud-storage.service';
import { RESULT } from 'src/shared/result.enum';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { IUplodadCameraFile, UplodadCameraFileDto } from './camera.interface';
import { IGoogleStorageBucket } from 'src/shared/google/cloud/google-cloud-storage.interface';

@Injectable()
export class UplodadCameraFileService {
  constructor(private googleCloudStorageService: GoogleCloudStorageService) {}

  executeFromRequest(body: UplodadCameraFileDto, file: Express.Multer.File) {
    return this.execute({
      ...body,
      file,
    });
  }

  async execute(parameters: IUplodadCameraFile) {
    try {
      const storage = await this.googleCloudStorageService.uploadFile(
        `logs/${parameters.unit}/${parameters.type.toLowerCase()}/${parameters.record}`,
        parameters.timestamp,
        parameters.file,
        IGoogleStorageBucket.ADAPTA_MIDIA_RECORD,
      );

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
