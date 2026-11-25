import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, SortOrder } from 'mongoose';
import { News, NewsDocument } from '../news.schema';
import { RedisService } from 'src/shared/redis/redis.service';
import {
  NewsOrderBy,
  NewsPaginateDto,
  PaginatedResult,
} from './paginate.interface';
import { FromEnum, SortEnum } from 'src/shared/interfaces/paginate.dto';
import { queryStringHelper } from 'src/shared/helpers/query-string';
import { RedisKeysEnum } from 'src/shared/redis/redis.keys';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { RESULT } from 'src/shared/result.enum';

@Injectable()
export class PaginateNewsService {
  constructor(
    @InjectModel(News.name)
    readonly model: Model<NewsDocument>,
    private readonly redisService: RedisService,
  ) {}

  async getData(parameters: NewsPaginateDto) {
    const skip = (parameters.page - 1) * parameters.limit;

    let query = {};

    // Filter by source_name
    if (parameters?.source_name?.length) {
      query = { ...query, source_name: { $in: parameters.source_name } };
    }

    query = {
      ...query,
    };

    // Fetch the results with pagination and sorting
    const dbQuery = this.model.find(query);

    let sortBy: Record<string, SortOrder> = { published_at: -1 };

    if (parameters.order && parameters.sort) {
      const sort: SortOrder = parameters.sort === SortEnum.ASC ? 1 : -1;

      const orderColumns = Object.values(NewsOrderBy);

      const column = orderColumns[parameters.order] ?? NewsOrderBy.published_at;

      sortBy = { [column]: sort };
    }

    const total = await this.model.countDocuments(query).sort(sortBy);

    const data = await dbQuery
      .sort(sortBy)
      .skip(skip)
      .limit(parameters.limit)
      .lean()
      .exec();

    return {
      data,
      filters: { query, sortBy },
      total,
      page: parameters.page,
      pages: Math.ceil(total / parameters.limit) || 0,
    };
  }

  async execute(
    queryString: NewsPaginateDto,
    provider: any = null,
  ): Promise<PaginatedResult<News>> {
    const parameters = queryStringHelper(queryString);

    try {
      const cacheKey = this.prepareCacheKey(parameters);
      const cachedData = await this.getCachedData(cacheKey);

      if (cachedData && parameters.cache) {
        return this.buildPaginatedResult(
          cachedData,
          provider,
          parameters,
          FromEnum.CACHE,
        );
      }

      const dbData = await this.getDataFromDb(parameters);
      await this.cacheData(cacheKey, dbData);

      return this.buildPaginatedResult(
        dbData,
        provider,
        parameters,
        FromEnum.DATABASE,
      );
    } catch (error) {
      this.handleError(error, parameters);
    }
  }

  private prepareCacheKey(parameters: any): string {
    const parametersAsString = Object.entries(parameters)
      .map(([key, value]: any) => `${key}=${value}`)
      .join(':');

    return this.redisService.prepareCacheKey(
      RedisKeysEnum.LIST_NEWS,
      parametersAsString,
    );
  }

  private async getCachedData(
    cacheKey: string,
  ): Promise<PaginatedResult<News> | null> {
    const cachedData =
      await this.redisService.get<PaginatedResult<News>>(cacheKey);
    return cachedData || null;
  }

  private async getDataFromDb(
    parameters: any,
  ): Promise<Partial<PaginatedResult<News>>> {
    const data = await this.getData(parameters);
    return {
      data: data.data,
      total: data.total,
      page: data.page || 0,
      pages: data.pages || 0,
    };
  }

  private async cacheData(cacheKey: string, data: any): Promise<void> {
    await this.redisService.set(cacheKey, data, 300000); // 5 minutes
  }

  private buildPaginatedResult(
    data: any,
    provider: any,
    parameters: any,
    from: FromEnum,
  ): PaginatedResult<News> {
    return {
      from,
      total: data.total,
      pages: data.pages,
      page: data.page,
      provider,
      parameters,
      data: data.data,
    };
  }

  private handleError(error: any, parameters: any): never {
    Log(
      LogType.ERROR,
      PaginateNewsService.name,
      this.execute.name,
      LogAction.FAILED,
      {
        parameters,
        error,
      },
    );

    throw new HttpException(
      error?.message || RESULT.NEWS_LIST_FAILED,
      error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}
