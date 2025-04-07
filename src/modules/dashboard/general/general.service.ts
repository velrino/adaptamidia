import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DisplayLog,
  DisplayLogDocument,
} from 'src/modules/display-logs/display-logs.schema';
import { GetUserCompany, Milliseconds } from 'src/shared/general';
import { RedisService } from 'src/shared/redis/redis.service';
import { RESULT } from 'src/shared/result.enum';
import {
  IDashboardGeneral,
  IDashboardGeneralDto,
  IDashboardGeneralType,
} from './general.interface';
import { AuthenticatedRequest } from 'src/shared/request';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { FromEnum } from 'src/shared/interfaces/paginate.dto';
import { RedisKeysEnum } from 'src/shared/redis/redis.keys';
import { News, NewsDocument } from 'src/modules/news/news.schema';
import {
  Advertisement,
  AdvertisementDocument,
} from 'src/modules/advertisement/advertisement.schema';
import { DisplayType } from 'src/modules/display/unit/display.interface';

@Injectable()
export class DashboardGeneralService {
  constructor(
    @InjectModel(DisplayLog.name)
    private readonly displayLogModel: Model<DisplayLogDocument>,
    @InjectModel(News.name)
    private readonly newsModel: Model<NewsDocument>,
    @InjectModel(Advertisement.name)
    private readonly advertisementModel: Model<AdvertisementDocument>,
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

  private readonly dashboardHandlers: Record<IDashboardGeneralType, any> = {
    [IDashboardGeneralType.NEWS_BY_SOURCE_NAME]:
      this.dashboardNewsBySourceName.bind(this),
    [IDashboardGeneralType.ADVERTISEMENT_BY_COMPANY]:
      this.dashboardAdvertisementByCompany.bind(this),
    [IDashboardGeneralType.RESUME]: this.dashboardResume.bind(this),
    [IDashboardGeneralType.DISPLAY_BY_UNIT]:
      this.dashboardDisplayByUnit.bind(this),
    [IDashboardGeneralType.DISPLAY_BY_ADVERTISER]:
      this.dashboardDisplayByAdvertiser.bind(this),
    [IDashboardGeneralType.DISPLAY_BY_ADVERTISEMENT]:
      this.dashboardDisplayByAdvertisement.bind(this),
  };

  async execute(parameters: IDashboardGeneral) {
    try {
      const handler = this.dashboardHandlers[parameters.chart_type];

      if (handler) {
        return handler(parameters);
      }

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

  async dashboardResume(parameters: IDashboardGeneral) {
    try {
      const cacheKey = this.redisService.createKeyByObject(
        `${RedisKeysEnum.DASHBOARD_GENERAL}`,
        parameters,
      );

      if (parameters.from === FromEnum.CACHE) {
        const dataCached = await this.redisService.get(cacheKey.name);

        if (dataCached) {
          return { ...dataCached, from: FromEnum.CACHE };
        }
      }

      const queryBuilder = {
        start_at: { $gte: parameters.start_at, $lt: parameters.end_at },
      };

      if (parameters.company?.length) {
        queryBuilder['company'] = { $in: parameters.company };
      }

      const totalDisplayNews = await this.displayLogModel.countDocuments({
        type: DisplayType.NEWS,
        start_at: { $gte: parameters.start_at, $lt: parameters.end_at },
      });

      const totalDisplayAdvertisement =
        await this.displayLogModel.countDocuments({
          type: DisplayType.ADVERTISEMENT,
          start_at: { $gte: parameters.start_at, $lt: parameters.end_at },
        });

      const news = await this.newsModel.countDocuments({
        published_at: { $gte: parameters.start_at, $lt: parameters.end_at },
      });

      const advertisements = await this.advertisementModel.countDocuments({
        start_date: { $gte: parameters.start_at, $lt: parameters.end_at },
      });

      const result = {
        from: FromEnum.DATABASE,
        display: {
          news: totalDisplayNews,
          advertisement: totalDisplayAdvertisement,
        },
        news: {
          total: news,
        },
        advertisement: {
          total: advertisements,
        },
      } as any;

      await this.redisService.set(
        cacheKey.name,
        result,
        Milliseconds({ minutes: 1 }),
      );

      return result;
    } catch (error) {
      Log(
        LogType.ERROR,
        DashboardGeneralService.name,
        this.dashboardResume.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.DASHBOARD_GENERAL_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async dashboardAdvertisementByCompany(parameters: IDashboardGeneral) {
    try {
      const cacheKey = this.redisService.createKeyByObject(
        `${RedisKeysEnum.DASHBOARD_GENERAL}`,
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
          $gte: parameters.start_at,
          $lt: parameters.end_at,
        },
      };

      if (parameters.company?.length) {
        queryBuilder['company'] = { $in: parameters.company };
      }

      const page = parameters.page || 1;
      const limit = parameters.limit || 10;
      const skip = (page - 1) * limit;

      const advertisementByCompany = await this.advertisementModel.aggregate([
        {
          $match: queryBuilder,
        },
        {
          $lookup: {
            from: 'companies',
            localField: 'company',
            foreignField: '_id',
            as: 'companyData',
          },
        },
        {
          $unwind: '$companyData',
        },
        {
          $group: {
            _id: {
              companyId: '$companyData._id',
              companyName: '$companyData.name',
            },
            total: { $sum: 1 },
          },
        },
        {
          $sort: { [parameters.sort.column]: parameters.sort.value },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
        {
          $project: {
            company_id: '$_id.companyId',
            company_name: '$_id.companyName',
            total: 1,
            _id: 0,
          },
        },
      ]);

      const result = {
        from: FromEnum.DATABASE,
        records: advertisementByCompany,
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
        DashboardGeneralService.name,
        this.dashboardAdvertisementByCompany.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.DASHBOARD_GENERAL_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async dashboardNewsBySourceName(parameters: IDashboardGeneral) {
    try {
      const cacheKey = this.redisService.createKeyByObject(
        `${RedisKeysEnum.DASHBOARD_GENERAL}`,
        parameters,
      );

      if (parameters.from === FromEnum.CACHE) {
        const dataCached = await this.redisService.get(cacheKey.name);

        if (dataCached) {
          return { ...dataCached, from: FromEnum.CACHE };
        }
      }

      const page = parameters.page || 1;
      const limit = parameters.limit || 10;
      const skip = (page - 1) * limit;

      const records = await this.newsModel.aggregate([
        {
          $match: {
            published_at: {
              $gte: parameters.start_at,
              $lt: parameters.end_at,
            },
          },
        },
        {
          $group: {
            _id: '$source_name',
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            source_name: '$_id',
            total: 1,
            _id: 0,
          },
        },
        {
          $sort: { [parameters.sort.column]: parameters.sort.value },
        },
        {
          $skip: skip,
        },
        {
          $limit: limit,
        },
      ]);

      const result = {
        from: FromEnum.DATABASE,
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
        DashboardGeneralService.name,
        this.dashboardNewsBySourceName.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.DASHBOARD_GENERAL_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async dashboardDisplayByUnit(parameters: IDashboardGeneral) {
    try {
      const cacheKey = this.redisService.createKeyByObject(
        `${RedisKeysEnum.DASHBOARD_GENERAL}`,
        parameters,
      );

      if (parameters.from === FromEnum.CACHE) {
        const dataCached = await this.redisService.get(cacheKey.name);

        if (dataCached) {
          return { ...dataCached, from: FromEnum.CACHE };
        }
      }

      const queryBuilder = {
        type: DisplayType.ADVERTISEMENT, // TODO
        start_at: { $gte: parameters.start_at, $lt: parameters.end_at },
      };

      if (parameters.company?.length) {
        queryBuilder['local'] = { $in: parameters.company };
      }

      const page = parameters.page || 1;
      const limit = parameters.limit || 10;
      const skip = (page - 1) * limit;

      const records = await this.displayLogModel.aggregate([
        {
          $match: queryBuilder,
        },
        {
          $lookup: {
            from: 'company_units',
            localField: 'local_unit',
            foreignField: '_id',
            as: 'companyUnit',
          },
        },
        {
          $group: {
            _id: {
              type: '$type',
              local_unit_id: '$companyUnit._id',
              local_unit_name: '$companyUnit.name',
            },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            type: '$_id.type',
            local_unit_id: { $arrayElemAt: ['$_id.local_unit_id', 0] },
            local_unit_name: { $arrayElemAt: ['$_id.local_unit_name', 0] },
            total: 1,
            _id: 0,
          },
        },
        {
          $sort: { [parameters.sort.column]: parameters.sort.value },
        },
        { $skip: skip },
        { $limit: limit },
      ]);

      const result = {
        from: FromEnum.DATABASE,
        records,
      } as any;

      await this.redisService.set(
        cacheKey.name,
        result,
        Milliseconds({ minutes: 1 }),
      );

      return result;
    } catch (error) {
      Log(
        LogType.ERROR,
        DashboardGeneralService.name,
        this.dashboardDisplayByUnit.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.DASHBOARD_GENERAL_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async dashboardDisplayByAdvertiser(parameters: IDashboardGeneral) {
    try {
      const cacheKey = this.redisService.createKeyByObject(
        `${RedisKeysEnum.DASHBOARD_GENERAL}`,
        parameters,
      );

      if (parameters.from === FromEnum.CACHE) {
        const dataCached = await this.redisService.get(cacheKey.name);

        if (dataCached) {
          return { ...dataCached, from: FromEnum.CACHE };
        }
      }

      const queryBuilder = {
        type: DisplayType.ADVERTISEMENT,
        start_at: { $gte: parameters.start_at, $lt: parameters.end_at },
      };

      if (parameters.company?.length) {
        queryBuilder['advertiser'] = { $in: parameters.company };
      }

      const page = parameters.page || 1;
      const limit = parameters.limit || 10;
      const skip = (page - 1) * limit;

      const records = await this.displayLogModel.aggregate([
        {
          $match: queryBuilder,
        },
        {
          $lookup: {
            from: 'companies',
            localField: 'advertiser',
            foreignField: '_id',
            as: 'company',
          },
        },
        {
          $group: {
            _id: {
              company_id: '$company._id',
              company_name: '$company.name',
            },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            type: '$_id.type',
            company_id: { $arrayElemAt: ['$_id.company_id', 0] },
            company_name: { $arrayElemAt: ['$_id.company_name', 0] },
            total: 1,
            _id: 0,
          },
        },
        {
          $sort: { [parameters.sort.column]: parameters.sort.value },
        },
        { $skip: skip },
        { $limit: limit },
      ]);

      const result = {
        from: FromEnum.DATABASE,
        records,
      } as any;

      await this.redisService.set(
        cacheKey.name,
        result,
        Milliseconds({ minutes: 1 }),
      );

      return result;
    } catch (error) {
      Log(
        LogType.ERROR,
        DashboardGeneralService.name,
        this.dashboardDisplayByAdvertiser.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.DASHBOARD_GENERAL_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async dashboardDisplayByAdvertisement(parameters: IDashboardGeneral) {
    try {
      const cacheKey = this.redisService.createKeyByObject(
        `${RedisKeysEnum.DASHBOARD_GENERAL}`,
        parameters,
      );

      if (parameters.from === FromEnum.CACHE) {
        const dataCached = await this.redisService.get(cacheKey.name);

        if (dataCached) {
          return { ...dataCached, from: FromEnum.CACHE };
        }
      }

      const queryBuilder = {
        type: DisplayType.ADVERTISEMENT,
        start_at: { $gte: parameters.start_at, $lt: parameters.end_at },
      };

      if (parameters.company?.length) {
        queryBuilder['advertiser'] = { $in: parameters.company };
      }

      const page = parameters.page || 1;
      const limit = parameters.limit || 10;
      const skip = (page - 1) * limit;

      const records = await this.displayLogModel.aggregate([
        {
          $match: queryBuilder,
        },
        {
          $lookup: {
            from: 'advertisements',
            localField: 'advertisement',
            foreignField: '_id',
            as: 'advertisement',
          },
        },
        {
          $lookup: {
            from: 'companies',
            localField: 'advertiser',
            foreignField: '_id',
            as: 'company',
          },
        },
        {
          $group: {
            _id: {
              advertisement_id: '$advertisement._id',
              advertisement_title: '$advertisement.title',
              company_id: '$company._id',
              company_name: '$company.name',
            },
            total: { $sum: 1 },
          },
        },
        {
          $project: {
            advertisement_id: { $arrayElemAt: ['$_id.advertisement_id', 0] },
            advertisement_title: {
              $arrayElemAt: ['$_id.advertisement_title', 0],
            },
            company_id: { $arrayElemAt: ['$_id.company_id', 0] },
            company_name: { $arrayElemAt: ['$_id.company_name', 0] },
            total: 1,
            _id: 0,
          },
        },
        {
          $sort: { [parameters.sort.column]: parameters.sort.value },
        },
        { $skip: skip },
        { $limit: limit },
      ]);

      const result = {
        from: FromEnum.DATABASE,
        records,
      } as any;

      await this.redisService.set(
        cacheKey.name,
        result,
        Milliseconds({ minutes: 1 }),
      );

      return result;
    } catch (error) {
      Log(
        LogType.ERROR,
        DashboardGeneralService.name,
        this.dashboardDisplayByAdvertisement.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.DASHBOARD_GENERAL_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
