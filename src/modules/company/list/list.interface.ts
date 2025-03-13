import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginateDto } from 'src/shared/interfaces/paginate.dto';
import { CompanyType } from '../company.interface';

export class ListCompanyPaginateDto extends PaginateDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsEnum(CompanyType)
  @IsOptional()
  type: CompanyType;
}
