import { IsBoolean, IsNotEmpty } from 'class-validator';
import { CompanyDocument } from '../company.schema';
import { FilterQuery } from 'mongoose';

export enum CompanyFindBy {
  ID = 'ID',
  DOCUMENT = 'DOCUMENT',
}

export class GetCompanyDto {
  @IsBoolean()
  @IsNotEmpty()
  validate: boolean;

  filter: FilterQuery<CompanyDocument>;
}
