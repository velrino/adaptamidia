import { Injectable, OnModuleInit } from '@nestjs/common';
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
import { FirebaseDatabaseService } from 'src/shared/firebase/firebase-database.service';
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
export class DashboardDisplayLogsProcessService implements OnModuleInit {
  constructor(
    @InjectModel(DashboardDisplayLogsAggregation.name)
    private dashboardModel: Model<DashboardDisplayLogsAggregationDocument>,
    @InjectModel(DisplayLog.name)
    private displayLogModel: Model<DisplayLogDocument>,
    private readonly firebaseDb: FirebaseDatabaseService,
  ) {}

  async onModuleInit() {
    // await this.dashboardModel.deleteMany({});

    await this.execute();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async execute() {
    const lockKey = 'dashboard-display-logs:process';
    const acquired = await this.firebaseDb.acquireLock(
      lockKey,
      Milliseconds({ minutes: 5 }),
    );

    if (!acquired) {
      Log(
        LogType.INFO,
        DashboardDisplayLogsProcessService.name,
        this.execute.name,
        LogAction.SKIP,
        { about: 'LOCK_NOT_ACQUIRED', lockKey },
      );
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

      const periods = [this.getLogsByDay];

      for (const entity of entities) {
        for (const fn of periods) {
          await fn.call(this, new Date(), entity);
        }
      }
    } finally {
      await this.firebaseDb.releaseLock(lockKey);
      Log(
        LogType.INFO,
        DashboardDisplayLogsProcessService.name,
        this.execute.name,
        LogAction.FINISHED,
        { lockKey },
      );
    }
  }

  private getDateRange(date: Date): { startDate: Date; endDate: Date } {
    const dt = DateTime.fromJSDate(date);

    return {
      startDate: dt.startOf('day').toJSDate(),
      endDate: dt.endOf('day').toJSDate(),
    };
  }

  private async executeQuery(
    startDate: Date,
    endDate: Date,
    entityField: EntityFieldEnum,
    currentPeriod: AggregationPeriod,
  ): Promise<IAggregationResult[]> {
    const matchCondition: any = {
      // start_at: { $gte: startDate, $lte: endDate },
      [entityField]: { $exists: true, $ne: null },
      $and: [
        { 'yolo.people': { $gt: 0 } },
        { 'insightface.total': { $gt: 0 } },
      ],
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
          _id: {
            entity: `$${entityField}`,
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$end_at',
              },
            },
          },
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
          end_at: { $first: '$end_at' },
        },
      },
      {
        $sort: {
          '_id.date': 1 as const,
        },
      },
    ];

    const records: IAggregationResult[] = [];
    const batchOperations: any[] = [];

    const cursor = this.displayLogModel.aggregate(pipeline).cursor();

    for await (const record of cursor) {
      records.push(record);

      const filter = {
        date: record._id.date,
        period: currentPeriod,
        entity_id: new Types.ObjectId(record._id.entity),
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
      };

      const updateDoc = {
        ...filter,
        entity_id: new Types.ObjectId(record._id.entity),
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
          filter,
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
    const { startDate, endDate } = this.getDateRange(date);

    return await this.executeQuery(
      startDate,
      endDate,
      entityField,
      AggregationPeriod.DAY,
    );
  }
}
