import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SchemaDefault } from 'src/shared/shema';

@Schema({ ...SchemaDefault, collection: 'advertisements_metrics' })
export class AdvertisementMetrics {
  @Prop({
    type: Types.ObjectId,
    ref: 'advertisements',
    required: true,
    index: true,
  })
  advertisement: Types.ObjectId;

  @Prop({ required: true, type: Number })
  watched: number;
}

export type AdvertisementMetricsDocument = AdvertisementMetrics & Document;

export const AdvertisementMetricsSchema =
  SchemaFactory.createForClass(AdvertisementMetrics);
