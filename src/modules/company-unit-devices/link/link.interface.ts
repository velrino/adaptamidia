import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LinkDeviceWithCompanyUnitDto {
  @IsNotEmpty()
  @IsString()
  company_unit_identifier: string;

  @IsNotEmpty()
  @IsString()
  identifier: string;

  @IsOptional()
  data?: any;
}

export interface ILinkDeviceWithCompanyUnitService {
  company_unit_identifier: string;
  identifier: string;
  data?: any;
  headers?: any;
}
