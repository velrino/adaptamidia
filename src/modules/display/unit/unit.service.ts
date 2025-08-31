import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryOptions, SortOrder, Types } from 'mongoose';

import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { RESULT } from 'src/shared/result.enum';
import { RedisService } from 'src/shared/redis/redis.service';
import { RedisKeysEnum } from 'src/shared/redis/redis.keys';
import {
  DisplayType,
  IDisplayAdvertisementNewsQuery,
  IDisplayAdvertisementPaginateDto,
  IDisplayAdvertisementUnit,
  IDisplayItem,
} from './unit.interface';
import { DateTime } from 'luxon';
import { News, NewsDocument } from 'src/modules/news/news.schema';
import { ShuffleArray } from 'src/shared/general';
import {
  Advertisement,
  AdvertisementDocument,
} from 'src/modules/advertisement/advertisement.schema';
import { DisplayService } from '../display.service';

@Injectable()
export class DisplayByUnitService {
  constructor(
    private readonly displayService: DisplayService,
    @InjectModel(Advertisement.name)
    private readonly model: Model<AdvertisementDocument>,
    @InjectModel(News.name)
    readonly newsModel: Model<NewsDocument>,
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

  async getAds(parameters: IDisplayAdvertisementPaginateDto) {
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
      .select({
        _id: 1,
        status: 1,
        type: 1,
        seconds: 1,
        start_date: 1,
        end_date: 1,
        title: 1,
        source_landscape: 1,
        source_portrait: 1,
      })
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

  async getNews(parameters: IDisplayAdvertisementNewsQuery) {
    const cacheKey = this.redisService.createKeyByObject(
      `${RedisKeysEnum.DISPLAY_NEWS}`,
      parameters,
    );

    const dataCached: any = await this.redisService.get(
      cacheKey.parameters_encrypted,
    );

    if (dataCached) {
      return dataCached;
    }

    const query: QueryOptions<NewsDocument[]> = {};

    // Include specific sources (if provided)
    if (parameters?.include_source_name?.length) {
      query.source_name = { $in: parameters.include_source_name };
    }

    // Exclude specific sources (if provided)
    // If both include and exclude exist, combine them correctly
    if (parameters?.exclude_source_name?.length) {
      if (query.source_name?.$in) {
        query.source_name.$in = query.source_name.$in.filter(
          (current_source_name: string) =>
            !parameters.exclude_source_name.includes(current_source_name),
        );
      } else {
        query.source_name = { $nin: parameters.exclude_source_name };
      }
    }

    const dbQuery = this.newsModel.find(query);

    const sortBy: Record<string, SortOrder> = { published_at: -1 };

    const record = await dbQuery
      .sort(sortBy)
      .limit(parameters.limit)
      .lean()
      .exec();

    await this.redisService.set(cacheKey.parameters_encrypted, record, 300000); // 5 minutes

    return record;
  }

  generateContent({
    newsList,
    adsList,
    min_news_before_ad = 2,
    max_news_before_ad = 4,
    min_ads_in_sequence = 1,
    max_ads_in_sequence = 1,
    target_size,
  }: {
    newsList: NewsDocument[];
    adsList: AdvertisementDocument[];
    min_news_before_ad?: number;
    max_news_before_ad?: number;
    min_ads_in_sequence?: number;
    max_ads_in_sequence?: number;
    target_size: number;
  }): {
    result: IDisplayItem[];
    total: {
      news: number;
      ads: number;
    };
  } {
    const result: IDisplayItem[] = new Array(target_size);
    let resultIndex = 0;
    let newsIndex = 0;
    let adsIndex = 0;
    let totalNews = 0;
    let totalAds = 0;

    const randBetween = (min: number, max: number) =>
      Math.floor(Math.random() * (max - min + 1)) + min;

    while (resultIndex < target_size) {
      // --- ADD NEWS  ---
      const newsCount = randBetween(min_news_before_ad, max_news_before_ad);
      const newsToAdd = Math.min(
        newsCount,
        newsList.length - newsIndex,
        target_size - resultIndex,
      );

      for (let i = 0; i < newsToAdd; i++) {
        result[resultIndex++] = {
          type: DisplayType.NEWS,
          news: newsList[newsIndex++],
        };
        totalNews++;
      }

      // Only add ads if you've added some content first and there's still space
      if (newsToAdd > 0 && resultIndex < target_size) {
        const adsCount = randBetween(min_ads_in_sequence, max_ads_in_sequence);
        const adsToAdd = Math.min(adsCount, target_size - resultIndex);

        for (let i = 0; i < adsToAdd; i++) {
          result[resultIndex++] = {
            type: DisplayType.ADVERTISEMENT,
            ads: adsList[adsIndex],
          };
          totalAds++;
          adsIndex = (adsIndex + 1) % adsList.length;
        }
      }

      // If filled less than targetSize, trim the array.
      if (newsIndex >= newsList.length) {
        break;
      }
    }

    // If there are no more news, exit the loop
    if (resultIndex < target_size) {
      result.length = resultIndex;
    }

    return {
      result,
      total: {
        news: totalNews,
        ads: totalAds,
      },
    };
  }

  async execute(parameters: IDisplayAdvertisementPaginateDto) {
    try {
      const unitId = new Types.ObjectId(parameters.id);

      const currentUnit: IDisplayAdvertisementUnit =
        await this.displayService.getUnit(unitId);

      const newsQuery: IDisplayAdvertisementNewsQuery = {
        include_source_name:
          currentUnit?.preferences?.include_source_name || [],
        exclude_source_name:
          currentUnit?.preferences?.exclude_source_name || [],
        limit: parameters.news_limit || 50,
        cache: parameters.cache,
      };

      const newsList = ShuffleArray(await this.getNews(newsQuery));

      const cacheKeyParameters = {
        ...parameters,
        ...newsQuery,
      };

      const cacheKey = this.redisService.createKeyByObject(
        `${RedisKeysEnum.DISPLAY_RESULT}:${parameters.id}`,
        cacheKeyParameters,
      );

      if (parameters.cache) {
        const dataCached = await this.redisService.get(cacheKey.name);

        if (dataCached) {
          return dataCached;
        }
      }

      const records = await this.getAds({ ...parameters, limit: 100 });

      const contentGenerated = this.generateContent({
        newsList: newsList,
        adsList: records.data,
        min_news_before_ad:
          parameters.min_news_before_ad ||
          currentUnit?.preferences?.min_news_before_ad ||
          1,
        max_news_before_ad:
          parameters.max_news_before_ad ||
          currentUnit?.preferences?.max_news_before_ad ||
          3,
        min_ads_in_sequence:
          parameters.min_ads_in_sequence ||
          currentUnit?.preferences?.min_ads_in_sequence ||
          1,
        max_ads_in_sequence:
          parameters.max_ads_in_sequence ||
          currentUnit?.preferences?.max_ads_in_sequence ||
          3,
        target_size:
          parameters.target_size ||
          currentUnit?.preferences?.target_size ||
          100,
      });

      const paginate = {
        pages: records.pages,
        total: records.total,
        limit: records.limit,
        page: records.page,
      };

      const content = {
        total: contentGenerated.result.length,
        ads: {
          total: contentGenerated.total.ads,
          unique: records.data.length,
        },
        news: {
          total: contentGenerated.total.news,
          unique: newsList.length,
        },
      };

      const result = {
        unit: currentUnit,
        paginate,
        content,
        data: contentGenerated.result,
      };

      await this.redisService.set(cacheKey.name, result, 300000); // 5 minutes

      return result;
    } catch (error) {
      Log(
        LogType.ERROR,
        DisplayByUnitService.name,
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
