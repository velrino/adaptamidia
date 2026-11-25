import { Types } from 'mongoose';

import {
  IsNotEmpty,
  IsString,
  IsMongoId,
  IsOptional,
  IsEnum,
  IsBoolean,
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

  // Otimiza vídeos MP4 via FFmpeg (opcional, padrão true se omitido)
  @IsOptional()
  @IsBoolean()
  optimize_video?: boolean;
}

export class IUploadFile {
  file: Express.Multer.File;
  foldername: string;
  bucket: IGoogleStorageBucket;
  company: Types.ObjectId | null;
  optimize_video?: boolean;
}
