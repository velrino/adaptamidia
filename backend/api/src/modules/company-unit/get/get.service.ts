import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RESULT } from 'src/shared/result.enum';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { GetCompanyUnitDto } from './get.interface';
import { CompanyUnit, CompanyUnitDocument } from '../company-unit.schema';
import { Company } from 'src/modules/company/company.schema';
import { CompanyUnitPopularTime } from '../popular-times/company-unit-popular-times.schema';
import { AuthenticatedRequest } from 'src/shared/request';
import { GetUserCompany } from 'src/shared/general';

@Injectable()
export class GetCompanyUnitService {
  constructor(
    @InjectModel(CompanyUnit.name)
    private readonly model: Model<CompanyUnitDocument>,
  ) {}

  executeFromRequest(
    currentRequest: AuthenticatedRequest,
    body: GetCompanyUnitDto,
  ) {
    const company = GetUserCompany(currentRequest);

    return this.execute({
      validate: true,
      filter: {
        ...body.filter,
        ...(company !== null ? { company: company } : {}),
      },
    });
  }

  async execute(parameters: GetCompanyUnitDto) {
    try {
      const record = await this.model
        .findOne(parameters.filter)
        .populate<{ company: Company }>({
          path: 'company',
        })
        .populate<{ popular_time: CompanyUnitPopularTime }>({
          path: 'popular_time',
        });

      if (parameters.validate && !record) {
        throw new HttpException(
          RESULT.COMPANY_UNIT_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      return record;
    } catch (error) {
      Log(
        LogType.ERROR,
        GetCompanyUnitService.name,
        this.execute.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.COMPANY_UNIT_GET_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
