import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryOptions, Types } from 'mongoose';

import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { RESULT } from 'src/shared/result.enum';
import { MongoDbDateQuery } from 'src/shared/mongo.schema';
import { PaginatedResponseDto } from 'src/shared/interfaces/paginate.dto';
import { Company, CompanyDocument } from 'src/modules/company/company.schema';
import { RedisService } from 'src/shared/redis/redis.service';
import { RedisKeysEnum } from 'src/shared/redis/redis.keys';
import { Advertisement, AdvertisementDocument } from '../advertisement.schema';
import {
  IDisplayAdvertisementPaginateDto,
  IDisplayAdvertisementUnit,
} from './display.interface';
import { DateTime } from 'luxon';
import {
  CompanyUnit,
  CompanyUnitDocument,
} from 'src/modules/company-unit/company-unit.schema';

@Injectable()
export class DisplayAdvertisementService {
  constructor(
    @InjectModel(Advertisement.name)
    private readonly model: Model<AdvertisementDocument>,
    @InjectModel(CompanyUnit.name)
    private readonly companyUnitModel: Model<CompanyUnitDocument>,
    private readonly redisService: RedisService,
  ) {}

  executeFromRequest(parameters: IDisplayAdvertisementPaginateDto) {
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
        error?.message || RESULT.DISPLAY_GET_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async getData(
    parameters: IDisplayAdvertisementPaginateDto,
  ): Promise<PaginatedResponseDto<Advertisement>> {
    const currentPage = parameters.page - 1;

    const skip = currentPage * parameters.limit;

    const query: QueryOptions<Advertisement> = {};

    const currentDate = DateTime.now();

    const startDate = parameters.start_date
      ? DateTime.fromISO(parameters.start_date).startOf('day')
      : currentDate.startOf('day');

    const endDate = parameters.end_date
      ? DateTime.fromISO(parameters.end_date).endOf('day')
      : currentDate.endOf('day');

    query.units = new Types.ObjectId(parameters.id);

    query.start_date = { $lte: endDate.toJSDate() };

    query.end_date = { $gte: startDate.toJSDate() };

    const total = await this.model.countDocuments(query);

    const queryBuilder = this.model.find(query);

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

  async getUnit(id: Types.ObjectId): Promise<IDisplayAdvertisementUnit> {
    const cacheKey = `${RedisKeysEnum.GET_COMPANY_UNIT}:${id.toString()}`;

    const dataCached: IDisplayAdvertisementUnit | null =
      await this.redisService.get(cacheKey);

    if (dataCached) {
      return dataCached;
    }

    const record = await this.companyUnitModel
      .findOne({ _id: id, company: { $exists: true, $ne: null } })
      .select(['_id', 'name', 'status', 'company'])
      .populate<{
        company: NonNullable<IDisplayAdvertisementUnit['company']>;
      }>({
        path: 'company',
        select: ['_id', 'name', 'status'],
      })
      .lean<IDisplayAdvertisementUnit>();

    if (!record) {
      throw new HttpException(
        RESULT.INVALID_COMPANY_UNIT_ID,
        HttpStatus.NOT_FOUND,
      );
    }

    if (!record?.company?._id) {
      throw new HttpException(
        RESULT.COMPANY_UNIT_WITHOUT_COMPANY_ID,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    await this.redisService.set(cacheKey, record, 300000); // 5 minutes

    return record;
  }

  async execute(parameters: IDisplayAdvertisementPaginateDto) {
    try {
      const unitId = new Types.ObjectId(parameters.id);

      const currentUnit: IDisplayAdvertisementUnit = await this.getUnit(unitId);
      //   const cacheKey = this.redisService.createKeyByObject(
      //     RedisKeysEnum.LIST_ADS,
      //     parameters,
      //   );

      //   if (parameters.cache) {
      //     const dataCached = await this.redisService.get(cacheKey.name);

      //     if (dataCached) {
      //       return dataCached;
      //     }
      //   }

      const records = await this.getData(parameters);

      //   await this.redisService.set(cacheKey.name, records, 300000); // 5 minutes

      return { unit: currentUnit, records };
    } catch (error) {
      Log(
        LogType.ERROR,
        DisplayAdvertisementService.name,
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
