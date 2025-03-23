import { Types } from 'mongoose';

import {
  IsNotEmpty,
  IsString,
  IsMongoId,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { IGoogleStorageBucket } from 'src/shared/google/cloud/google-cloud-storage.interface';

export class UploadFileDto {
  @IsNotEmpty()
  @IsString()
  foldername: string;

  @IsNotEmpty()
  @IsEnum(IGoogleStorageBucket)
  bucket: IGoogleStorageBucket;

  @IsOptional()
  @IsMongoId()
  company_id: string;
}

export class IUploadFile {
  file: Express.Multer.File;
  foldername: string;
  bucket: IGoogleStorageBucket;
  company: Types.ObjectId | null;
}
