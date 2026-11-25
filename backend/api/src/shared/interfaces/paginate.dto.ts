import {
  IsOptional,
  IsInt,
  Min,
  IsDateString,
  IsBoolean,
  IsEnum,
  IsMongoId,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum FromEnum {
  DATABASE = 'DATABASE',
  CACHE = 'CACHE',
}

export enum SortEnum {
  ASC = 'asc',
  DESC = 'desc',
}

export enum ActionType {
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
}

export class FindByIdParamsDto {
  @IsMongoId({ message: 'INVALID_ID_FORMAT' })
  id: string;
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

export interface ICheckExist {
  id: string;
  exists: boolean;
}

export interface IPaginate {
  page: number;
  limit: number;
  start_date?: string;
  end_date?: string;
  cache: boolean;
  sort?: SortEnum;
  popular_time?: boolean;
}
