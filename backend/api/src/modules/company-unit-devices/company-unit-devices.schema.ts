import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document, Types } from 'mongoose';
import { SchemaDefault } from 'src/shared/shema';
import { CompanyUnitDeviceType } from './company-unit.interface';

@Schema({ ...SchemaDefault, collection: 'company_unit_devices' })
export class CompanyUnitDevices {
  @Prop({
    required: false,
    type: Types.ObjectId,
    ref: 'CompanyUnit',
    index: true,
  })
  local_unit: Types.ObjectId;

  @Prop({ required: true, type: String })
  identifier: string;

  @Prop({
    required: false,
    type: String,
    enum: CompanyUnitDeviceType,
    default: CompanyUnitDeviceType.DISPLAYER,
  })
  type: CompanyUnitDeviceType;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: false, default: null })
  data: any;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: false, default: null })
  headers: any;
}

export type CompanyUnitDevicesDocument = CompanyUnitDevices & Document;

export const CompanyUnitDevicesSchema =
  SchemaFactory.createForClass(CompanyUnitDevices);

// Compound indexes for performance
CompanyUnitDevicesSchema.index({ local_unit: 1, identifier: 1 });
