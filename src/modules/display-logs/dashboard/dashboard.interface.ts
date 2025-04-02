import {
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
} from 'class-validator';
import { DisplayType } from 'src/modules/advertisement/display/display.interface';
import { DisplayLogStatus } from '../display-logs.interface';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { FromEnum } from 'src/shared/interfaces/paginate.dto';
import { PermissionsEnum } from 'src/modules/permissions/permissions.enum';

export enum IDashboardDisplayLogType {
  TOTAL_BY_TYPE = 'TOTAL_BY_TYPE',
}

export class IDashboardDisplayLogDto {
  @IsNotEmpty()
  @IsEnum(FromEnum)
  from: FromEnum;

  @IsNotEmpty()
  @IsEnum(IDashboardDisplayLogType)
  chart_type: IDashboardDisplayLogType;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  start_at: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  end_at: Date;

  @IsOptional()
  @IsMongoId({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v) => new Types.ObjectId(v))
      : [new Types.ObjectId(value)],
  )
  advertisement?: Types.ObjectId[];

  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v) => new Types.ObjectId(v))
      : [new Types.ObjectId(value)],
  )
  @IsMongoId({ each: true })
  advertiser?: Types.ObjectId[];

  @IsOptional()
  @IsMongoId({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v) => new Types.ObjectId(v))
      : [new Types.ObjectId(value)],
  )
  local?: Types.ObjectId[];

  @IsOptional()
  @IsMongoId({ each: true })
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v) => new Types.ObjectId(v))
      : [new Types.ObjectId(value)],
  )
  local_unit?: Types.ObjectId[];

  @IsOptional()
  @IsEnum(DisplayType, { each: true })
  type?: DisplayType[];

  @IsOptional()
  @IsEnum(DisplayLogStatus, { each: true })
  status?: DisplayLogStatus[];
}

export interface IDashboardDisplayLog {
  permissions: PermissionsEnum[];
  from: FromEnum;
  chart_type: IDashboardDisplayLogType;
  is_admin: boolean;
  start_at: Date;
  end_at: Date;
  advertisement?: Types.ObjectId[];
  advertiser?: Types.ObjectId[];
  local?: Types.ObjectId[];
  local_unit?: Types.ObjectId[];
  type?: DisplayType[];
  status?: DisplayLogStatus[];
}

// START TOTAL_BY_TYPE
export interface IDashboardTotalByTypeQueryResult {
  _id: {
    type: DisplayType;
    advertiser: string;
    local: string;
    local_unit: string;
  };
  total: number;
}

export interface IDashboardTotalByTypeResume {
  distributed: Record<DisplayType, number>;
  total: number;
}

export interface IDashboardTotalByTypeResult {
  from: FromEnum;
  parameters: IDashboardDisplayLog;
  resume: IDashboardTotalByTypeResume;
  query_result: IDashboardTotalByTypeQueryResult[];
}
// END TOTAL_BY_TYPE
