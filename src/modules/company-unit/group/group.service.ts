import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model } from 'mongoose';
import { CompanyUnit, CompanyUnitDocument } from '../company-unit.schema';
import { AuthenticatedRequest } from 'src/shared/request';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { RESULT } from 'src/shared/result.enum';
import {
  GroupCompanyUnitPaginateDto,
  IGroupedCompanyUnitResult,
} from './group.interface';

@Injectable()
export class GroupCompanyUnitService {
  constructor(
    @InjectModel(CompanyUnit.name)
    private readonly companyUnitModel: Model<CompanyUnitDocument>,
  ) {}

  executeFromRequest(
    currentRequest: AuthenticatedRequest,
    parameters: GroupCompanyUnitPaginateDto,
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
    parameters: GroupCompanyUnitPaginateDto,
  ): Promise<IGroupedCompanyUnitResult[]> {
    const $match: FilterQuery<CompanyUnit> = {};

    if (parameters.city) {
      $match.city = parameters.city;
    }
    if (parameters.state) {
      $match.state = parameters.state;
    }
    if (parameters.country) {
      $match.country = parameters.country;
    }

    const query = [
      {
        $match, // Apply filters
      },
      {
        $group: {
          _id: {
            city: '$city',
            state: '$state',
            country: '$country',
          },
          count: { $sum: 1 }, // Count records
        },
      },
    ];

    return await this.companyUnitModel.aggregate(query);
  }

  async execute(parameters: GroupCompanyUnitPaginateDto) {
    try {
      const records = await this.getData(parameters);

      return records;
    } catch (error) {
      Log(
        LogType.ERROR,
        GroupCompanyUnitService.name,
        this.execute.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.COMPANY_UNIT_GROUP_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
