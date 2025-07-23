import { IsNotEmpty, IsString } from 'class-validator';

export class UplodadCameraFileDto {
  @IsNotEmpty()
  @IsString()
  record_id: string;
}

export class IUplodadCameraFile {
  file: Express.Multer.File;
  record_id: string;
}
