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
    // Start the background process at boot to catch up quickly.
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

      // We run an incremental aggregation by day, per entity, over
      // only the logs that were not yet aggregated (dashboard_aggregated_at: null).
      // Important: we process all entity dimensions first, then mark the
      // DisplayLog documents as aggregated to ensure a single log contributes
      // to each dimension (advertisement, local_unit, news) before being marked.

      const entities = [
        EntityFieldEnum.advertisement,
        EntityFieldEnum.local_unit,
        EntityFieldEnum.news,
      ];

      for (const entity of entities) {
        await this.processIncrementalByDay(entity);
      }

      // After all entity dimensions have been updated, mark the source
      // DisplayLog rows as aggregated. This prevents reprocessing and
      // ensures a single pass for each log across all dimensions.
      await this.markDisplayLogsAsAggregated();
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

  /**
   * Incrementally aggregate not-yet-aggregated DisplayLog rows into
   * daily buckets for the given entity field.
   * - Only matches logs with dashboard_aggregated_at: null
   * - Groups by entity and by day (derived from start_at)
   * - Upserts with $inc to avoid recalculating existing totals
   * - Uses $min/$max to maintain age boundaries; average is set on insert
   */
  private async processIncrementalByDay(
    entityField: EntityFieldEnum,
  ): Promise<IAggregationResult[]> {
    // Match only logs that are ready for counting and were never aggregated.
    // We allow logs where either YOLO or Insightface detected people.
    const matchCondition: any = {
      dashboard_aggregated_at: null,
      [entityField]: { $exists: true, $ne: null },
      $or: [{ 'yolo.people': { $gt: 0 } }, { 'insightface.total': { $gt: 0 } }],
    };

    // If aggregating advertisements, ensure advertiser linkage exists too.
    if (entityField === EntityFieldEnum.advertisement) {
      matchCondition[EntityFieldEnum.advertiser] = { $exists: true, $ne: null };
    }

    const pipeline = [
      { $match: matchCondition },
      {
        $group: {
          _id: {
            entity: `$${entityField}`,
            // Use start_at as the canonical date; end_at may be null
            date: {
              $dateToString: {
                format: '%Y-%m-%d',
                date: '$start_at',
                timezone: 'UTC',
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
          // Totals from the not-yet-aggregated slice only
          displays: { $sum: 1 },
          // People counted per log = max(yolo.people, insightface.total)
          // Then summed across the group to avoid double weighting
          total_people: {
            $sum: { $max: ['$yolo.people', '$insightface.total'] },
          },
          total_men: { $sum: { $ifNull: ['$insightface.men', 0] } },
          total_women: { $sum: { $ifNull: ['$insightface.women', 0] } },
          max_age: { $max: '$insightface.age.max' },
          min_age: { $min: '$insightface.age.min' },
        },
      },
      { $sort: { '_id.date': 1 as const } },
    ];

    const results: IAggregationResult[] = [];
    const ops: any[] = [];

    // Stream results to avoid loading everything in memory.
    const cursor = this.displayLogModel.aggregate(pipeline).cursor();
    for await (const record of cursor) {
      results.push(record);

      // Daily bucket date at midnight UTC
      const bucketDate = new Date(`${record._id.date}T00:00:00.000Z`);
      const entityId = new Types.ObjectId(record._id.entity);

      // Base filter identifying the aggregation bucket document
      const filter = {
        date: bucketDate,
        period: AggregationPeriod.DAY,
        entity_id: entityId,
        [entityField]: entityId,
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

      // Increment counts; on insert set static fields and initial age.
      const update = {
        $setOnInsert: {
          date: bucketDate,
          period: AggregationPeriod.DAY,
          entity_id: entityId,
          [entityField]: entityId,
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
          age: {
            max: record.max_age,
            min: record.min_age,
            // On insert, compute average from this slice; later updates adjust min/max
            // and we accept average as an approximation or can be recomputed offline if needed.
            average: Math.round((record.min_age + record.max_age) / 2),
          },
        },
        $inc: {
          displays: record.displays,
          total_people: record.total_people,
          total_men: record.total_men,
          total_women: record.total_women,
        },
        $min: { 'age.min': record.min_age },
        $max: { 'age.max': record.max_age },
      } as any;

      ops.push({ updateOne: { filter, update, upsert: true } });
    }

    if (ops.length > 0) {
      await this.dashboardModel.bulkWrite(ops, { ordered: false });
    }

    return results;
  }

  /**
   * Mark all not-yet-aggregated DisplayLog documents that are eligible for
   * aggregation as aggregated. This runs after all entity dimensions have been
   * processed to ensure one log can contribute to each dimension exactly once.
   */
  private async markDisplayLogsAsAggregated() {
    const now = new Date();
    const filter = {
      dashboard_aggregated_at: null,
      $and: [
        {
          // Eligible logs: at least one entity dimension present
          $or: [
            { [EntityFieldEnum.advertisement]: { $exists: true, $ne: null } },
            { [EntityFieldEnum.local_unit]: { $exists: true, $ne: null } },
            { [EntityFieldEnum.news]: { $exists: true, $ne: null } },
          ],
        },
        {
          // People detected by either model
          $or: [
            { 'yolo.people': { $gt: 0 } },
            { 'insightface.total': { $gt: 0 } },
          ],
        },
      ],
    } as any;

    await this.displayLogModel.updateMany(filter, {
      $set: { dashboard_aggregated_at: now },
    });
  }
}
