import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { CompanyUnitDeviceType } from '../company-unit.interface';

export class LinkDeviceWithCompanyUnitDto {
  @IsNotEmpty()
  @IsString()
  company_unit_identifier: string;

  @IsNotEmpty()
  @IsString()
  identifier: string;

  @IsOptional()
  @IsEnum(CompanyUnitDeviceType)
  type?: CompanyUnitDeviceType;

  @IsOptional()
  data?: any;
}

export interface ILinkDeviceWithCompanyUnitService {
  company_unit_identifier: string;
  identifier: string;
  type?: string;
  data?: any;
  headers?: any;
}
