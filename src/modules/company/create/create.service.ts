import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuthenticatedRequest } from 'src/shared/request';
import { Company } from '../company.schema';
import { CreateCompanyValidator } from './create.interface';
import { CompanyHelper } from '../company.helper';
import { RESULT } from 'src/shared/result.enum';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
// import { CompanyDocumentType, CompanyType } from '../company.interface';

@Injectable()
export class CreateCompanyService {
  constructor(@InjectModel(Company.name) public model: Model<Company>) {}

  // async onApplicationBootstrap() {
  //   await this.execute(
  //     {
  //       document_type: CompanyDocumentType.CNPJ,
  //       document: '24370370000189',
  //       name: 'XMP MEDIA',
  //       type: CompanyType.SUDO,
  //     },
  //     false,
  //   );
  // }

  executeFromRequest(
    currentRequest: AuthenticatedRequest,
    parameters: CreateCompanyValidator,
  ) {
    return this.execute(parameters);
  }

  validator(parameters: CreateCompanyValidator) {
    const resultDocumentValidator = CompanyHelper.documentValidator(
      parameters.document_type,
      parameters.document,
    );

    if (resultDocumentValidator) {
      throw new HttpException(
        resultDocumentValidator,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async execute(parameters: CreateCompanyValidator, validate = true) {
    try {
      parameters.document = CompanyHelper.removeFormatting(parameters.document);

      this.validator(parameters);

      const checkExist = await this.model.findOne({
        document: parameters.document,
      });

      if (checkExist) {
        if (!validate) return;
        throw new HttpException(
          RESULT.COMPANY_DOCUMENT_ALREADY_EXISTS,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      const created = await this.model.create(parameters);

      return created;
    } catch (error) {
      Log(
        LogType.ERROR,
        CreateCompanyService.name,
        this.execute.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.COMPANY_NOT_CREATED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
