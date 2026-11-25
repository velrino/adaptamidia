import { IsEnum, IsMongoId, Matches } from 'class-validator';
import { DisplayType } from 'src/modules/display/unit/unit.interface';

export class UplodadCameraFileDto {
  @IsMongoId()
  record: string;

  @IsMongoId()
  unit: string;

  @Matches(/^[\w.:-]{1,128}$/)
  timestamp: string;

  @IsEnum(DisplayType)
  type: DisplayType;
}

export class IUplodadCameraFile {
  file: Express.Multer.File;
  timestamp: string;
  type: DisplayType;
  unit: string;
  record: string;
}
