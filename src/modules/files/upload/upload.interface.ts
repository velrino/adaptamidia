import { Types } from 'mongoose';

import { IsNotEmpty, IsString, IsMongoId, IsOptional } from 'class-validator';

export class UploadFileDto {
  @IsNotEmpty()
  @IsString()
  foldername: string;

  @IsOptional()
  @IsMongoId()
  company_id: string;
}

export class IUploadFile {
  file: Express.Multer.File;
  foldername: string;
  company: Types.ObjectId | null;
}
