import { IsOptional, IsString } from 'class-validator';
import { PaginateDto } from 'src/shared/interfaces/paginate.dto';

export class GroupCompanyUnitPaginateDto extends PaginateDto {
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

export interface IGroupedCompanyUnitResult {
  _id: {
    neighborhood: string;
    city: string;
    state: string;
    country: string;
  };
  count: number;
}
