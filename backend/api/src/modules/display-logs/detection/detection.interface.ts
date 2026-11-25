import { IsNotEmpty, IsString } from 'class-validator';
import { Types } from 'mongoose';

export interface IDetectionDisplayLog {
  id: Types.ObjectId;
  return: boolean;
}

export interface IDetectionDisplayLogProcessor {
  parameters: IDetectionDisplayLog;
}

export class IDetectionDisplayLogDto {
  @IsNotEmpty()
  @IsString()
  id: string;
}
