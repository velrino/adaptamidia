import { Transform } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { NormalizeToArray } from 'src/shared/general';
import { PaginateDto } from 'src/shared/interfaces/paginate.dto';

export class ListAdvertisementPaginateDefaultDto extends PaginateDto {
  @IsOptional()
  @IsString()
  title: string;

  @ValidateIf((o) => o.longitude !== undefined)
  @IsString()
  latitude: string;

  @ValidateIf((o) => o.latitude !== undefined)
  @IsString()
  longitude: string;

  @ValidateIf((o) => o.latitude !== undefined && o.longitude !== undefined)
  @IsString()
  radius: string;

  @IsOptional()
  @IsString({ each: true })
  city?: string[];

  @IsOptional()
  @IsString({ each: true })
  state?: string[];

  @IsOptional()
  @IsString({ each: true })
  country?: string[];

  @IsOptional()
  @IsString({ each: true })
  neighborhood?: string[];
}

export class ListAdvertisementPaginateDto extends ListAdvertisementPaginateDefaultDto {
  @IsOptional()
  @Transform(({ value }) => NormalizeToArray(value))
  @IsArray()
  @IsMongoId({ each: true, message: 'INVALID_ID_FORMAT' })
  id?: string[];

  company?: string[];
}

export class ListAdvertisementPreviewPaginateDto extends ListAdvertisementPaginateDefaultDto {
  @IsNotEmpty()
  @Transform(({ value }) => NormalizeToArray(value))
  @IsArray()
  @IsMongoId({ each: true, message: 'INVALID_ID_FORMAT' })
  id: string[];
}
