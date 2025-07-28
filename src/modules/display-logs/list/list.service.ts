import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, QueryOptions, Types, SortOrder } from 'mongoose';

import { AuthenticatedRequest } from 'src/shared/request';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { RESULT } from 'src/shared/result.enum';
import { MongoDbDateQuery } from 'src/shared/mongo.schema';
import {
  PaginatedResponseDto,
  SortEnum,
} from 'src/shared/interfaces/paginate.dto';
import { RedisService } from 'src/shared/redis/redis.service';
import { DisplayLog, DisplayLogDocument } from '../display-logs.schema';
import { ListDisplayLogsPaginateDto } from './list.interface';
import { GoogleCloudStorageService } from 'src/shared/google/cloud/google-cloud-storage.service';
import { IGoogleStorageBucket } from 'src/shared/google/cloud/google-cloud-storage.interface';

@Injectable()
export class ListDisplayLogService {
  constructor(
    @InjectModel(DisplayLog.name)
    public readonly model: Model<DisplayLogDocument>,
    private readonly redisService: RedisService,
    private readonly googleCloudStorageService: GoogleCloudStorageService,
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

    if (parameters.search) {
      query.$or = [
        { identifier: { $regex: parameters.search, $options: 'i' } },
        { ip: { $regex: parameters.search, $options: 'i' } },
        { user_agent: { $regex: parameters.search, $options: 'i' } },
        { type: { $regex: parameters.search, $options: 'i' } },
        { status: { $regex: parameters.search, $options: 'i' } },
      ];
    }

    const total = await this.model.countDocuments(query);

    const queryBuilder = this.model
      .find(query)
      .populate({
        path: 'news',
        select: [
          '_id',
          'description',
          'title',
          'source_name',
          'author',
          'image',
          'url',
        ],
      })
      .populate({
        path: 'advertisement',
        select: ['_id', 'description', 'title', 'items'],
      })
      .populate({
        path: 'local_unit',
        select: ['_id', 'full_address', 'type', 'name'],
      });

    const sortObject: Record<string, SortOrder> = parameters.sort_by
      ? {
          [parameters.sort_by]: (parameters.sort === SortEnum.ASC
            ? 1
            : -1) as SortOrder,
        }
      : { updated_at: -1 as SortOrder };

    let data = await queryBuilder
      .sort(sortObject)
      .select(['-data'])
      .skip(skip)
      .limit(parameters.limit)
      .lean()
      .exec();

    const pages = Math.ceil(total / parameters.limit);

    if (parameters.get_signed_url === true) {
      const expiresInMs = 60 * 60 * 1000; // 1 hour
      data = await Promise.all(
        data.map(async (item) => {
          // Inicializa as URLs como string vazia por padrão
          let capturePublicUrl: string | null = null;
          let captureBboxPublicUrl: string | null = null;

          // Obtém URL assinada apenas se item.capture existir
          if (item.capture) {
            capturePublicUrl =
              await this.googleCloudStorageService.getSignedUrlSafe(
                item.capture,
                item.bucket as IGoogleStorageBucket,
                false,
                expiresInMs,
              );
          }

          // Obtém URL assinada apenas se item.capture_bbox existir
          if (item.capture_bbox) {
            captureBboxPublicUrl =
              await this.googleCloudStorageService.getSignedUrlSafe(
                item.capture_bbox,
                item.bucket as IGoogleStorageBucket,
                false,
                expiresInMs,
              );
          }

          return {
            ...item,
            capture: capturePublicUrl || null,
            capture_bbox: captureBboxPublicUrl || null,
          } as any;
        }),
      );
    }

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
