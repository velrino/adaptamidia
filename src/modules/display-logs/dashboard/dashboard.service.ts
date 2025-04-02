import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { DisplayLog, DisplayLogDocument } from '../display-logs.schema';
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
        parameters.advertisement = companies;
      } else if (!result.sudo && permissions.includes(PermissionsEnum.LOCAL)) {
        parameters.local = companies;
      }

      return this.execute({ ...parameters, is_admin: result.sudo });
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
      throw new HttpException(
        error?.message || RESULT.DASHBOARD_DISPLAY_LOG_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async dashboardTotalByType(
    parameters: IDashboardDisplayLog,
  ): Promise<IDashboardTotalByTypeResult> {
    try {
      const query_result: IDashboardTotalByTypeQueryResult[] =
        await this.displayLogModel.aggregate([
          {
            $match: {
              start_at: { $gte: parameters.start_at, $lt: parameters.end_at },
            },
          },
          {
            $group: {
              _id: {
                type: '$type',
                advertiser: '$advertiser',
                local: '$local',
                local_unit: '$local_unit',
              },
              total: { $sum: 1 },
            },
          },
        ]);

      const resume: IDashboardTotalByTypeResume =
        query_result.reduce<IDashboardTotalByTypeResume>(
          (acc, { _id: { type }, total }) => {
            acc.distributed[type] = (acc.distributed[type] ?? 0) + total;
            acc.total += total;
            return acc;
          },
          { distributed: {} as Record<DisplayType, number>, total: 0 },
        );

      return { parameters, resume, query_result };
    } catch (error) {
      throw new HttpException(
        error?.message || RESULT.DASHBOARD_DISPLAY_LOG_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
