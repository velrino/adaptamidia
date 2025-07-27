import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  Advertisement,
  AdvertisementDocument,
} from 'src/modules/advertisement/advertisement.schema';
import {
  CompanyUnit,
  CompanyUnitDocument,
} from 'src/modules/company-unit/company-unit.schema';
import { News, NewsDocument } from 'src/modules/news/news.schema';
import { CustomRequest } from 'src/shared/request';
import {
  IAdvertisementEssential,
  ICreateDisplayLog,
  ICreateDisplayLogDto,
  ICreateDisplayLogProcessor,
} from './create.interface';
import { DateTime } from 'luxon';
import { RESULT } from 'src/shared/result.enum';
import { RedisKeysEnum } from 'src/shared/redis/redis.keys';
import { RedisService } from 'src/shared/redis/redis.service';

import { ICheckExist } from 'src/shared/interfaces/paginate.dto';
import { DisplayLog, DisplayLogDocument } from '../display-logs.schema';
import { CalculateTimeDifferenceInSeconds } from 'src/shared/general';
import { QueueService } from 'src/modules/queue/queue.service';
import { QueuesEnum } from 'src/modules/queue/queue.interface';
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import {
  DisplayType,
  IDisplayAdvertisementUnit,
} from 'src/modules/display/unit/unit.interface';

@Processor(QueuesEnum.DISPLAY_LOG_CREATE)
@Injectable()
export class CreateDisplayLogService {
  constructor(
    private readonly queueService: QueueService,
    @InjectModel(DisplayLog.name)
    private readonly displayLogModel: Model<DisplayLogDocument>,
    @InjectModel(Advertisement.name)
    private readonly advertisementModel: Model<AdvertisementDocument>,
    @InjectModel(CompanyUnit.name)
    private readonly companyUnitModel: Model<CompanyUnitDocument>,
    @InjectModel(News.name)
    readonly newsModel: Model<NewsDocument>,
    private readonly redisService: RedisService,
  ) {}

  prepareBody(currentRequest: CustomRequest, parameters: ICreateDisplayLogDto) {
    const currentTimezone = currentRequest.custom_client.timezone;

    const body: ICreateDisplayLog = {
      id: new Types.ObjectId(parameters.id),
      local: new Types.ObjectId(parameters.local),
      type: parameters.type,
      status: parameters.status,
      start_at: DateTime.fromJSDate(new Date(parameters.start_at), {
        zone: currentTimezone,
      }),
      identifier: parameters.identifier,
      ip: currentRequest.custom_client?.ip || String(),
      user_agent: currentRequest.custom_client.ua,
      data: currentRequest.custom_client,
    };

    if (parameters.end_at) {
      body.end_at = DateTime.fromJSDate(new Date(parameters.end_at), {
        zone: currentTimezone,
      });
    }

    return body;
  }

  @Process({ concurrency: 5 })
  async processJob(job: Job<ICreateDisplayLogProcessor>) {
    try {
      await this.execute(job.data.parameters);
      await job.isCompleted();
    } catch (error) {
      Log(
        LogType.ERROR,
        CreateDisplayLogService.name,
        this.processJob.name,
        LogAction.FAILED,
        { error },
      );
      await job.remove();
      throw error;
    }
  }

  // async onApplicationBootstrap() {
  //    Debug
  //   await this.queueService.addQueueDetectImage({
  //     id: new Types.ObjectId('6881c38478913214f5aca561'),
  //     // id: new Types.ObjectId('68837ac478913214f5aca84d'),
  //   });
  // }

  async executeFromGuestRequest(
    currentRequest: CustomRequest,
    parameters: ICreateDisplayLogDto,
    // id?: string,
  ) {
    try {
      const body = this.prepareBody(currentRequest, parameters);

      // Cria um timeout de 3 segundos
      const timeout = new Promise((resolve) => setTimeout(resolve, 5000));

      try {
        // Tenta executar e competir com o timeout
        const result = await Promise.race([
          this.execute(body),
          timeout.then(() => {
            throw new Error('timeout');
          }),
        ]);
        return result;
      } catch (error) {
        if (error.message === 'timeout') {
          // Se deu timeout, adiciona na fila
          return await this.queueService.addDisplayLogCreateQueue(body);
        }
        throw error;
      }

      // return this.execute(body);
    } catch (error) {
      throw new HttpException(
        error?.message || RESULT.DISPLAY_LOG_CREATE_EXECUTE_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async getAdvertisement(id: Types.ObjectId): Promise<IAdvertisementEssential> {
    const cacheKey = `${RedisKeysEnum.GET_ADS_ESSENTIAL}:${id.toString()}`;

    const dataCached: IAdvertisementEssential | null =
      await this.redisService.get(cacheKey);

    if (dataCached) {
      return dataCached;
    }

    const record = await this.advertisementModel
      .findOne({ _id: id, company: { $exists: true, $ne: null } })
      .select(['_id', 'status'])
      .populate<{
        company: NonNullable<IAdvertisementEssential['company']>;
      }>({
        path: 'company',
        select: ['_id', 'status'],
      })
      .lean<IAdvertisementEssential>();

    if (!record) {
      throw new HttpException(
        RESULT.ADVERTISEMENT_NOT_FOUND,
        HttpStatus.NOT_FOUND,
      );
    }

    if (!record?.company?._id) {
      throw new HttpException(
        RESULT.ADVERTISEMENT_WITHOUT_COMPANY_ID,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    await this.redisService.set(cacheKey, record, 300000); // 5 minutes

    return record;
  }

  async getUnit(id: Types.ObjectId): Promise<IDisplayAdvertisementUnit> {
    const cacheKey = `${RedisKeysEnum.GET_COMPANY_UNIT}:${id.toString()}`;

    const dataCached: IDisplayAdvertisementUnit | null =
      await this.redisService.get(cacheKey);

    if (dataCached) {
      return dataCached;
    }

    const record = await this.companyUnitModel
      .findOne({ _id: id, company: { $exists: true, $ne: null } })
      .select(['_id', 'name', 'status', 'company', 'preferences'])
      .populate<{
        company: NonNullable<IDisplayAdvertisementUnit['company']>;
      }>({
        path: 'company',
        select: ['_id', 'name', 'status'],
      })
      .lean<IDisplayAdvertisementUnit>();

    if (!record) {
      throw new HttpException(
        RESULT.INVALID_COMPANY_UNIT_ID,
        HttpStatus.NOT_FOUND,
      );
    }

    if (!record?.company?._id) {
      throw new HttpException(
        RESULT.COMPANY_UNIT_WITHOUT_COMPANY_ID,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    await this.redisService.set(cacheKey, record, 300000); // 5 minutes

    return record;
  }

  async getNews(id: Types.ObjectId) {
    const cacheKey = `${RedisKeysEnum.CHECK_COMPANY_UNIT}:${id.toString()}`;

    const cached: ICheckExist | null = await this.redisService.get(cacheKey);
    if (cached) {
      if (!cached.exists) {
        throw new HttpException(RESULT.INVALID_NEWS_ID, HttpStatus.NOT_FOUND);
      }
      return;
    }

    const exists = await this.newsModel.exists({ _id: id });

    const result: ICheckExist = {
      id: id.toString(),
      exists: Boolean(exists),
    };

    await this.redisService.set(cacheKey, result, 300000);

    if (!exists) {
      throw new HttpException(RESULT.INVALID_NEWS_ID, HttpStatus.NOT_FOUND);
    }
  }

  remapParameters(parameters: ICreateDisplayLog) {
    const body: ICreateDisplayLog = {
      ...parameters,
      id: new Types.ObjectId(parameters.id),
      local: new Types.ObjectId(parameters.local),
      type: parameters.type,
      status: parameters.status,
      start_at: DateTime.fromJSDate(new Date(parameters.start_at as any)),
    };

    if (parameters.end_at) {
      body.end_at = DateTime.fromJSDate(new Date(parameters.end_at as any));
    }

    return body;
  }

  async execute(payload: ICreateDisplayLog) {
    try {
      const parameters = this.remapParameters(payload);

      const currentBody: Partial<DisplayLog> = {};

      if (parameters.type === DisplayType.ADVERTISEMENT) {
        const advertisement = await this.getAdvertisement(parameters.id);
        currentBody.advertisement = new Types.ObjectId(advertisement._id);
        currentBody.advertiser = new Types.ObjectId(advertisement.company._id);
      } else if (parameters.type === DisplayType.NEWS) {
        await this.getNews(parameters.id);
        currentBody.news = new Types.ObjectId(parameters.id);
      }

      const localUnit = await this.getUnit(parameters.local);
      const localID = new Types.ObjectId(localUnit.company?._id);

      currentBody.seconds = 0;

      if (parameters.end_at) {
        currentBody.seconds = CalculateTimeDifferenceInSeconds(
          parameters.start_at,
          parameters.end_at,
        );
      }

      const record = await this.displayLogModel.create({
        ...currentBody,
        local: localID,
        local_unit: new Types.ObjectId(localUnit?._id),
        start_at: parameters.start_at,
        end_at: parameters.end_at,
        identifier: parameters.identifier,
        ip: parameters.ip,
        user_agent: parameters.user_agent,
        data: parameters.data,
        type: parameters.type,
        status: parameters.status,
      });

      await this.queueService.addQueueDetectImage({
        id: record._id as Types.ObjectId,
      });

      return record;
    } catch (error) {
      Log(
        LogType.ERROR,
        CreateDisplayLogService.name,
        this.execute.name,
        LogAction.FAILED,
        { payload, error },
      );
      throw new HttpException(
        error?.message || RESULT.DISPLAY_LOG_CREATE_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
