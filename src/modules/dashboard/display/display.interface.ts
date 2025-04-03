import {
  IsDate,
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsOptional,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { DisplayType } from 'src/modules/advertisement/display/display.interface';
import { Transform, Type } from 'class-transformer';
import { Types } from 'mongoose';
import { FromEnum } from 'src/shared/interfaces/paginate.dto';
import { PermissionsEnum } from 'src/modules/permissions/permissions.enum';
import { DisplayLogStatus } from 'src/modules/display-logs/display-logs.interface';

export enum IDashboardDisplayLogType {
  TOTAL_BY_TYPE = 'TOTAL_BY_TYPE',
}

export enum IDashboardDisplayLogQueryTime {
  DAY = 'DAY',
  HOUR_AND_MINUTE = 'HOUR_AND_MINUTE',
}

export class IDashboardDisplayLogQueryDateToStringFormatDto {
  @IsIn(['%Y-%m-%d %H:%M', '%Y-%m-%d'])
  @IsNotEmpty()
  format: string;

  @IsIn(['$start_at'])
  @Transform(() => '$start_at')
  @IsNotEmpty()
  date: string;

  @IsIn(['America/Sao_Paulo'])
  @IsNotEmpty()
  timezone: string;
}

export class IDashboardDisplayLogQueryGroupTotalByTypeDto {
  @IsIn(['$type'])
  @Transform(() => '$type')
  @IsOptional()
  type?: '$type';

  @IsIn(['$advertiser'])
  @Transform(() => '$advertiser')
  @IsOptional()
  advertiser?: '$advertiser';

  @IsIn(['$local'])
  @Transform(() => '$local')
  @IsOptional()
  local?: '$local';

  @IsIn(['$local_unit'])
  @Transform(() => '$local_unit')
  @IsOptional()
  local_unit?: '$local_unit';

  @IsOptional()
  start_at: {
    $dateToString: IDashboardDisplayLogQueryDateToStringFormatDto;
  };
}

export class IDashboardDisplayLogQuerySortDto {
  @IsIn(['_id.start_at', 'total'])
  @IsNotEmpty()
  column: string;

  @IsIn([1, -1])
  @IsNotEmpty()
  value: 1 | -1;
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
  news?: Types.ObjectId[];

  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v) => new Types.ObjectId(v))
      : [new Types.ObjectId(value)],
  )
  advertiser?: Types.ObjectId[];

  @IsOptional()
  @Transform(({ value }) =>
    Array.isArray(value)
      ? value.map((v) => new Types.ObjectId(v))
      : [new Types.ObjectId(value)],
  )
  local?: Types.ObjectId[];

  @IsOptional()
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

  @ValidateIf((o) => o.chart_type === IDashboardDisplayLogType.TOTAL_BY_TYPE)
  @ValidateNested()
  @Type(() => IDashboardDisplayLogQueryGroupTotalByTypeDto)
  query_group_total_by_type: IDashboardDisplayLogQueryGroupTotalByTypeDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => IDashboardDisplayLogQuerySortDto)
  sort: IDashboardDisplayLogQuerySortDto;
}

export interface IDashboardDisplayLog {
  permissions: PermissionsEnum[];
  from: FromEnum;
  chart_type: IDashboardDisplayLogType;
  is_admin: boolean;
  start_at: Date;
  end_at: Date;
  advertisement?: Types.ObjectId[];
  news?: Types.ObjectId[];
  advertiser?: Types.ObjectId[];
  local?: Types.ObjectId[];
  local_unit?: Types.ObjectId[];
  type?: DisplayType[];
  status?: DisplayLogStatus[];
  query_group_total_by_type?: IDashboardDisplayLogQueryGroupTotalByTypeDto;
  sort: IDashboardDisplayLogQuerySortDto;
}

// START TOTAL_BY_TYPE
export interface IDashboardTotalByTypeQueryResult {
  _id: {
    type: DisplayType;
    advertiser: string;
    local: string;
    local_unit: string;
    start_at: string;
  };
  total: number;
}

export interface IDashboardTotalByTypeResume {
  dates: Record<
    string,
    {
      // Agrupa por data (string formatada)
      distributed: Record<DisplayType, number>; // Mantém a distribuição por tipo
      total: number; // Total para esta data
    }
  >;
  total: number; // Total geral de todos os registros
}

export interface IDashboardTotalByTypeResult {
  from: FromEnum;
  parameters: IDashboardDisplayLog;
  resume: IDashboardTotalByTypeResume;
  records: IDashboardTotalByTypeQueryResult[];
}
// END TOTAL_BY_TYPE
