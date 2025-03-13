import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CompanyDocumentType, CompanyType } from '../company.interface';

export class CreateCompanyValidator {
  @IsString()
  @IsNotEmpty()
  document: string;

  @IsEnum(CompanyDocumentType)
  @IsNotEmpty()
  document_type: CompanyDocumentType;

  @IsEnum(CompanyType)
  @IsNotEmpty()
  type: CompanyType;

  @IsString()
  @IsNotEmpty()
  name: string;
}
