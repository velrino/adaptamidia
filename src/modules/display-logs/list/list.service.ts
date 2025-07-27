import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryOptions, Types } from 'mongoose';

import { AuthenticatedRequest } from 'src/shared/request';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { RESULT } from 'src/shared/result.enum';
import { MongoDbDateQuery } from 'src/shared/mongo.schema';
import { PaginatedResponseDto } from 'src/shared/interfaces/paginate.dto';
import { RedisService } from 'src/shared/redis/redis.service';
import { DisplayLog, DisplayLogDocument } from '../display-logs.schema';
import { ListDisplayLogsPaginateDto } from './list.interface';

@Injectable()
export class ListDisplayLogService {
  constructor(
    @InjectModel(DisplayLog.name)
    public readonly model: Model<DisplayLogDocument>,
    private readonly redisService: RedisService,
  ) {}

  executeFromRequest(
    currentRequest: AuthenticatedRequest,
    parameters: ListDisplayLogsPaginateDto,
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
    parameters: ListDisplayLogsPaginateDto,
  ): Promise<PaginatedResponseDto<DisplayLogDocument>> {
    const currentPage = parameters.page - 1;

    const skip = currentPage * parameters.limit;

    const query: QueryOptions<DisplayLogDocument> = {};

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

    if (parameters.local_unit) {
      query.local_unit = {
        $in: parameters.local_unit.map((id) => new Types.ObjectId(id)),
      };
    }

    if (parameters.news) {
      query.news = {
        $in: parameters.news.map((id) => new Types.ObjectId(id)),
      };
    }

    if (parameters.advertisement) {
      query.advertisement = {
        $in: parameters.advertisement.map((id) => new Types.ObjectId(id)),
      };
    }

    const total = await this.model.countDocuments(query);

    const queryBuilder = this.model
      .find(query)
      .populate({
        path: 'news',
        select: ['_id', 'description', 'title', 'source_name', 'author'],
      })
      .populate({
        path: 'advertisement',
        select: ['_id', 'description', 'title'],
      })
      .populate({
        path: 'local_unit',
        select: ['_id', 'full_address', 'type', 'name'],
      });

    const data = await queryBuilder
      .sort({ updated_at: -1 })
      .select(['-data'])
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

  async execute(parameters: ListDisplayLogsPaginateDto) {
    try {
      //   const cacheKey = this.redisService.createKeyByObject(
      //     RedisKeysEnum.LIST_DISPLAY_LOGS,
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

      return records;
    } catch (error) {
      Log(
        LogType.ERROR,
        ListDisplayLogService.name,
        this.execute.name,
        LogAction.FAILED,
        { parameters, error },
      );

      throw new HttpException(
        error?.message || RESULT.DISPLAY_LIST_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
