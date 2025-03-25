import {
  IsOptional,
  IsInt,
  Min,
  IsDateString,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum FromEnum {
  DB = 'DB',
  CACHE = 'CACHE',
}

export enum SortEnum {
  ASC = 'asc',
  DESC = 'desc',
}

export class PaginateDto {
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

  @IsOptional()
  @IsDateString()
  start_date?: string;

  @IsOptional()
  @IsDateString()
  end_date?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true') // Retorna true apenas se a query string for 'true'
  cache: boolean = true;

  @IsOptional()
  @IsEnum(SortEnum)
  sort?: SortEnum;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value;
  })
  popular_time?: boolean;
}

export class PaginatedResponseDto<T> {
  total: number;
  page: number;
  limit: number;
  pages: number;
  data: T[];
}
