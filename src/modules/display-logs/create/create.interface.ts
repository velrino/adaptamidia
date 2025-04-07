import { DisplayLogStatus } from '../display-logs.interface';
import {
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsString,
  ValidateIf,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { DateTime } from 'luxon';
import { AdvertisementStatus } from 'src/modules/advertisement/advertisement.interface';
import { CompanyUnitStatus } from 'src/modules/company-unit/company-unit.interface';
import { DisplayType } from 'src/modules/display/unit/display.interface';

export class ICreateDisplayLogDto {
  @Transform(({ value }) => (value ? value : String()))
  @IsString()
  identifier: string;

  @IsNotEmpty()
  @IsMongoId()
  id: string;

  @IsNotEmpty()
  @IsMongoId()
  local: string;

  @IsNotEmpty()
  @IsEnum(DisplayType)
  type: DisplayType;

  @IsNotEmpty()
  @IsEnum(DisplayLogStatus)
  status: DisplayLogStatus;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  start_at: Date;

  @ValidateIf(
    (o) => o.status !== undefined && o.status === DisplayLogStatus.FINISHED,
  )
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  end_at: Date;
}

export interface ICreateDisplayLog {
  id: Types.ObjectId;
  local: Types.ObjectId;
  type: DisplayType;
  status: DisplayLogStatus;
  identifier: string;
  ip: string;
  user_agent: string;
  data: any;
  start_at: DateTime;
  end_at?: DateTime;
  user?: Types.ObjectId;
}

export interface ICreateDisplayLogProcessor {
  parameters: ICreateDisplayLog;
}

export interface IAdvertisementEssential {
  _id: Types.ObjectId;
  status: AdvertisementStatus;
  company: {
    _id: Types.ObjectId;
    status: CompanyUnitStatus;
  };
}
