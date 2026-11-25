import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SchemaDefault } from 'src/shared/shema';

export class CompanyUnitPopularTimeDataItem {
  @Prop({ required: true })
  hour: string;

  @Prop({ required: true })
  count: number;
}

export class CompanyUnitPopularTimeData {
  MONDAY: CompanyUnitPopularTimeDataItem[];
  TUESDAY: CompanyUnitPopularTimeDataItem[];
  WEDNESDAY: CompanyUnitPopularTimeDataItem[];
  THURSDAY: CompanyUnitPopularTimeDataItem[];
  FRIDAY: CompanyUnitPopularTimeDataItem[];
  SATURDAY: CompanyUnitPopularTimeDataItem[];
  SUNDAY: CompanyUnitPopularTimeDataItem[];
}

@Schema({ ...SchemaDefault, collection: 'company_units_popular_times' })
export class CompanyUnitPopularTime {
  @Prop({
    type: Types.ObjectId,
    ref: 'CompanyUnit',
    required: true,
    index: true,
  })
  company_unit: Types.ObjectId;

  @Prop({ type: CompanyUnitPopularTimeData, required: true, _id: false })
  days: CompanyUnitPopularTimeData;
}

export type CompanyUnitPopularTimeDocument = CompanyUnitPopularTime & Document;

export const CompanyUnitPopularTimeSchema = SchemaFactory.createForClass(
  CompanyUnitPopularTime,
);
