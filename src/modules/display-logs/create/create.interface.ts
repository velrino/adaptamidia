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
import { DisplayType } from 'src/modules/display/unit/unit.interface';
import {
  IApiDetectInsightface,
  IApiYoloResult,
} from 'src/shared/detection/detection.interface';

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
  // Firebase
  orientation?: string;
  yolo?: IApiYoloResult;
  insightface?: IApiDetectInsightface;
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

// export interface IFirebaseDisplayLogs {
//   DISPLAY_LOGS: {
//     [key: string]: IFirebaseDisplayLogEntry;
//   };
// }

export interface IFirebaseDisplayLog {
  device_context: {
    app: {
      build_number: string;
      name: string;
      package: string;
      version: string;
    };
    connectivity: string;
    device: {
      brand: string;
      device: string;
      manufacturer: string;
      model: string;
      platform: string;
      product: string;
      release: string;
      sdk_int: number;
    };
    display: {
      device_model: string;
      height: number;
      orientation: string;
      pixel_ratio: number;
      width: number;
    };
    ips: string[];
    timezone_name: string;
    timezone_offset_minutes: number;
    user_agent: string;
  };
  device_id: string;
  end_at: string;
  id: string;
  identifier: string;
  insightface?: {
    age?: {
      average: number;
      max: number;
      min: number;
    };
    gender?: {
      Man: number;
      Woman: number;
    };
    men?: number;
    method?: string;
    total?: number;
    women?: number;
  };
  local: {
    _id: string;
    city: string;
    company: {
      _id: string;
      name: string;
      status: string;
    };
    country: string;
    location: {
      coordinates: [number, number];
      type: 'Point';
    };
    name: string;
    preferences: {
      max_ads_in_sequence: number;
      max_news_before_ad: number;
      min_ads_in_sequence: number;
      min_news_before_ad: number;
      target_size: number;
    };
    state: string;
    status: string;
  };
  people_count: number;
  start_at: string;
  status: string;
  type: 'ADVERTISEMENT' | 'NEWS';
}
