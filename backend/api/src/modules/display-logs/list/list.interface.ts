import { Transform } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsOptional,
  IsIn,
  IsBoolean,
  IsString,
} from 'class-validator';
import { NormalizeToArray } from 'src/shared/general';
import { PaginateDto, SortEnum } from 'src/shared/interfaces/paginate.dto';

export class ListDisplayLogsPaginateDto extends PaginateDto {
  company?: string[];

  @IsOptional()
  @Transform(({ value }) => NormalizeToArray(value))
  @IsArray()
  @IsMongoId({ each: true, message: 'INVALID_ID_FORMAT' })
  id?: string[];

  @IsOptional()
  @Transform(({ value }) => NormalizeToArray(value))
  @IsArray()
  @IsMongoId({ each: true, message: 'INVALID_ID_FORMAT' })
  local_unit?: string[];

  @IsOptional()
  @Transform(({ value }) => NormalizeToArray(value))
  @IsArray()
  @IsMongoId({ each: true, message: 'INVALID_ID_FORMAT' })
  news?: string[];

  @IsOptional()
  @Transform(({ value }) => NormalizeToArray(value))
  @IsArray()
  @IsMongoId({ each: true, message: 'INVALID_ID_FORMAT' })
  advertisement?: string[];

  @IsOptional()
  @Transform(({ value }) => NormalizeToArray(value))
  @IsArray()
  @IsMongoId({ each: true, message: 'INVALID_ID_FORMAT' })
  advertiser?: string[];

  @IsOptional()
  @IsIn([
    'advertisement',
    'news',
    'advertiser',
    'local',
    'local_unit',
    'seconds',
    'start_at',
    'end_at',
    'identifier',
    'ip',
    'user_agent',
    'type',
    'status',
    'created_at',
    'updated_at',
  ])
  sort_by?: string;

  @IsBoolean()
  @IsOptional()
  get_signed_url: boolean = false;

  @IsOptional()
  @IsString()
  @Transform(({ value }) => value?.trim())
  search?: string;
}

export interface IListDisplayLogsPaginate {
  permissions: string[];
  page: number;
  limit: number;
  start_date?: string;
  end_date?: string;
  cache: boolean;
  sort?: SortEnum;
  popular_time?: boolean;
  company?: string[];
  id?: string[];
  local_unit?: string[];
  news?: string[];
  advertisement?: string[];
  advertiser?: string[];
  sort_by?: string;
  get_signed_url: boolean;
  search?: string;
}
