import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Files } from '../files.schema';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from 'src/shared/request';
import { GetUserCompany } from 'src/shared/general';
import { IUploadFile, UploadFileDto } from './upload.interface';
import { GoogleCloudStorageService } from 'src/shared/google/cloud/google-cloud-storage.service';
import { RESULT } from 'src/shared/result.enum';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';

@Injectable()
export class UploadFileService {
  constructor(
    @InjectModel(Files.name) public model: Model<Files>,
    private googleCloudStorageService: GoogleCloudStorageService,
  ) {}

  executeFromRequest(
    currentRequest: AuthenticatedRequest,
    body: UploadFileDto,
    file: Express.Multer.File,
  ) {
    const result = GetUserCompany(currentRequest);

    return this.execute({
      company: result.company,
      file,
      foldername: body.foldername,
      bucket: body.bucket,
    });
  }

  async execute(parameters: IUploadFile) {
    try {
      const storage = await this.googleCloudStorageService.uploadFile(
        parameters.company
          ? `${parameters.foldername}/${String(parameters.company)}`
          : `default/${parameters.foldername}`,
        uuidv4().toString(),
        parameters.file,
        parameters.bucket,
      );

      const file = await this.model.create({
        company: parameters.company,
        bucket: parameters.bucket,
        path: storage.folder_name,
        file_name: storage.file_name,
        public_url: storage.public_url,
      });

      return { storage, file };
    } catch (error) {
      Log(
        LogType.ERROR,
        UploadFileService.name,
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
