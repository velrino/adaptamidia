import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SchemaDefault } from 'src/shared/shema';
import { IGoogleStorageBucket } from 'src/shared/google/cloud/google-cloud-storage.interface';

@Schema({ ...SchemaDefault, collection: 'files' })
export class Files {
  @Prop({
    type: Types.ObjectId,
    ref: 'Company',
    index: true,
    default: null,
  })
  company: Types.ObjectId | null;

  @Prop({ required: true })
  bucket: IGoogleStorageBucket;

  @Prop({ required: true })
  path: string;

  @Prop({ required: true })
  file_name: string;

  @Prop({ required: true })
  public_url: string;
}

export type FilesDocument = Files & Document;

export const FilesSchema = SchemaFactory.createForClass(Files);
