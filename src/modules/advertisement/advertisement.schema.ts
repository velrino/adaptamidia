import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Model, Query, Types } from 'mongoose';
import { SchemaDefault } from 'src/shared/shema';
import {
  AdvertisementStatus,
  AdvertisementType,
} from './advertisement.interface';

export class AdvertisementItem {
  @Prop({ type: String, required: true })
  title: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Number, required: true })
  seconds: number;

  @Prop({ type: String, required: true })
  source: string;

  @Prop({ required: true, enum: AdvertisementType, uppercase: true })
  type: AdvertisementType;
}

@Schema({ ...SchemaDefault, collection: 'advertisements' })
export class Advertisement {
  @Prop({
    required: true,
    type: Types.ObjectId,
    ref: 'Company',
    index: true,
  })
  company: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, enum: AdvertisementType, uppercase: true })
  type: AdvertisementType;

  @Prop({ required: true, type: [AdvertisementItem] })
  items: AdvertisementItem[];

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
}

export type AdvertisementDocument = Advertisement & Document;

export const AdvertisementSchema = SchemaFactory.createForClass(Advertisement);

AdvertisementSchema.index({ company: 1 });
