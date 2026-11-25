import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SchemaDefault } from 'src/shared/shema';
import { ICurrencyName, ICurrencyProvider } from './currency.interface';

@Schema({ ...SchemaDefault, collection: 'currency' })
export class Currency {
  @Prop({ required: true })
  name: ICurrencyName;

  @Prop({ required: true, default: 0 })
  bid: number;

  @Prop({ required: true, default: 0 })
  high: number;

  @Prop({ required: true, default: 0 })
  low: number;

  @Prop({ required: true, default: 0 })
  pctChange: number;

  @Prop({ required: true, index: true })
  provider: ICurrencyProvider;

  @Prop({ required: true, type: Date, index: true })
  last_provided_at: Date;
}

export type CurrencyDocument = Currency & Document;

export const CurrencySchema = SchemaFactory.createForClass(Currency);
