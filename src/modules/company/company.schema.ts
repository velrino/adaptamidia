import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SchemaDefault } from 'src/shared/shema';
import { CompanyType } from './company.interface';

@Schema({ ...SchemaDefault, collection: 'companies' })
export class Company {
  @Prop({ required: true, index: true })
  document: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: CompanyType })
  type: CompanyType;
}

export type CompanyDocument = Company & Document;

export const CompanySchema = SchemaFactory.createForClass(Company);

CompanySchema.index({ document: 1, name: 1 });
