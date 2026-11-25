import { IsEnum, IsOptional } from 'class-validator';
import { FromEnum, PaginateDto } from 'src/shared/interfaces/paginate.dto';

export enum NewsOrderBy {
  provider = 'provider',
  keyword = 'keyword',
  createdAt = 'created_at',
  updatedAt = 'updated_at',
  source_name = 'source_name',
  published_at = 'published_at',
}

export class NewsPaginateDto extends PaginateDto {
  @IsOptional()
  @IsEnum(NewsOrderBy)
  order?: NewsOrderBy;

  source_name?: string[];
  title?: string;
}

export interface PaginatedResult<T> {
  from: FromEnum;
  total: number;
  pages: number;
  page: number;
  provider: any;
  parameters: any;
  data: T[];
}
