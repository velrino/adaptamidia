import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryOptions } from 'mongoose';
import { AuthenticatedRequest } from 'src/shared/request';
// import { GetCompanyService } from 'src/modules/company/get/get.service';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { RESULT } from 'src/shared/result.enum';
import { ListCompanyPaginateDto } from './list.interface';
import { MongoDbDateQuery } from 'src/shared/mongo.schema';
import { PaginatedResponseDto } from 'src/shared/interfaces/paginate.dto';
import { Company, CompanyDocument } from '../company.schema';

@Injectable()
export class ListCompanyService {
  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
  ) {}

  executeFromRequest(
    currentRequest: AuthenticatedRequest,
    parameters: ListCompanyPaginateDto,
  ) {
    try {
      //   VerifyUserCanProced({
      //     need_company: parameters.company_id,
      //     user_permissions: currentRequest.user.user.permissions,
      //     user_companies: currentRequest.user.user.companies,
      //     need_permissions: [],
      //   });

      return this.execute(parameters);
    } catch (error) {
      throw new HttpException(
        error?.message || RESULT.COMPANY_GET_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async getData(
    parameters: ListCompanyPaginateDto,
  ): Promise<PaginatedResponseDto<Company>> {
    const currentPage = parameters.page - 1;

    const skip = currentPage * parameters.limit;

    let query: QueryOptions<Company> = {};

    if (parameters?.type) {
      query = { ...query, type: { $in: parameters.type } };
    }

    const total = await this.companyModel.countDocuments(query);

    const data = await this.companyModel
      .find(query) // Exclude the "config" field
      .sort({ name: -1 }) // Sort by the most recent
      .skip(skip)
      .limit(parameters.limit)
      .lean()
      .exec();

    const pages = Math.ceil(total / parameters.limit);

    return { pages, total, data, limit: parameters.limit, page: currentPage };
  }
  async execute(parameters: ListCompanyPaginateDto) {
    try {
      const records = await this.getData(parameters);

      return records;
    } catch (error) {
      Log(
        LogType.ERROR,
        ListCompanyService.name,
        this.execute.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.COMPANY_GET_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
