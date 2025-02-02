import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as querystring from 'querystring';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryOptions } from 'mongoose';
import { CompanyUnit, CompanyUnitDocument } from '../company-unit.schema';
import { AuthenticatedRequest } from 'src/shared/request';
// import { GetCompanyService } from 'src/modules/company/get/get.service';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { RESULT } from 'src/shared/result.enum';
import { ListCompanyUnitPaginateDto } from './list.interface';
import { MongoDbDateQuery } from 'src/shared/mongo.schema';
import { PaginatedResponseDto } from 'src/shared/interfaces/paginate.dto';

@Injectable()
export class ListCompanyUnitService {
  constructor(
    @InjectModel(CompanyUnit.name)
    private readonly companyUnitModel: Model<CompanyUnitDocument>,
    // private readonly getCompanyService: GetCompanyService,
  ) {}

  // onApplicationBootstrap() {
  //   const query: any = {
  //     longitude: 1,
  //     latitude: 1,
  //     radius: 1,
  //   };

  //   console.log({ query: querystring.encode(query) });
  // }

  executeFromRequest(
    currentRequest: AuthenticatedRequest,
    parameters: ListCompanyUnitPaginateDto,
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
        error?.message || RESULT.COMPANY_UNIT_GET_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async getData(
    parameters: ListCompanyUnitPaginateDto,
  ): Promise<PaginatedResponseDto<CompanyUnit>> {
    const currentPage = parameters.page - 1;

    const skip = currentPage * parameters.limit;

    const query: QueryOptions<CompanyUnit> = {};

    const dateFilter: MongoDbDateQuery = {};

    // Apply start date filter (if applicable)
    if (parameters.start_date) {
      dateFilter.$gte = new Date(parameters.start_date);
    }

    // Apply end date filter (if applicable)
    if (parameters.end_date) {
      dateFilter.$lte = new Date(parameters.end_date);
    }

    // Add date filter to match conditions if any date is provided
    if (Object.keys(dateFilter).length) {
      query.created_at = dateFilter;
    }

    if (parameters.latitude && parameters.longitude && parameters.radius) {
      query.location = {
        $geoWithin: {
          $centerSphere: [
            [Number(parameters.longitude), Number(parameters.latitude)],
            Number(parameters.radius) / 6371000,
          ],
        },
      };
    }

    console.log({ query });

    const total = await this.companyUnitModel.countDocuments(query);

    const data = await this.companyUnitModel
      .find(query) // Exclude the "config" field
      .sort({ createdAt: -1 }) // Sort by the most recent
      .skip(skip)
      .limit(parameters.limit)
      .lean()
      .exec();

    const pages = Math.ceil(total / parameters.limit);

    return { pages, total, data, limit: parameters.limit, page: currentPage };
  }
  async execute(parameters: ListCompanyUnitPaginateDto) {
    try {
      const records = await this.getData(parameters);

      return records;
    } catch (error) {
      Log(
        LogType.ERROR,
        ListCompanyUnitService.name,
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
