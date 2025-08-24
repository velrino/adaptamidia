import { Transform } from 'class-transformer';
import { IsArray, IsIn, IsMongoId, IsOptional } from 'class-validator';
import { NormalizeToArray } from 'src/shared/general';
import { PaginateDto, SortEnum } from 'src/shared/interfaces/paginate.dto';

export class ListDashboardDisplayLogsDto extends PaginateDto {
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
  @IsIn(['advertisement', 'news', 'advertiser', 'local', 'local_unit', 'date'])
  sort_by?: string;
}

export interface IListDashboardDisplayLogsPaginate {
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
  search?: string;
}
