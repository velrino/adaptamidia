import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Company } from '../company.schema';
import { RESULT } from 'src/shared/result.enum';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { GetCompanyDto } from './get.interface';

@Injectable()
export class GetCompanyService {
  constructor(@InjectModel(Company.name) public model: Model<Company>) {}

  async execute(parameters: GetCompanyDto) {
    try {
      const record = await this.model.findOne(parameters.filter);

      if (parameters.validate && !record) {
        throw new HttpException(RESULT.COMPANY_NOT_FOUND, HttpStatus.NOT_FOUND);
      }

      return record;
    } catch (error) {
      Log(
        LogType.ERROR,
        GetCompanyService.name,
        this.execute.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.COMPANY_FAILED_GET,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
