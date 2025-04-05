import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DisplayLog,
  DisplayLogDocument,
} from 'src/modules/display-logs/display-logs.schema';
import { GetUserCompany } from 'src/shared/general';
import { RedisService } from 'src/shared/redis/redis.service';
import { RESULT } from 'src/shared/result.enum';
import { IDashboardGeneral, IDashboardGeneralDto } from './general.interface';
import { AuthenticatedRequest } from 'src/shared/request';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';

@Injectable()
export class DashboardGeneralService {
  constructor(
    @InjectModel(DisplayLog.name)
    private readonly displayLogModel: Model<DisplayLogDocument>,
    private readonly redisService: RedisService,
  ) {}

  async executeFromRequest(
    currentRequest: AuthenticatedRequest,
    parameters: IDashboardGeneralDto,
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
        error?.message || RESULT.DASHBOARD_GENERAL_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async execute(parameters: IDashboardGeneral) {
    try {
      //   if (parameters.chart_type === IDashboardDisplayLogType.TOTAL_BY_TYPE) {
      //     return await this.dashboardTotalByType(parameters);
      //   }

      throw new HttpException(
        RESULT.DASHBOARD_GENERAL_UNMAPPED,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    } catch (error) {
      Log(
        LogType.ERROR,
        DashboardGeneralService.name,
        this.execute.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.DASHBOARD_GENERAL_EXECUTE_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
