import { Transform } from 'class-transformer';
import { IsArray, IsMongoId, IsOptional } from 'class-validator';
import { NormalizeToArray } from 'src/shared/general';
import { PaginateDto } from 'src/shared/interfaces/paginate.dto';

export class ListDisplayLogsPaginateDto extends PaginateDto {
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
}
