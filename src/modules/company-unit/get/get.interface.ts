import { IsBoolean, IsNotEmpty } from 'class-validator';
import { FilterQuery } from 'mongoose';
import { CompanyUnitDocument } from '../company-unit.schema';

export enum CompanyUnitFindBy {
  ID = 'ID',
  DOCUMENT = 'DOCUMENT',
}

export class GetCompanyUnitDto {
  @IsBoolean()
  @IsNotEmpty()
  validate: boolean;

  filter: FilterQuery<CompanyUnitDocument>;
}
