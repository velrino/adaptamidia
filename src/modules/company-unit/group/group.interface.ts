import { IsOptional, IsString } from 'class-validator';
import { PaginateDto } from 'src/shared/interfaces/paginate.dto';

export class GroupCompanyUnitPaginateDto extends PaginateDto {
  @IsOptional()
  @IsString()
  city: string;

  @IsOptional()
  @IsString()
  state: string;

  @IsOptional()
  @IsString()
  country: string;
}

export interface IGroupedCompanyUnitResult {
  _id: {
    city: string;
    state: string;
    country: string;
  };
  count: number;
}
