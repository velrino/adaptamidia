import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DateTime } from 'luxon';
import {
  DashboardDisplayLogsAggregation,
  DashboardDisplayLogsAggregationDocument,
  AggregationPeriod,
} from '../dashboard-display-logs.schema';
import {
  DisplayLog,
  DisplayLogDocument,
} from '../../display-logs/display-logs.schema';
import { EntityFieldEnum } from '../dashboard-display-logs.interface';
import { RedisService } from 'src/shared/redis/redis.service';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { Milliseconds } from 'src/shared/general';
import { Cron, CronExpression } from '@nestjs/schedule';

export interface IAggregationResult {
  _id: string;
  advertiser?: string;
  advertisement?: string;
  local_unit?: string;
  news?: string;
  displays: number;
  total_people: number;
  total_men: number;
  total_women: number;
  max_age: number;
  min_age: number;
}

@Injectable()
export class DashboardDisplayLogsProcessService {
  constructor(
    @InjectModel(DashboardDisplayLogsAggregation.name)
    private dashboardModel: Model<DashboardDisplayLogsAggregationDocument>,
    @InjectModel(DisplayLog.name)
    private displayLogModel: Model<DisplayLogDocument>,
    private readonly redisService: RedisService,
  ) {}

  async onApplicationBootstrap() {
    // await this.dashboardModel.deleteMany({});
    await this.execute();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async execute() {
    const lockKey = `dashboard-process-${new Date().toISOString().split('T')[0]}`;
    const lockAcquired = await this.acquireLock(
      lockKey,
      Milliseconds({ minutes: 5 }),
    );

    if (!lockAcquired) {
      console.log('Dashboard processing already running on another instance');
      return;
    }

    try {
      Log(
        LogType.INFO,
        DashboardDisplayLogsProcessService.name,
        this.execute.name,
        LogAction.STARTED,
        { lockKey },
      );

      const entities = [
        EntityFieldEnum.advertisement,
        EntityFieldEnum.local_unit,
        EntityFieldEnum.news,
      ];

      const periods = [
        this.getLogsByDay,
        // this.getLogsByWeek,
        // this.getLogsByMonth,
        // this.getLogsByYear,
      ];

      for (const entity of entities) {
        for (const fn of periods) {
          await fn.call(this, new Date(), entity);
        }
      }
    } finally {
      await this.releaseLock(lockKey);
      Log(
        LogType.INFO,
        DashboardDisplayLogsProcessService.name,
        this.execute.name,
        LogAction.FINISHED,
        { lockKey },
      );
    }
  }

  private async acquireLock(key: string, ttlMs: number): Promise<boolean> {
    const existing = await this.redisService.get(key);
    if (existing) {
      return false;
    }

    await this.redisService.set(key, 'locked', ttlMs);

    // Verifica novamente para evitar race condition
    const doubleCheck = await this.redisService.get(key);
    return doubleCheck === 'locked';
  }

  private async releaseLock(key: string): Promise<void> {
    await this.redisService.del(key);
  }

  private getDateRange(
    period: AggregationPeriod,
    date: Date,
  ): { startDate: Date; endDate: Date } {
    const dt = DateTime.fromJSDate(date);

    switch (period) {
      case AggregationPeriod.DAY:
        return {
          startDate: dt.startOf('day').toJSDate(),
          endDate: dt.endOf('day').toJSDate(),
        };
      case AggregationPeriod.WEEK:
        return {
          startDate: dt.startOf('week').toJSDate(),
          endDate: dt.endOf('week').toJSDate(),
        };
      case AggregationPeriod.MONTH:
        return {
          startDate: dt.startOf('month').toJSDate(),
          endDate: dt.endOf('month').toJSDate(),
        };
      case AggregationPeriod.YEAR:
        return {
          startDate: dt.startOf('year').toJSDate(),
          endDate: dt.endOf('year').toJSDate(),
        };
    }
  }

  private async executeQuery(
    startDate: Date,
    endDate: Date,
    entityField: EntityFieldEnum,
    currentPeriod: AggregationPeriod,
  ): Promise<IAggregationResult[]> {
    const matchCondition: any = {
      start_at: { $gte: startDate, $lte: endDate },
      [entityField]: { $exists: true, $ne: null },
      $or: [{ 'yolo.people': { $gt: 0 } }, { 'insightface.total': { $gt: 0 } }],
    };

    if (entityField === EntityFieldEnum.advertisement) {
      matchCondition[EntityFieldEnum.advertiser] = { $exists: true, $ne: null };
    }

    const pipeline = [
      {
        $match: matchCondition,
      },
      {
        $group: {
          _id: `$${entityField}`,
          ...(entityField === EntityFieldEnum.advertisement && {
            advertiser: { $first: `$${EntityFieldEnum.advertiser}` },
            advertisement: { $first: `$${EntityFieldEnum.advertisement}` },
          }),
          ...(entityField === EntityFieldEnum.local_unit && {
            local_unit: { $first: `$${EntityFieldEnum.local_unit}` },
          }),
          ...(entityField === EntityFieldEnum.news && {
            news: { $first: `$${EntityFieldEnum.news}` },
          }),
          displays: { $sum: 1 },
          total_people: {
            $sum: {
              $cond: [
                { $gt: ['$yolo.people', 0] },
                '$yolo.people',
                { $ifNull: ['$insightface.total', 0] },
              ],
            },
          },
          total_men: { $sum: { $ifNull: ['$insightface.men', 0] } },
          total_women: { $sum: { $ifNull: ['$insightface.women', 0] } },
          max_age: { $max: '$insightface.age.max' },
          min_age: { $min: '$insightface.age.min' },
        },
      },
    ];

    const records: IAggregationResult[] = [];
    const batchOperations: any[] = [];
    const normalizedStartDate = DateTime.fromJSDate(startDate)
      .startOf('day')
      .toUTC()
      .toJSDate();

    const cursor = this.displayLogModel.aggregate(pipeline).cursor();

    for await (const record of cursor) {
      records.push(record);

      const updateDoc = {
        date: normalizedStartDate,
        period: currentPeriod,
        [entityField]: record._id,
        ...(entityField === EntityFieldEnum.advertisement && {
          advertiser: record.advertiser,
          advertisement: record.advertisement,
        }),
        ...(entityField === EntityFieldEnum.local_unit && {
          local_unit: record.local_unit,
        }),
        ...(entityField === EntityFieldEnum.news && {
          news: record.news,
        }),
        entity_id: new Types.ObjectId(record._id),
        displays: record.displays,
        total_people: record.total_people,
        total_men: record.total_men,
        total_women: record.total_women,
        age: {
          max: record.max_age,
          min: record.min_age,
          average: Math.round((record.min_age + record.max_age) / 2),
        },
      };

      batchOperations.push({
        updateOne: {
          filter: {
            date: normalizedStartDate,
            period: currentPeriod,
            [entityField]: record._id,
          },
          update: { $set: updateDoc },
          upsert: true,
        },
      });
    }

    if (batchOperations.length > 0) {
      await this.dashboardModel.bulkWrite(batchOperations, { ordered: false });
    }

    return records;
  }

  async getLogsByDay(
    date: Date,
    entityField: EntityFieldEnum,
  ): Promise<IAggregationResult[]> {
    const { startDate, endDate } = this.getDateRange(
      AggregationPeriod.DAY,
      date,
    );
    return await this.executeQuery(
      startDate,
      endDate,
      entityField,
      AggregationPeriod.DAY,
    );
  }

  // async getLogsByWeek(
  //   date: Date,
  //   entityField: EntityFieldEnum,
  // ): Promise<IAggregationResult[]> {
  //   const { startDate, endDate } = this.getDateRange(
  //     AggregationPeriod.WEEK,
  //     date,
  //   );
  //   return await this.executeQuery(
  //     startDate,
  //     endDate,
  //     entityField,
  //     AggregationPeriod.WEEK,
  //   );
  // }

  // async getLogsByMonth(
  //   date: Date,
  //   entityField: EntityFieldEnum,
  // ): Promise<IAggregationResult[]> {
  //   const { startDate, endDate } = this.getDateRange(
  //     AggregationPeriod.MONTH,
  //     date,
  //   );
  //   return await this.executeQuery(
  //     startDate,
  //     endDate,
  //     entityField,
  //     AggregationPeriod.MONTH,
  //   );
  // }

  // async getLogsByYear(
  //   date: Date,
  //   entityField: EntityFieldEnum,
  // ): Promise<IAggregationResult[]> {
  //   const { startDate, endDate } = this.getDateRange(
  //     AggregationPeriod.YEAR,
  //     date,
  //   );
  //   return await this.executeQuery(
  //     startDate,
  //     endDate,
  //     entityField,
  //     AggregationPeriod.YEAR,
  //   );
  // }
}
