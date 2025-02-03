import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SchemaDefault } from 'src/shared/shema';
import { AdvertisementStatus } from '../advertisement/advertisement.interface';

@Schema({ ...SchemaDefault, collection: 'advertisements_campaigns' })
export class AdvertisementCampaign {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  company: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'company_units',
    required: true,
    index: true,
  })
  company_unit: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'advertisements',
    required: true,
    index: true,
  })
  advertisement: Types.ObjectId;

  @Prop({
    required: true,
    enum: AdvertisementStatus,
    uppercase: true,
    index: true,
  })
  status: AdvertisementStatus;

  @Prop({ required: true, type: Number })
  watched: number;

  @Prop({ required: true, type: Number })
  order: number;

  @Prop({ required: true, type: Date })
  start_date: Date;

  @Prop({ required: true, type: Date })
  end_date: Date;
}

export type AdvertisementCampaignDocument = AdvertisementCampaign & Document;

export const AdvertisementCampaignSchema = SchemaFactory.createForClass(
  AdvertisementCampaign,
);

AdvertisementCampaignSchema.index({
  company: 1,
  company_unit: 1,
  advertisement: 1,
});
