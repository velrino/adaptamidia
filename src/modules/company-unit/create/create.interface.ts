import {
  IsMongoId,
  IsNotEmpty,
  IsString,
  IsNumber,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CompanyUnitType } from '../company-unit.interface';

export class CreateCompanyUnitAverageVisitors {
  @IsNumber()
  @IsNotEmpty()
  daily: number;

  @IsNumber()
  @IsNotEmpty()
  weekly: number;

  @IsNumber()
  @IsNotEmpty()
  monthly: number;
}

export class CreateCompanyUnitValidator {
  @IsNotEmpty()
  @IsMongoId()
  company_id: string;

  @IsEnum(CompanyUnitType)
  @IsNotEmpty()
  type: CompanyUnitType;

  @IsString()
  @IsNotEmpty()
  address: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @ValidateNested()
  @Type(() => CreateCompanyUnitAverageVisitors)
  @IsNotEmpty()
  average_visitors: CreateCompanyUnitAverageVisitors;

  @IsNumber()
  @IsNotEmpty()
  max_capacity: number;
}
