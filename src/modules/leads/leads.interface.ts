import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateLeadValidator {
  @IsOptional()
  @IsString()
  contactType?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  business?: string;

  @IsOptional()
  @IsString()
  message?: string;
}
