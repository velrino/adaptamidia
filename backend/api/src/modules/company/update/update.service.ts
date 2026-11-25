import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AuthenticatedRequest } from 'src/shared/request';
import { Company } from '../company.schema';
import { CompanyHelper } from '../company.helper';
import { RESULT } from 'src/shared/result.enum';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { UpdateCompanyValidator } from './update.interface';
import { GetCompanyService } from '../get/get.service';

@Injectable()
export class UpdateCompanyService {
  constructor(
    @InjectModel(Company.name) public model: Model<Company>,
    private getCompanyService: GetCompanyService,
  ) {}

  executeFromRequest(
    currentRequest: AuthenticatedRequest,
    id: string,
    parameters: UpdateCompanyValidator,
  ) {
    return this.execute(id, parameters);
  }

  validator(parameters: UpdateCompanyValidator) {
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

  async execute(id: string, parameters: UpdateCompanyValidator) {
    try {
      parameters.document = CompanyHelper.removeFormatting(parameters.document);

      this.validator(parameters);

      const companyId = new Types.ObjectId(id);

      const record = await this.getCompanyService.execute({
        filter: { _id: companyId },
        validate: true,
      });

      const checkDocument = await this.getCompanyService.execute({
        filter: { document: parameters.document },
        validate: false,
      });

      if (
        checkDocument &&
        checkDocument._id.toString() !== companyId.toString()
      ) {
        throw new HttpException(
          RESULT.COMPANY_DOCUMENT_ALREADY_EXISTS,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      const updated = await this.model.findOneAndUpdate(
        { _id: record?._id },
        parameters,
      );

      return updated;
    } catch (error) {
      Log(
        LogType.ERROR,
        UpdateCompanyService.name,
        this.execute.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.COMPANY_NOT_UPDATED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
