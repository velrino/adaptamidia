import { RESULT } from 'src/shared/result.enum';
import { CompanyDocumentType } from './company.interface';
import { isCPF, isCNPJ } from 'validation-br';

export class CompanyHelper {
  static removeFormatting(document: string): string {
    return document.replace(/\D/g, '');
  }

  static documentValidator(
    type: CompanyDocumentType,
    value: string,
  ): RESULT | null {
    if (!CompanyDocumentType[type]) {
      return RESULT.COMPANY_INVALID_DOCUMENT_TYPE;
    }

    if (type === CompanyDocumentType.CNPJ && !isCNPJ(value)) {
      return RESULT.COMPANY_INVALID_DOCUMENT;
    }

    if (type === CompanyDocumentType.CPF && !isCPF(value)) {
      return RESULT.COMPANY_INVALID_DOCUMENT;
    }

    return null;
  }
}
