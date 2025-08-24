import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { SchemaDefault } from 'src/shared/shema';

export interface IGenderStats {
  woman: number;
  man: number;
  total_men: number;
  total_women: number;
  total_people: number;
}

export interface IAgeStats {
  max: number;
  min: number;
  average: number;
}

export interface IConfidenceStats {
  average: number;
  max: number;
  min: number;
}

export enum AggregationPeriod {
  DAY = 'DAY',
  WEEK = 'WEEK',
  MONTH = 'MONTH',
  YEAR = 'YEAR',
}

@Schema({ ...SchemaDefault, collection: 'dashboard_display_logs' })
export class DashboardDisplayLogsAggregation {
  @Prop({ required: true, type: Date, index: true })
  date: Date;

  @Prop({
    required: true,
    enum: AggregationPeriod,
    uppercase: true,
    index: true,
  })
  period: AggregationPeriod;

  @Prop({
    required: false,
    type: Types.ObjectId,
    ref: 'News',
    index: true,
  })
  news?: Types.ObjectId;

  @Prop({
    required: false,
    type: Types.ObjectId,
    ref: 'CompanyUnit',
    index: true,
  })
  local_unit?: Types.ObjectId;

  @Prop({
    required: false,
    type: Types.ObjectId,
    ref: 'Advertisement',
    index: true,
  })
  advertisement?: Types.ObjectId;

  @Prop({
    required: false,
    type: Types.ObjectId,
    ref: 'Company',
    index: true,
  })
  advertiser?: Types.ObjectId;

  @Prop({ required: true, type: Types.ObjectId, index: true })
  entity_id: Types.ObjectId;

  @Prop({ required: true, type: Number })
  displays: number;

  @Prop({ required: true, type: Number })
  total_people: number;

  @Prop({ required: true, type: Number })
  total_men: number;

  @Prop({ required: true, type: Number })
  total_women: number;

  @Prop({ required: true, type: Object })
  age: IAgeStats;
}

export type DashboardDisplayLogsAggregationDocument =
  DashboardDisplayLogsAggregation & Document;

export const DashboardDisplayLogsAggregationSchema =
  SchemaFactory.createForClass(DashboardDisplayLogsAggregation);

// Compound indexes for performance
DashboardDisplayLogsAggregationSchema.index({ date: -1, period: 1 });
DashboardDisplayLogsAggregationSchema.index({ period: 1, date: -1 });
