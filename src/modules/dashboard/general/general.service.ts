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
import { DisplayType } from 'src/modules/advertisement/display/display.interface';
import { News, NewsDocument } from 'src/modules/news/news.schema';
import {
  Advertisement,
  AdvertisementDocument,
} from 'src/modules/advertisement/advertisement.schema';

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

  async execute(parameters: IDashboardGeneral) {
    try {
      if (parameters.chart_type === IDashboardGeneralType.COMPLETE) {
        return await this.dashboardComplete(parameters);
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

  async dashboardComplete(parameters: IDashboardGeneral) {
    try {
      const cacheKey = this.redisService.createKeyByObject(
        `${RedisKeysEnum.DASHBOARD_GENERAL}`,
        parameters,
      );

      //   if (parameters.from === FromEnum.CACHE) {
      //     const dataCached = await this.redisService.get(cacheKey.name);

      //     if (dataCached) {
      //       return { ...dataCached, from: FromEnum.CACHE };
      //     }
      //   }

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

      const newsPage = parameters.news_page || 1;
      const newsLimit = parameters.news_limit || 10;
      const newsSkip = (newsPage - 1) * newsLimit;
      const newsBySourceName = await this.newsModel.aggregate([
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
          $sort: { total: -1 },
        },
        {
          $skip: newsSkip,
        },
        {
          $limit: newsLimit,
        },
      ]);

      const advertisements = await this.advertisementModel.countDocuments({
        start_date: { $gte: parameters.start_at, $lt: parameters.end_at },
      });

      const advertisementPage = parameters.advertisement_page || 1;
      const advertisementLimit = parameters.advertisement_limit || 10;
      const advertisementSkip = (advertisementPage - 1) * advertisementLimit;
      const advertisementByCompany = await this.advertisementModel.aggregate([
        {
          $match: {
            start_date: {
              $gte: parameters.start_at,
              $lt: parameters.end_at,
            },
            // company: new ObjectId('67e5aec27c3ff7d218fac9b6'), // Filter by specific company ID
          },
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
          $sort: { total: -1 },
        },
        {
          $skip: advertisementSkip,
        },
        {
          $limit: advertisementLimit,
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
        display: {
          news: totalDisplayNews,
          advertisement: totalDisplayAdvertisement,
        },
        news: {
          total: news,
          by_source_name: newsBySourceName,
        },
        advertisement: {
          total: advertisements,
          by_company: advertisementByCompany,
        },
      } as any;

      //   await this.redisService.set(
      //     cacheKey.name,
      //     result,
      //     Milliseconds({ minutes: 5 }),
      //   );

      return result;
    } catch (error) {
      Log(
        LogType.ERROR,
        DashboardGeneralService.name,
        this.dashboardComplete.name,
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
