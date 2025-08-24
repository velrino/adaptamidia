import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DashboardDisplayLogsAggregation,
  DashboardDisplayLogsAggregationDocument,
  AggregationPeriod,
  IGlobalAggregation,
  IByEntityAggregation,
} from '../dashboard-display-logs.schema';
import {
  DisplayLog,
  DisplayLogDocument,
} from '../../display-logs/display-logs.schema';
import { EntityFieldEnum } from '../dashboard-display-logs.interface';

@Injectable()
export class DashboardDisplayLogsProcessService {
  constructor(
    @InjectModel(DashboardDisplayLogsAggregation.name)
    private dashboardModel: Model<DashboardDisplayLogsAggregationDocument>,
    @InjectModel(DisplayLog.name)
    private displayLogModel: Model<DisplayLogDocument>,
  ) {}

  async onApplicationBootstrap() {
    await this.execute(
      new Date('2024-01-01'),
      new Date(),
      EntityFieldEnum.local_unit,
    );
  }

  async execute(startDate: Date, endDate: Date, entityField: EntityFieldEnum) {
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

    const records = await this.displayLogModel.aggregate(pipeline).exec();

    for (const record of records) {
      console.log({ record });
    }
  }
}
