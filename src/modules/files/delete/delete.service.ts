import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Files } from '../files.schema';
import { Model } from 'mongoose';
import { AuthenticatedRequest } from 'src/shared/request';
import { GoogleCloudStorageService } from 'src/shared/google/cloud/google-cloud-storage.service';
import { RESULT } from 'src/shared/result.enum';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { DeleteFileDto, DeleteFileType, IDeleteFile } from './delete.interface';
import { GetUserCompany } from 'src/shared/general';

@Injectable()
export class DeleteFileService {
  constructor(
    @InjectModel(Files.name) public model: Model<Files>,
    private googleCloudStorageService: GoogleCloudStorageService,
  ) {}

  executeFromRequest(
    currentRequest: AuthenticatedRequest,
    body: DeleteFileDto,
  ) {
    const company = GetUserCompany(currentRequest);

    return this.execute({
      type: DeleteFileType.ID,
      company: company,
      value: body.id,
    });
  }

  async execute(parameters: IDeleteFile) {
    try {
      const getFile = await this.model.findOne({
        _id: parameters.value,
      });

      if (!getFile) {
        throw new HttpException(RESULT.FILE_NOT_FOUND, HttpStatus.NOT_FOUND);
      }

      await this.googleCloudStorageService.deleteFile(
        `${getFile.path}/${getFile.file_name}`,
        getFile.bucket,
      );

      await this.model.deleteOne({
        _id: getFile._id,
      });

      return { result: RESULT.FILE_DELETED };
    } catch (error) {
      Log(
        LogType.ERROR,
        DeleteFileService.name,
        this.execute.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.DELETE_FILE_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
