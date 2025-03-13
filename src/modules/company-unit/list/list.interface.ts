import { IsOptional, IsString, ValidateIf } from 'class-validator';
import { PaginateDto } from 'src/shared/interfaces/paginate.dto';

export class ListCompanyUnitPaginateDto extends PaginateDto {
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
