import { IsNotEmpty, IsString } from 'class-validator';

export class CreateLeadValidator {
  @IsNotEmpty()
  @IsString()
  contactType: string;

  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  company: string;

  @IsNotEmpty()
  @IsString()
  business: string;

  @IsNotEmpty()
  @IsString()
  message: string;
}