import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Types } from 'mongoose';
import { PermissionsEnum } from 'src/modules/permissions/permissions.enum';
import { FromEnum } from 'src/shared/interfaces/paginate.dto';

export enum IDashboardGeneralType {
  RESUME = 'RESUME',
  ADVERTISEMENT_BY_COMPANY = 'ADVERTISEMENT_BY_COMPANY',
  NEWS_BY_SOURCE_NAME = 'NEWS_BY_SOURCE_NAME',
  DISPLAY_BY_UNIT = 'DISPLAY_BY_UNIT',
  DISPLAY_BY_ADVERTISER = 'DISPLAY_BY_ADVERTISER',
  DISPLAY_BY_ADVERTISEMENT = 'DISPLAY_BY_ADVERTISEMENT',
}

export class IDashboardGeneralSortDto {
  @IsIn(['total'])
  @IsNotEmpty()
  column: string;

  @IsIn([1, -1])
  @IsNotEmpty()
  value: 1 | -1;
}

export class IDashboardGeneralDto {
  @IsNotEmpty()
  @IsEnum(FromEnum)
  from: FromEnum;

  @IsNotEmpty()
  @IsEnum(IDashboardGeneralType)
  chart_type: IDashboardGeneralType;

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
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v) => new Types.ObjectId(v))
      : [new Types.ObjectId(value)],
  )
  company?: Types.ObjectId[];

  @IsOptional()
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
  local_unit?: Types.ObjectId[];

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  news_page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  news_limit: number = 10;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit: number = 10;

  @IsNotEmpty()
  @ValidateIf((o) =>
    [IDashboardGeneralType.ADVERTISEMENT_BY_COMPANY].includes(o.chart_type),
  )
  @ValidateNested()
  @Type(() => IDashboardGeneralSortDto)
  sort: IDashboardGeneralSortDto;
}

export interface IDashboardGeneral {
  from: FromEnum;
  chart_type: IDashboardGeneralType;
  start_at: Date;
  end_at: Date;
  is_admin: boolean;
  company?: Types.ObjectId[];
  advertisement?: Types.ObjectId[];
  local_unit?: Types.ObjectId[];
  permissions: PermissionsEnum[];
  news_page: number;
  news_limit: number;
  page: number;
  limit: number;
  sort: IDashboardGeneralSortDto;
}
