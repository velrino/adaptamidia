import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SchemaDefault } from 'src/shared/shema';
import { CompanyDocumentType, CompanyType } from './company.interface';
import { CompanyUnitStatus } from '../company-unit/company-unit.interface';

@Schema({ ...SchemaDefault, collection: 'companies' })
export class Company {
  @Prop({ required: true, index: true })
  document: string;

  @Prop({ required: true, enum: CompanyDocumentType })
  document_type: CompanyDocumentType;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, enum: CompanyType })
  type: CompanyType;

  @Prop({
    required: true,
    enum: CompanyUnitStatus,
    default: CompanyUnitStatus.IN_REVIEW,
  })
  status: CompanyUnitStatus;

  @Prop({
    required: false,
    type: [Types.ObjectId],
    ref: 'Company',
    index: true,
    default: [],
    set: (arr: Types.ObjectId[]) =>
      Array.from(new Set(arr.map((id) => id.toString()))).map(
        (id) => new Types.ObjectId(id),
      ),
  })
  visible_companies: Types.ObjectId[];
}

export type CompanyDocument = Company & Document;

export const CompanySchema = SchemaFactory.createForClass(Company);

CompanySchema.index({ document: 1, name: 1 });
