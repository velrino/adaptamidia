import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryOptions } from 'mongoose';
import { AuthenticatedRequest } from 'src/shared/request';
// import { GetCompanyService } from 'src/modules/company/get/get.service';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { RESULT } from 'src/shared/result.enum';
import { ListCompanyPaginateDto } from './list.interface';
import { PaginatedResponseDto } from 'src/shared/interfaces/paginate.dto';
import { Company, CompanyDocument } from '../company.schema';
import { RedisService } from 'src/shared/redis/redis.service';
import { RedisKeysEnum } from 'src/shared/redis/redis.keys';

@Injectable()
export class ListCompanyService {
  constructor(
    @InjectModel(Company.name)
    private readonly companyModel: Model<CompanyDocument>,
    private readonly redisService: RedisService,
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

    const fields: (keyof ListCompanyPaginateDto)[] = ['name'];

    fields.forEach((field) => {
      if (parameters[field]) {
        if (Array.isArray(parameters[field])) {
          // Se for um array, cria uma lista de expressões regulares e usa $in
          const regexArray = parameters[field].map(
            (value: string) => new RegExp(value, 'i'),
          );
          query[field] = { $in: regexArray };
        } else {
          // Se for uma string única, usa regex diretamente
          query[field] = { $regex: new RegExp(parameters[field] as any, 'i') };
        }
      }
    });

    const total = await this.companyModel.countDocuments(query);

    const data = await this.companyModel
      .find(query) // Exclude the "config" field
      .sort({ created_at: -1 }) // Sort by the most recent
      .skip(skip)
      .limit(parameters.limit)
      .lean()
      .exec();

    const pages = Math.ceil(total / parameters.limit);

    return { pages, total, data, limit: parameters.limit, page: currentPage };
  }

  async execute(parameters: ListCompanyPaginateDto) {
    try {
      const cacheKey = this.redisService.createKeyByObject(
        RedisKeysEnum.LIST_COMPANY,
        parameters,
      );

      if (parameters.cache) {
        const dataCached = await this.redisService.get(cacheKey.name);

        if (dataCached) {
          return dataCached;
        }
      }

      const records = await this.getData(parameters);

      await this.redisService.set(cacheKey.name, records, 300000); // 5 minutes

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
