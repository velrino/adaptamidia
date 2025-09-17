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
/*
  Dashboard Display Logs Aggregation – Incremental Design

  This service aggregates `display_logs` into daily dashboard buckets for each
  entity dimension (advertisement, local_unit, news) with the following goals:
  - Process only new/changed data (delta) using `dashboard_aggregated_at: null`.
  - Keep writes idempotent and conflict-free using $inc and $min/$max.
  - Avoid recomputing entire days every minute.
  - Ensure each DisplayLog contributes once per dimension before being marked.

  Key choices:
  - Date source: uses `start_at` and stores bucket `date` at midnight UTC.
  - People metric: per-log people = max(yolo.people, insightface.total).
  - Age fields: maintain `age.min` and `age.max` only via $min/$max (no $set on `age`).
  - Marking: after all dimensions, set `dashboard_aggregated_at` to exclude logs next run.
  - Locking: Firebase-based distributed lock prevents overlapping executions.
*/
import { FirebaseDatabaseService } from 'src/shared/firebase/firebase-database.service';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import {
  Environments,
  GetEnvironment,
  LockKeyName,
  Milliseconds,
} from 'src/shared/general';
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
    // Protected by the distributed lock, so multiple instances are safe.
    await this.execute();
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async execute() {
    const lockKey = LockKeyName(`dashboard-display-logs:process`);

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

      // Incremental strategy
      // 1) Aggregate by entity (advertisement, local_unit, news) using only
      //    logs where `dashboard_aggregated_at: null`.
      // 2) Upsert with `$inc` counters and `$min/$max` for ages – no `$set` on `age`.
      // 3) After all dimensions are done, mark the logs as aggregated.
      // This ensures one log contributes once per dimension before being excluded.

      const entities = [
        EntityFieldEnum.advertisement,
        EntityFieldEnum.local_unit,
        EntityFieldEnum.news,
      ];

      for (const entity of entities) {
        await this.processIncrementalByDay(entity);
      }

      // After all dimensions are updated, mark source logs as aggregated.
      // This prevents reprocessing and ensures a single pass across dimensions.
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
   * - Only matches logs with `dashboard_aggregated_at: null` (delta only)
   * - Groups by entity and day (from `start_at`, stored as midnight UTC)
   * - Upserts with `$inc` to avoid recomputation, and `$min/$max` for ages
   * - Never `$set` the full `age` object to avoid path conflicts with `age.*`
   */
  private async processIncrementalByDay(
    entityField: EntityFieldEnum,
  ): Promise<IAggregationResult[]> {
    // Match only logs that are ready for counting and were never aggregated.
    // People criteria: either YOLO or Insightface detected > 0.
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
          // Guard against nulls using $ifNull
          total_people: {
            $sum: {
              $max: [
                { $ifNull: ['$yolo.people', 0] },
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
      { $sort: { '_id.date': 1 as const } },
    ];

    const results: IAggregationResult[] = [];
    const ops: any[] = [];

    // Stream results to avoid loading everything in memory.
    const cursor = this.displayLogModel.aggregate(pipeline).cursor();
    for await (const record of cursor) {
      results.push(record);

      // Daily bucket date at midnight UTC (Date type; avoids null `date`)
      const bucketDate = new Date(`${record._id.date}T00:00:00.000Z`);
      const entityId = new Types.ObjectId(record._id.entity);

      // Base filter identifying the aggregation bucket document.
      // Upsert will insert a document containing these identifying fields,
      // so we don't need `$setOnInsert` for them.
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

      // Increment counters only. On insert, MongoDB combines the filter fields
      // with these `$inc` values to create the new document.
      const update: any = {
        // Incremental counters; on upsert-insert Mongo initializes with these values
        $inc: {
          displays: record.displays,
          total_people: record.total_people,
          total_men: record.total_men,
          total_women: record.total_women,
        },
      };

      // Maintain age boundaries safely with subpath updates only.
      // Include `$min`/`$max` only when values are valid numbers.
      if (Number.isFinite(record.min_age)) {
        update.$min = { ...(update.$min || {}), 'age.min': record.min_age };
      }
      if (Number.isFinite(record.max_age)) {
        update.$max = { ...(update.$max || {}), 'age.max': record.max_age };
      }

      ops.push({ updateOne: { filter, update, upsert: true } });
    }

    if (ops.length > 0) {
      await this.dashboardModel.bulkWrite(ops, { ordered: false });
    }

    return results;
  }

  /**
   * Mark all not-yet-aggregated DisplayLog documents that are eligible for
   * aggregation as aggregated. This runs AFTER all entity dimensions have been
   * processed to ensure a single log contributes once per dimension.
   *
   * Resilience: if a crash happens before this step completes, the next run
   * will still pick up unmarked logs and continue from where it left off.
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
