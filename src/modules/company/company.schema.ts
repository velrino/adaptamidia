import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SchemaDefault } from 'src/shared/shema';

@Schema({ ...SchemaDefault, collection: 'companies' })
export class Company {
  @Prop({ required: true, index: true })
  document: string;

  @Prop({ required: true })
  name: string;
}

export type CompanyDocument = Company & Document;

export const CompanySchema = SchemaFactory.createForClass(Company);

CompanySchema.index({ document: 1, name: 1 });
