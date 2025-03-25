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

export class CreateCompanyUnitDevices {
  @IsNumber()
  @IsNotEmpty()
  smart_tv: number;
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
  @IsOptional()
  complement: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @ValidateNested()
  @Type(() => CreateCompanyUnitDevices)
  @IsNotEmpty()
  devices: CreateCompanyUnitDevices;

  @IsNumber()
  @IsNotEmpty()
  max_capacity: number;

  @IsEnum(CompanyUnitStatus)
  @IsNotEmpty()
  status: CompanyUnitStatus;
}
