import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SchemaDefault } from 'src/shared/shema';
import { CompanyUnitStatus, CompanyUnitType } from './company-unit.interface';
import { Company } from '../company/company.schema';
import { CompanyUnitPopularTime } from './popular-times/company-unit-popular-times.schema';

export class CompanyUnitPreferences {
  @Prop({ type: [String], default: [] })
  exclude_news_source_name: string[];

  @Prop({ type: [String], default: [] })
  include_news_source_name: string[];

  @Prop({ required: true })
  min_news_before_ad: number;

  @Prop({ required: true })
  max_news_before_ad: number;

  @Prop({ required: true })
  min_ads_in_sequence: number;

  @Prop({ required: true })
  max_ads_in_sequence: number;

  @Prop({ required: true })
  target_size: number;
}

@Schema({ ...SchemaDefault, collection: 'company_units' })
export class CompanyUnit {
  @Prop({ type: Types.ObjectId, ref: 'Company', required: true, index: true })
  company: Types.ObjectId | Company;

  @Prop({
    type: Types.ObjectId,
    ref: 'CompanyUnitPopularTime',
    required: false,
  })
  popular_time: Types.ObjectId | CompanyUnitPopularTime;

  @Prop({ required: true })
  name: string;

  @Prop({ required: false, default: String() })
  image: string;

  @Prop({ required: true })
  full_address: string;

  @Prop({ required: true })
  neighborhood: string;

  @Prop({ required: true })
  address: string;

  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  state: string;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  street_number: string;

  @Prop({ required: false, default: String() })
  complement: string;

  @Prop({ required: false, default: String(), uppercase: true })
  identifier: string;

  @Prop({ required: true, index: true })
  type: CompanyUnitType;

  @Prop({ required: true, index: true })
  status: CompanyUnitStatus;

  @Prop({
    type: {
      smart_tv: { type: Number, default: 0 },
    },
    required: true,
    _id: false,
  })
  devices: {
    smart_tv: number;
  };

  @Prop({ type: Number, required: true }) // Limite de pessoas permitido no local
  max_capacity: number;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  })
  location: {
    type: string;
    coordinates: [number, number];
  };

  @Prop({ type: CompanyUnitPreferences, required: true, _id: false })
  preferences: CompanyUnitPreferences;
}

export type CompanyUnitDocument = CompanyUnit & Document;

export const CompanyUnitSchema = SchemaFactory.createForClass(CompanyUnit);

CompanyUnitSchema.index({ company: 1, location: '2dsphere' });
