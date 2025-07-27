import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { SchemaDefault } from 'src/shared/shema';
import { Company } from '../company/company.schema';
import { CompanyUnit } from '../company-unit/company-unit.schema';
import { DisplayLogStatus } from './display-logs.interface';
import { News } from '../news/news.schema';
import { Advertisement } from '../advertisement/advertisement.schema';
import { DisplayType } from '../display/unit/unit.interface';
import { IApiYoloResult, IApiDeepFaceAnalysisResult } from 'src/shared/detection/detection.interface';

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

  @Prop({ type: mongoose.Schema.Types.Mixed, required: false, default: null })
  yolo: IApiYoloResult;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: false, default: null })
  deepface: IApiDeepFaceAnalysisResult;
}

export type DisplayLogDocument = DisplayLog & Document;

export const DisplayLogSchema = SchemaFactory.createForClass(DisplayLog);
