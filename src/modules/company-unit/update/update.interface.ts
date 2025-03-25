import {
  IsMongoId,
  IsNotEmpty,
  IsString,
  IsNumber,
  ValidateNested,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CompanyUnitStatus, CompanyUnitType } from '../company-unit.interface';

export class UpdateCompanyUnitDevices {
  @IsNumber()
  @IsNotEmpty()
  smart_tv: number;
}

export class UpdateCompanyUnitValidator {
  @IsNotEmpty()
  @IsMongoId()
  company_id: string;

  @IsEnum(CompanyUnitType)
  @IsNotEmpty()
  type: CompanyUnitType;

  @IsString()
  @IsNotEmpty()
  full_address: string;

  @IsString()
  @IsOptional()
  complement: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @ValidateNested()
  @Type(() => UpdateCompanyUnitDevices)
  @IsNotEmpty()
  devices: UpdateCompanyUnitDevices;

  @IsNumber()
  @IsNotEmpty()
  max_capacity: number;

  @IsEnum(CompanyUnitStatus)
  @IsNotEmpty()
  status: CompanyUnitStatus;
}
