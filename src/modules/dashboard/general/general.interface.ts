import { Transform, Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  Min,
} from 'class-validator';
import { Types } from 'mongoose';
import { PermissionsEnum } from 'src/modules/permissions/permissions.enum';
import { FromEnum } from 'src/shared/interfaces/paginate.dto';

export enum IDashboardGeneralType {
  COMPLETE = 'COMPLETE',
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
  advertisement_page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  advertisement_limit: number = 10;
}

export interface IDashboardGeneral {
  from: FromEnum;
  chart_type: IDashboardGeneralType;
  start_at: Date;
  end_at: Date;
  is_admin: boolean;
  company?: Types.ObjectId[];
  permissions: PermissionsEnum[];
  news_page: number;
  news_limit: number;
  advertisement_page: number;
  advertisement_limit: number;
}
