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

export enum IDashboardAdvertisementChartType {
  TOTAL_BY_CUSTOM = 'TOTAL_BY_CUSTOM',
  TOTAL_BY_UNIT = 'TOTAL_BY_UNIT',
}

export class IDashboardAdvertisementQuerySortDto {
  @IsIn(['total'])
  @IsNotEmpty()
  column: string;

  @IsIn([1, -1])
  @IsNotEmpty()
  value: 1 | -1;
}

export class IDashboardAdvertisementQueryTotalByCustom {
  @IsIn(['$neighborhood'])
  @Transform(() => '$neighborhood')
  @IsOptional()
  neighborhood?: '$neighborhood';

  @IsIn(['$units'])
  @Transform(() => '$units')
  @IsOptional()
  units?: '$units';

  @IsIn(['$type'])
  @Transform(() => '$type')
  @IsOptional()
  type?: '$type';

  // @IsOptional()
  // start_at: {
  //   $dateToString: IDashboardDisplayLogQueryDateToStringFormatDto;
  // };
}

export class IDashboardAdvertisementDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  limit: number = 20;

  @IsNotEmpty()
  @IsEnum(FromEnum)
  from: FromEnum;

  @IsNotEmpty()
  @IsEnum(IDashboardAdvertisementChartType)
  chart_type: IDashboardAdvertisementChartType;

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
  units?: Types.ObjectId[];

  @ValidateIf(
    (o) => o.chart_type === IDashboardAdvertisementChartType.TOTAL_BY_CUSTOM,
  )
  @ValidateNested()
  @Type(() => IDashboardAdvertisementQueryTotalByCustom)
  query_by_custom: IDashboardAdvertisementQueryTotalByCustom;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => IDashboardAdvertisementQuerySortDto)
  sort: IDashboardAdvertisementQuerySortDto;
}

export interface IDashboardAdvertisement {
  page: number;
  limit: number;
  permissions: PermissionsEnum[];
  from: FromEnum;
  chart_type: IDashboardAdvertisementChartType;
  is_admin: boolean;
  start_at: Date;
  end_at: Date;
  company?: Types.ObjectId[];
  units?: Types.ObjectId[];
  query_by_custom: IDashboardAdvertisementQueryTotalByCustom;
  sort: IDashboardAdvertisementQuerySortDto;
}

export interface IDashboardAdvertisementTotalByNeighborhoodResult {
  from: FromEnum;
  parameters: IDashboardAdvertisement;
  resume: any;
  records: any[];
}
