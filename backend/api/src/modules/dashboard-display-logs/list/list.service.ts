import { Model, QueryOptions, SortOrder, Types } from 'mongoose';
import {
  DashboardDisplayLogsAggregation,
  DashboardDisplayLogsAggregationDocument as DashboardDisplayLogsDocument,
} from '../dashboard-display-logs.schema';
import { InjectModel } from '@nestjs/mongoose';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { RedisService } from 'src/shared/redis/redis.service';
import { HandleBody } from 'src/shared/general';
import { AuthenticatedRequest } from 'src/shared/request';
import {
  IListDashboardDisplayLogsPaginate,
  ListDashboardDisplayLogsDto,
} from './list.interface';
import { RESULT } from 'src/shared/result.enum';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { MongoDbDateQuery } from 'src/shared/mongo.schema';
import { PermissionsEnum } from 'src/modules/permissions/permissions.enum';
import { SortEnum } from 'src/shared/interfaces/paginate.dto';

@Injectable()
export class ListDashboardDisplayLogsService {
  constructor(
    @InjectModel(DashboardDisplayLogsAggregation.name)
    private model: Model<DashboardDisplayLogsDocument>,
    // private readonly redisService: RedisService,
  ) {}

  executeFromRequest(
    currentRequest: AuthenticatedRequest,
    parameters: ListDashboardDisplayLogsDto,
  ) {
    try {
      return this.execute({
        ...HandleBody(currentRequest, parameters),
        permissions: currentRequest.user.user.permissions || [],
      });
    } catch (error) {
      throw new HttpException(
        error?.message || RESULT.DASHBOARD_DISPLAY_LOG_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async execute(parameters: IListDashboardDisplayLogsPaginate) {
    try {
      const currentPage = parameters.page - 1;

      const skip = currentPage * parameters.limit;

      const query: QueryOptions<DashboardDisplayLogsDocument> = {};

      query.$or = [];

      const dateFilter: MongoDbDateQuery = {};

      if (parameters.start_date) {
        dateFilter.$gte = new Date(parameters.start_date);
      }

      // Apply end date filter (if applicable)
      if (parameters.end_date) {
        dateFilter.$lte = new Date(parameters.end_date);
      }

      const isSudo = parameters.permissions.includes(PermissionsEnum.SUDO);

      if (!isSudo && parameters.company) {
        const permissionConditions: QueryOptions<DashboardDisplayLogsDocument>[] =
          [];

        if (parameters.permissions.includes(PermissionsEnum.NEWS)) {
          permissionConditions.push(
            {
              advertiser: {
                $in: parameters.company.map((id) => new Types.ObjectId(id)),
              },
            },
            { nesw: { $exist: true } },
          );
        }

        if (parameters.permissions.includes(PermissionsEnum.ADVERTISER)) {
          permissionConditions.push({
            advertiser: {
              $in: parameters.company.map((id) => new Types.ObjectId(id)),
            },
          });
        }

        if (parameters.permissions.includes(PermissionsEnum.LOCAL)) {
          permissionConditions.push({
            local: {
              $in: parameters.company.map((id) => new Types.ObjectId(id)),
            },
          });
        }

        if (permissionConditions.length > 0) {
          query.$or = [...query.$or, ...permissionConditions];
        }
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

      const queryBuilder = this.model.find(query);

      const sortObject: Record<string, SortOrder> = parameters.sort_by
        ? {
            [parameters.sort_by]: (parameters.sort === SortEnum.ASC
              ? 1
              : -1) as SortOrder,
          }
        : { updated_at: -1 as SortOrder };

      const data = await queryBuilder
        .sort(sortObject)
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
    } catch (error) {
      Log(
        LogType.ERROR,
        ListDashboardDisplayLogsService.name,
        this.execute.name,
        LogAction.FAILED,
        { parameters, error },
      );

      throw new HttpException(
        error?.message || RESULT.DISPLAY_DASHBOARD_LIST_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
