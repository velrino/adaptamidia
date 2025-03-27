import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryOptions, Types } from 'mongoose';

import { AuthenticatedRequest } from 'src/shared/request';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { RESULT } from 'src/shared/result.enum';
import { MongoDbDateQuery } from 'src/shared/mongo.schema';
import { PaginatedResponseDto } from 'src/shared/interfaces/paginate.dto';
import { Company } from 'src/modules/company/company.schema';
import { RedisService } from 'src/shared/redis/redis.service';
import { RedisKeysEnum } from 'src/shared/redis/redis.keys';
import { ListAdvertisementPaginateDto } from './list.interface';
import { Advertisement, AdvertisementDocument } from '../advertisement.schema';

@Injectable()
export class ListAdvertisementService {
  constructor(
    @InjectModel(Advertisement.name)
    private readonly model: Model<AdvertisementDocument>,
    private readonly redisService: RedisService,
  ) {}

  // onApplicationBootstrap() {
  //   const query: any = {
  //     city: ['Barueri', 'São Paulo'],
  //     state: ['São Paulo'],
  //     country: ['Brazil'],
  //   };

  //   console.log({ query: querystring.encode(query) });
  // }

  executeFromRequest(
    currentRequest: AuthenticatedRequest,
    parameters: ListAdvertisementPaginateDto,
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
    parameters: ListAdvertisementPaginateDto,
  ): Promise<PaginatedResponseDto<Advertisement>> {
    const currentPage = parameters.page - 1;

    const skip = currentPage * parameters.limit;

    const query: QueryOptions<Advertisement> = {};

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

    if (parameters.id) {
      query._id = { $in: parameters.id.map((id) => new Types.ObjectId(id)) };
    }

    // const fields: (keyof ListAdvertisementPaginateDto)[] = [
    //   'neighborhood',
    //   'city',
    //   'state',
    //   'country',
    //   'title',
    // ];

    // fields.forEach((field) => {
    //   if (parameters[field]) {
    //     if (Array.isArray(parameters[field])) {
    //       // Se for um array, cria uma lista de expressões regulares e usa $in
    //       const regexArray = parameters[field].map(
    //         (value: string) => new RegExp(value, 'i'),
    //       );
    //       query[field] = { $in: regexArray };
    //     } else {
    //       // Se for uma string única, usa regex diretamente
    //       query[field] = { $regex: new RegExp(parameters[field] as any, 'i') };
    //     }
    //   }
    // });

    // if (parameters.latitude && parameters.longitude && parameters.radius) {
    //   query.location = {
    //     $geoWithin: {
    //       $centerSphere: [
    //         [Number(parameters.longitude), Number(parameters.latitude)],
    //         Number(parameters.radius) / 6371000,
    //       ],
    //     },
    //   };
    // }

    const total = await this.model.countDocuments(query);

    const queryBuilder = this.model.find(query).populate<{ company: Company }>({
      path: 'company',
    });

    // if (parameters.popular_time) {
    //   queryBuilder.populate<{ popular_time: CompanyUnitPopularTime }>({
    //     path: 'popular_time',
    //   });
    // }

    const data = await queryBuilder
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parameters.limit)
      .lean()
      .exec();

    const pages = Math.ceil(total / parameters.limit);

    return {
      pages,
      total,
      data,
      limit: parameters.limit,
      page: currentPage,
    };
  }

  async execute(parameters: ListAdvertisementPaginateDto) {
    try {
      const cacheKey = this.redisService.createKeyByObject(
        RedisKeysEnum.LIST_ADS,
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
        ListAdvertisementService.name,
        this.execute.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.ADVERTISEMENT_GET_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
