import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { SchemaDefault } from 'src/shared/shema';
import {
  LanguageEnum,
  NewsKeywordEnum,
  NewsProviderEnum,
  NewsStatusEnum,
} from './news.interface';
import { User } from '../user/user.schema';

@Schema({
  collection: 'news',
  ...SchemaDefault,
})
export class News extends Document {
  @Prop({ required: true, enum: NewsProviderEnum, uppercase: true })
  provider: NewsProviderEnum;

  @Prop({ type: Types.ObjectId, ref: 'User', required: false, index: true })
  user: Types.ObjectId | User;

  @Prop({
    required: true,
    enum: NewsStatusEnum,
    uppercase: true,
    default: NewsStatusEnum.ACTIVE,
  })
  status: NewsStatusEnum;

  @Prop({ required: true, enum: LanguageEnum, uppercase: true })
  language: LanguageEnum;

  @Prop({ required: true, enum: NewsKeywordEnum, uppercase: true })
  keyword: NewsKeywordEnum;

  @Prop({ required: false })
  source_id: string;

  @Prop({ required: true })
  source_name: string;

  @Prop({ required: true })
  author: string;

  @Prop({ required: true })
  title: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  url: string;

  @Prop()
  image: string;

  @Prop({ required: true, type: Date })
  published_at: Date;

  @Prop({ required: false, type: Date })
  end_at: Date;

  @Prop()
  content: string;
}

export type NewsDocument = News & Document;

export const NewsSchema = SchemaFactory.createForClass(News);
