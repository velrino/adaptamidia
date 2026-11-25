import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Advertisement,
  AdvertisementDocument,
} from 'src/modules/advertisement/advertisement.schema';
import { GetUserCompany, Milliseconds } from 'src/shared/general';
import { RedisService } from 'src/shared/redis/redis.service';
import { RESULT } from 'src/shared/result.enum';
import {
  IDashboardAdvertisement,
  IDashboardAdvertisementChartType,
  IDashboardAdvertisementDto,
} from './advertisement.interface';
import { AuthenticatedRequest } from 'src/shared/request';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { RedisKeysEnum } from 'src/shared/redis/redis.keys';
import { FromEnum } from 'src/shared/interfaces/paginate.dto';

@Injectable()
export class DashboardAdvertisementService {
  constructor(
    @InjectModel(Advertisement.name)
    private readonly advertisementModel: Model<AdvertisementDocument>,
    private readonly redisService: RedisService,
  ) {}

  async executeFromRequest(
    currentRequest: AuthenticatedRequest,
    parameters: IDashboardAdvertisementDto,
  ) {
    try {
      const result = GetUserCompany(currentRequest);

      const { permissions, companies } = currentRequest.user.user;

      if (!result.sudo && !companies.length) {
        throw new HttpException(
          RESULT.USER_NEED_COMPANY,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      if (!result.sudo) {
        parameters.company = companies;
      }

      return this.execute({
        ...parameters,
        is_admin: result.sudo,
        permissions,
      });
    } catch (error) {
      throw new HttpException(
        error?.message || RESULT.DASHBOARD_ADVERTISEMENT_EXECUTE_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async execute(parameters: IDashboardAdvertisement) {
    try {
      if (
        parameters.chart_type === IDashboardAdvertisementChartType.TOTAL_BY_UNIT
      ) {
        return await this.dashboardTotalByUnit(parameters);
      } else if (
        parameters.chart_type ===
        IDashboardAdvertisementChartType.TOTAL_BY_CUSTOM
      ) {
        return await this.dashboardTotalByCustom(parameters);
      }

      throw new HttpException(
        RESULT.DASHBOARD_ADVERTISEMENT_UNMAPPED,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    } catch (error) {
      Log(
        LogType.ERROR,
        DashboardAdvertisementService.name,
        this.execute.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.DASHBOARD_ADVERTISEMENT_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async dashboardTotalByCustom(parameters: IDashboardAdvertisement) {
    try {
      if (!parameters.query_by_custom) {
        throw new HttpException(
          RESULT.DASHBOARD_ADVERTISEMENT_NEED_MATCH,
          HttpStatus.BAD_REQUEST,
        );
      }

      const cacheKey = this.redisService.createKeyByObject(
        `${RedisKeysEnum.DASHBOARD_ADVERTISEMENT_TOTAL_BY_CUSTOM}`,
        parameters,
      );

      if (parameters.from === FromEnum.CACHE) {
        const dataCached = await this.redisService.get(cacheKey.name);

        if (dataCached) {
          return { ...dataCached, from: FromEnum.CACHE };
        }
      }

      const queryBuilder = {
        start_date: {
          $gte: new Date(parameters.start_at),
        },
        end_date: {
          $lte: new Date(parameters.end_at),
        },
      };

      if (parameters.company?.length) {
        queryBuilder['company'] = { $in: parameters.company };
      }

      const pipeline: any[] = [];
      pipeline.push({ $match: queryBuilder });

      if (parameters.query_by_custom.neighborhood) {
        pipeline.push({ $unwind: '$neighborhood' });
      }

      if (parameters.query_by_custom.units) {
        pipeline.push({ $unwind: '$units' });
        pipeline.push({
          $lookup: {
            from: 'company_units',
            localField: 'units',
            foreignField: '_id',
            as: 'units',
          },
        });
        pipeline.push({
          $project: {
            _id: 1,
            total: 1,
            'units._id': 1,
            'units.name': 1,
          },
        });
      }

      pipeline.push({
        $group: {
          _id: parameters.query_by_custom,
          total: { $sum: 1 },
        },
      });

      pipeline.push({
        $sort: {
          [parameters.sort.column]: parameters.sort.value,
        },
      });

      const countPipeline = [...pipeline];
      countPipeline.push({ $count: 'totalCount' });

      const { page, limit } = parameters;
      const skip = (page - 1) * limit;

      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limit });

      const [countResult, records] = await Promise.all([
        this.advertisementModel.aggregate(countPipeline),
        this.advertisementModel.aggregate(pipeline),
      ]);

      const total_count = countResult[0]?.totalCount || 0;
      const total_pages = Math.ceil(total_count / limit);

      const result = {
        from: FromEnum.DATABASE,
        page,
        limit,
        total_count,
        total_pages,
        has_next_page: page < total_pages,
        has_previous_page: page > 1,
        records,
      } as any;

      await this.redisService.set(
        cacheKey.name,
        result,
        Milliseconds({ minutes: 5 }),
      );

      return result;
    } catch (error) {
      Log(
        LogType.ERROR,
        DashboardAdvertisementService.name,
        this.dashboardTotalByCustom.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.DASHBOARD_ADVERTISEMENT_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async dashboardTotalByUnit(parameters: IDashboardAdvertisement) {
    try {
      if (!parameters.units) {
        throw new HttpException(
          RESULT.DASHBOARD_ADVERTISEMENT_NEED_UNITS,
          HttpStatus.BAD_REQUEST,
        );
      }

      const cacheKey = this.redisService.createKeyByObject(
        `${RedisKeysEnum.DASHBOARD_ADVERTISEMENT_TOTAL_BY_UNIT}`,
        parameters,
      );

      if (parameters.from === FromEnum.CACHE) {
        const dataCached = await this.redisService.get(cacheKey.name);

        if (dataCached) {
          return { ...dataCached, from: FromEnum.CACHE };
        }
      }

      const { page, limit } = parameters;
      const skip = (page - 1) * limit;

      const queryBuilder: Record<string, any> = {
        start_date: { $gte: new Date(parameters.start_at) },
        end_date: { $lte: new Date(parameters.end_at) },
      };

      if (parameters.company?.length) {
        queryBuilder['company'] = { $in: parameters.company };
      }

      if (parameters.units?.length) {
        queryBuilder['units'] = {
          $in: parameters.units.map((id) => new Types.ObjectId(id)),
        };
      }

      const records = await this.advertisementModel.aggregate([
        { $match: queryBuilder },
        {
          $facet: {
            paginatedResults: [
              {
                $group: {
                  _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$start_date' },
                  },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: 1 } },
              { $skip: skip },
              { $limit: limit },
            ],
            totalDays: [
              {
                $group: {
                  _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$start_date' },
                  },
                },
              },
              { $count: 'value' },
            ],
            totalRecords: [{ $count: 'value' }],
          },
        },
      ]);

      const totalDays = records[0]?.totalDays?.[0]?.value ?? 0;

      const total_pages = Math.ceil(totalDays / limit);

      const result = {
        from: FromEnum.DATABASE,
        page,
        limit,
        total_pages,
        total_count: records[0]?.totalRecords?.[0]?.value ?? 0,
        has_next_page: page < total_pages,
        has_previous_page: page > 1,
        records: records[0]?.paginatedResults ?? [],
      };

      await this.redisService.set(
        cacheKey.name,
        result,
        Milliseconds({ minutes: 5 }),
      );

      return result;
    } catch (error) {
      Log(
        LogType.ERROR,
        DashboardAdvertisementService.name,
        this.dashboardTotalByCustom.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.DASHBOARD_ADVERTISEMENT_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
