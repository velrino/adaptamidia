import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Files } from '../files.schema';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { GoogleCloudStorageService } from 'src/shared/google/cloud/google-cloud-storage.service';
import { RESULT } from 'src/shared/result.enum';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { IUplodadCameraFile, UplodadCameraFileDto } from './camera.interface';
import { IGoogleStorageBucket } from 'src/shared/google/cloud/google-cloud-storage.interface';

@Injectable()
export class UplodadCameraFileService {
  constructor(
    @InjectModel(Files.name) public model: Model<Files>,
    private googleCloudStorageService: GoogleCloudStorageService,
  ) {}

  executeFromRequest(body: UplodadCameraFileDto, file: Express.Multer.File) {
    return this.execute({
      file,
      record_id: body.record_id,
    });
  }

  async execute(parameters: IUplodadCameraFile) {
    try {
      const storage = await this.googleCloudStorageService.uploadFile(
        `logs/${parameters.record_id}`,
        uuidv4().toString(),
        parameters.file,
        IGoogleStorageBucket.ADAPTA_MIDIA_RECORD,
      );

      //   const file = await this.model.create({
      //     company: parameters.company,
      //     bucket: parameters.bucket,
      //     path: storage.folder_name,
      //     file_name: storage.file_name,
      //     public_url: storage.public_url,
      //   });

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
