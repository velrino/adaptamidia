import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { SchemaDefault } from 'src/shared/shema';
import { Company } from '../company/company.schema';
import { CompanyUnit } from '../company-unit/company-unit.schema';
import { DisplayLogStatus } from './display-logs.interface';
import { News } from '../news/news.schema';
import { Advertisement } from '../advertisement/advertisement.schema';
import { DisplayType } from '../display/unit/unit.interface';
import {
  IApiYoloResult,
  IApiDeepFaceAnalysisResult,
  IApiDetectInsightface,
} from 'src/shared/detection/detection.interface';

@Schema({ ...SchemaDefault, collection: 'display_logs' })
export class DisplayLog {
  @Prop({
    required: false,
    type: Types.ObjectId,
    ref: 'Advertisement',
    index: true,
  })
  advertisement?: Types.ObjectId | Advertisement;

  @Prop({
    required: false,
    type: Types.ObjectId,
    ref: 'News',
    index: true,
  })
  news?: Types.ObjectId | News;

  @Prop({
    required: false,
    type: Types.ObjectId,
    ref: 'Company',
    index: true,
  })
  advertiser?: Types.ObjectId | News;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Company',
    index: true,
  })
  local: Types.ObjectId | Company;

  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'CompanyUnit',
    index: true,
  })
  local_unit: Types.ObjectId | CompanyUnit;

  @Prop({ required: true, type: Number, default: 0 })
  seconds: number;

  @Prop({ required: true, type: Date, index: true })
  start_at: Date;

  @Prop({ required: false, type: Date })
  end_at: Date;

  @Prop({ type: String, required: false, default: String() })
  identifier: string;

  @Prop({ type: String, required: false, default: String() })
  ip: string;

  @Prop({ type: String, required: false, default: String() })
  user_agent: string;

  @Prop({ required: true, type: mongoose.Schema.Types.Mixed })
  data: any;

  @Prop({
    required: true,
    enum: DisplayType,
    uppercase: true,
    index: true,
  })
  type: DisplayType;

  @Prop({
    required: true,
    enum: DisplayLogStatus,
    uppercase: true,
    index: true,
  })
  status: DisplayLogStatus;

  @Prop({ type: String, required: false, default: null })
  capture: string;

  @Prop({ type: String, required: false, default: null })
  capture_bbox: string;

  @Prop({ type: String, required: false, default: null })
  bucket: string;

  @Prop({ type: String, required: false, default: null })
  orientation: string | null;

  @Prop({ type: String, required: false, default: null })
  device: string | null;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: false, default: null })
  yolo: IApiYoloResult;

  // @Prop({ type: mongoose.Schema.Types.Mixed, required: false, default: null })
  // deepface: IApiDeepFaceAnalysisResult;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: false, default: null })
  insightface: IApiDetectInsightface;

  @Prop({ type: String, required: false, default: null })
  llm_insight: string;

  @Prop({ type: String, required: false, default: null })
  llm_insight_model: string;

  @Prop({ required: false, type: Date })
  llm_insight_at: Date;

  @Prop({ type: Date, required: false, default: null })
  processing_lock: Date;

  @Prop({ type: Number, required: false, default: null })
  processing_instance: number;

  // Marker used by the dashboard aggregation job to avoid
  // re-aggregating the same DisplayLog more than once.
  // - null: not aggregated yet
  // - Date: when this log was aggregated into dashboard buckets
  // This field is optional and defaults to null so it doesn't
  // affect old or new records that don't rely on the dashboard
  // process. It is safe and backwards compatible.
  @Prop({ type: Date, required: false, default: null, index: true })
  dashboard_aggregated_at: Date | null;
}

export type DisplayLogDocument = DisplayLog & Document;

export const DisplayLogSchema = SchemaFactory.createForClass(DisplayLog);

// Compound indexes for better query performance
DisplayLogSchema.index({ local_unit: 1, created_at: -1 });
DisplayLogSchema.index({ type: 1, status: 1, created_at: -1 });
DisplayLogSchema.index({ news: 1, created_at: -1 });
DisplayLogSchema.index({ advertisement: 1, created_at: -1 });
DisplayLogSchema.index({ start_at: 1, end_at: 1 });

// Partial index to efficiently fetch only not-yet-aggregated logs by time
// This helps the dashboard process select the minimal working set.
DisplayLogSchema.index(
  { dashboard_aggregated_at: 1, start_at: 1 },
  { partialFilterExpression: { dashboard_aggregated_at: null } },
);

// Text search index for full-text search
DisplayLogSchema.index(
  {
    identifier: 'text',
    ip: 'text',
    user_agent: 'text',
  },
  {
    name: 'search_text_index',
    weights: {
      identifier: 10,
      ip: 5,
      user_agent: 1,
    },
  },
);
