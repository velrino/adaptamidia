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
import { RedisService } from 'src/shared/redis/redis.service';
import { RedisKeysEnum } from 'src/shared/redis/redis.keys';

@Injectable()
export class GroupCompanyUnitService {
  constructor(
    @InjectModel(CompanyUnit.name)
    private readonly companyUnitModel: Model<CompanyUnitDocument>,
    private readonly redisService: RedisService,
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

    const fields: (keyof GroupCompanyUnitPaginateDto)[] = [
      'neighborhood',
      'city',
      'state',
      'country',
    ];

    fields.forEach((field) => {
      if (parameters[field]) {
        if (Array.isArray(parameters[field])) {
          // Se for um array, cria uma lista de expressões regulares e usa $in
          const regexArray = parameters[field].map(
            (value: string) => new RegExp(value, 'i'),
          );
          $match[field] = { $in: regexArray };
        } else {
          // Se for uma string única, usa regex diretamente
          $match[field] = { $regex: new RegExp(parameters[field] as any, 'i') };
        }
      }
    });

    const query = [
      {
        $match, // Apply filters
      },
      {
        $group: {
          _id: {
            neighborhood: '$neighborhood',
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
      const cacheKey = this.redisService.createKeyByObject(
        RedisKeysEnum.LIST_COMPANY_UNIT_GROUP,
        parameters,
      );

      if (parameters.cache) {
        const dataCached = await this.redisService.get(cacheKey.name);

        if (dataCached) {
          return dataCached;
        }
      }

      const records = await this.getData(parameters);

      const processedData = {
        data: records.map((item) => ({ ...item._id, count: item.count })),
      };

      await this.redisService.set(cacheKey.name, processedData, 300000);

      return processedData;
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
