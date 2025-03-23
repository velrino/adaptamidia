import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Files } from '../files.schema';
import { Model } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
import { AuthenticatedRequest } from 'src/shared/request';
import { GetUserCompany } from 'src/shared/general';
import { IUploadFile, UploadFileDto } from './upload.interface';
import { GoogleCloudStorageService } from 'src/shared/google/cloud/google-cloud-storage.service';
import { IGoogleStorageBucket } from 'src/shared/google/cloud/google-cloud-storage.interface';

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
    const company = GetUserCompany(currentRequest);

    return this.execute({
      company,
      file,
      foldername: body.foldername,
    });
  }

  async execute(parameters: IUploadFile) {
    const uploadResult = await this.googleCloudStorageService.uploadFile(
      parameters.company
        ? `${parameters.foldername}/${String(parameters.company)}`
        : `generic/${parameters.foldername}`,
      uuidv4().toString() as string,
      parameters.file,
      IGoogleStorageBucket.XMP_MIDIA,
    );

    return { uploadResult };
  }
}
