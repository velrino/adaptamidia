import { Transform } from 'class-transformer';
import {
  IsArray,
  IsMongoId,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { PaginateDto } from 'src/shared/interfaces/paginate.dto';

export class ListAdvertisementPaginateDto extends PaginateDto {
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

  @IsOptional()
  @Transform(({ value }) => {
    // Se for string única, transforma em array com 1 elemento
    if (typeof value === 'string') return [value];
    // Se for array, retorna direto
    if (Array.isArray(value)) return value;
    // Se for undefined/null, retorna undefined
    return value;
  })
  @IsArray()
  @IsMongoId({ each: true })
  id?: string[];
}
