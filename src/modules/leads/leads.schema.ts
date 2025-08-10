import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { RequestCustomClient } from 'src/shared/request';
import { SchemaDefault } from 'src/shared/shema';

@Schema({ ...SchemaDefault, collection: 'leads' })
export class Leads {
  @Prop({ required: false })
  contactType?: string;

  @Prop({ required: false })
  name?: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: false })
  phone?: string;

  @Prop({ required: false })
  company?: string;

  @Prop({ required: false })
  business?: string;

  @Prop({ required: false })
  message?: string;

  @Prop({ type: mongoose.Schema.Types.Mixed, required: false, default: null })
  request?: RequestCustomClient;
}

export type LeadsDocument = Leads & Document;

export const LeadsSchema = SchemaFactory.createForClass(Leads);
