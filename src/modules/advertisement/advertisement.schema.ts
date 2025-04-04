import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SchemaDefault } from 'src/shared/shema';
import {
  AdvertisementMetricsItemDefault,
  AdvertisementStatus,
  AdvertisementType,
} from './advertisement.interface';
import { Company } from '../company/company.schema';

export class AdvertisementItem {
  @Prop({ type: String, required: false, default: String() })
  title: string;

  @Prop({ type: String, required: false, default: String() })
  description: string;

  @Prop({ type: Number, required: false, default: 0 })
  seconds: number;

  @Prop({ type: String, required: true })
  source: string;

  @Prop({ required: true, enum: AdvertisementType, uppercase: true })
  type: AdvertisementType;
}

export class AdvertisementMetricsItem {
  @Prop({ type: Number, required: false, default: 0 })
  impressions: number; // Quantas vezes foi exibido

  @Prop({ type: Number, required: false, default: 0 })
  watched: number; // Quantas vezes foi assistido

  @Prop({ type: Number, required: false, default: 0 })
  skips: number; // Quantos pularam o anúncio

  @Prop({ type: Number, required: false, default: 0 })
  errors: number; // Falhas de reprodução, por exemplo

  @Prop({ type: Date, default: () => new Date() })
  last_updated: Date; // Quando as métricas foram atualizadas
}

@Schema({ ...SchemaDefault, collection: 'advertisements' })
export class Advertisement {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Company',
    index: true,
  })
  company: Types.ObjectId | Company;

  @Prop({ type: String, required: false, default: String() })
  title: string;

  @Prop({ type: String, required: false, default: String() })
  description: string;

  @Prop({ required: true, enum: AdvertisementType, uppercase: true })
  type: AdvertisementType;

  @Prop({ required: true, type: [AdvertisementItem] })
  items: AdvertisementItem[];

  @Prop({
    required: true,
    type: AdvertisementMetricsItem,
    default: AdvertisementMetricsItemDefault,
  })
  metrics: AdvertisementMetricsItem;

  @Prop({ required: true, type: Number })
  seconds: number;

  @Prop({
    required: true,
    enum: AdvertisementStatus,
    uppercase: true,
    index: true,
  })
  status: AdvertisementStatus;

  @Prop({ required: true, type: Date })
  start_date: Date;

  @Prop({ required: true, type: Date })
  end_date: Date;

  @Prop({
    required: false,
    type: [Types.ObjectId],
    ref: 'CompanyUnit',
    index: true,
    default: [],
    set: (arr: Types.ObjectId[]) =>
      Array.from(new Set(arr.map((id) => id.toString()))).map(
        (id) => new Types.ObjectId(id),
      ),
  })
  units: Types.ObjectId[];

  @Prop({
    required: false,
    type: [String],
    default: [],
    set: (arr: string[]) => Array.from(new Set(arr)),
  })
  neighborhood: string[];

  @Prop({
    required: false,
    type: [String],
    default: [],
    set: (arr: string[]) => Array.from(new Set(arr)),
  })
  audience: string[];

  @Prop({
    required: false,
    type: [String],
    default: [],
    set: (arr: string[]) => Array.from(new Set(arr)),
  })
  segments: string[];
}

export type AdvertisementDocument = Advertisement & Document;

export const AdvertisementSchema = SchemaFactory.createForClass(Advertisement);
