import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { RedisService } from 'src/shared/redis/redis.service';
import { AuthenticatedRequest } from 'src/shared/request';
import { RESULT } from 'src/shared/result.enum';
import {
  IDashboardDisplayLog,
  IDashboardDisplayLogDto,
  IDashboardDisplayLogType,
  IDashboardTotalByTypeQueryResult,
  IDashboardTotalByTypeResult,
  IDashboardTotalByTypeResume,
} from './dashboard.interface';
import { GetUserCompany } from 'src/shared/general';
import { PermissionsEnum } from 'src/modules/permissions/permissions.enum';
import { DisplayType } from 'src/modules/advertisement/display/display.interface';
import { RedisKeysEnum } from 'src/shared/redis/redis.keys';
import { FromEnum } from 'src/shared/interfaces/paginate.dto';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import {
  DisplayLog,
  DisplayLogDocument,
} from 'src/modules/display-logs/display-logs.schema';

@Injectable()
export class DashboardDisplayLogService {
  constructor(
    @InjectModel(DisplayLog.name)
    private readonly displayLogModel: Model<DisplayLogDocument>,
    private readonly redisService: RedisService,
  ) {}

  async executeFromRequest(
    currentRequest: AuthenticatedRequest,
    parameters: IDashboardDisplayLogDto,
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

      if (!result.sudo && permissions.includes(PermissionsEnum.ADVERTISER)) {
        parameters.advertiser = companies;
      } else if (!result.sudo && permissions.includes(PermissionsEnum.LOCAL)) {
        parameters.local = companies;
      }

      return this.execute({
        ...parameters,
        is_admin: result.sudo,
        permissions,
      });
    } catch (error) {
      throw new HttpException(
        error?.message || RESULT.DASHBOARD_DISPLAY_LOG_EXECUTE_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async execute(parameters: IDashboardDisplayLog) {
    try {
      if (parameters.chart_type === IDashboardDisplayLogType.TOTAL_BY_TYPE) {
        return await this.dashboardTotalByType(parameters);
      }

      throw new HttpException(
        RESULT.DASHBOARD_DISPLAY_LOG_UNMAPPED,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    } catch (error) {
      Log(
        LogType.ERROR,
        DashboardDisplayLogService.name,
        this.execute.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.DASHBOARD_DISPLAY_LOG_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  /*
   * "query_group_total_by_type": {
        "type": "$type",
        "advertiser": "$advertiser",
        "local": "$local",
        "local_unit": "$local_unit",
        "start_at": {
            "$dateToString": {
                "format": "%Y-%m-%d",
                "date": "$start_at",
                "timezone": "America/Sao_Paulo"
            }
        }
    }
   */
  async dashboardTotalByType(
    parameters: IDashboardDisplayLog,
  ): Promise<IDashboardTotalByTypeResult> {
    try {
      if (!parameters.query_group_total_by_type) {
        throw new HttpException(
          RESULT.DASHBOARD_DISPLAY_LOG_NEED_MATCH,
          HttpStatus.BAD_REQUEST,
        );
      }

      const cacheKey = this.redisService.createKeyByObject(
        `${RedisKeysEnum.DASHBOARD_DISPLAY_LOGS_TOTAL_BY_TYPE}`,
        parameters,
      );

      if (parameters.from === FromEnum.CACHE) {
        const dataCached: IDashboardTotalByTypeResult | null =
          await this.redisService.get(cacheKey.name);

        if (dataCached) {
          return { ...dataCached, from: FromEnum.CACHE };
        }
      }

      const queryBuilder = {
        start_at: { $gte: parameters.start_at, $lt: parameters.end_at },
      };

      if (
        !parameters.is_admin &&
        parameters.permissions.includes(PermissionsEnum.ADVERTISER)
      ) {
        queryBuilder['advertiser'] = { $in: parameters.advertiser };
      } else if (
        !parameters.is_admin &&
        parameters.permissions.includes(PermissionsEnum.LOCAL)
      ) {
        queryBuilder['local'] = { $in: parameters.local };
      }

      if (parameters.advertisement?.length) {
        queryBuilder['advertisement'] = { $in: parameters.advertisement };
      }

      if (parameters.news?.length) {
        queryBuilder['news'] = { $in: parameters.news };
      }

      const records: IDashboardTotalByTypeQueryResult[] =
        await this.displayLogModel.aggregate([
          {
            $match: queryBuilder,
          },
          {
            $group: {
              _id: parameters.query_group_total_by_type,
              total: { $sum: 1 },
            },
          },
          {
            $sort: {
              [parameters.sort.column]: parameters.sort.value,
            },
          },
        ]);

      const resume: IDashboardTotalByTypeResume =
        records.reduce<IDashboardTotalByTypeResume>(
          (acc, { _id: { type, start_at }, total }) => {
            // Initialize the date entry if it doesn't exist
            if (!acc.dates[start_at]) {
              acc.dates[start_at] = {
                distributed: {} as Record<DisplayType, number>,
                total: 0,
              };
            }

            // Add to the type count for this date
            acc.dates[start_at].distributed[type] =
              (acc.dates[start_at].distributed[type] || 0) + total;

            // Add to the date total
            acc.dates[start_at].total += total;

            // Add to the overall total
            acc.total += total;

            return acc;
          },
          {
            dates: {} as IDashboardTotalByTypeResume['dates'],
            total: 0,
          },
        );

      const result = {
        from: FromEnum.DATABASE,
        parameters,
        resume,
        records,
      };

      await this.redisService.set(cacheKey.name, result, 60000);

      return result;
    } catch (error) {
      Log(
        LogType.ERROR,
        DashboardDisplayLogService.name,
        this.dashboardTotalByType.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.DASHBOARD_DISPLAY_LOG_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
