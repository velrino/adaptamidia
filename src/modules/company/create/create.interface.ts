import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { CompanyDocumentType } from '../company.interface';

export class CreateCompanyValidator {
  @IsString()
  @IsNotEmpty()
  document: string;

  @IsEnum(CompanyDocumentType)
  @IsNotEmpty()
  document_type: CompanyDocumentType;

  @IsString()
  @IsNotEmpty()
  name: string;
}
