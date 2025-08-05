import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SchemaDefault } from 'src/shared/shema';

@Schema({ ...SchemaDefault, collection: 'leads' })
export class Leads {
  @Prop({ required: true })
  contactType: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  email: string;

  @Prop({ required: true })
  phone: string;

  @Prop({ required: true })
  company: string;

  @Prop({ required: true })
  business: string;

  @Prop({ required: true })
  message: string;
}

export type LeadsDocument = Leads & Document;

export const LeadsSchema = SchemaFactory.createForClass(Leads);
