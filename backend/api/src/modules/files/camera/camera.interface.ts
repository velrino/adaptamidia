import { IsNotEmpty, IsString } from 'class-validator';

export class UplodadCameraFileDto {
  @IsNotEmpty()
  @IsString()
  record: string;

  @IsNotEmpty()
  @IsString()
  unit: string;

  @IsNotEmpty()
  @IsString()
  timestamp: string;

  @IsNotEmpty()
  @IsString()
  type: string;
}

export class IUplodadCameraFile {
  file: Express.Multer.File;
  timestamp: string;
  type: string;
  unit: string;
  record: string;
}
