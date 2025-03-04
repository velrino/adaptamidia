import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SchemaDefault } from 'src/shared/shema';
import {
  LanguageEnum,
  NewsKeywordEnum,
  NewsProviderEnum,
} from './news.interface';

@Schema({
  collection: 'news',
  ...SchemaDefault,
})
export class News extends Document {
  @Prop({ required: true, enum: NewsProviderEnum, uppercase: true })
  provider: NewsProviderEnum;

  @Prop({ required: true, enum: LanguageEnum, uppercase: true })
  language: LanguageEnum;

  @Prop({ required: true, enum: NewsKeywordEnum, uppercase: true })
  keyword: NewsKeywordEnum;

  // @Prop({ required: true, type: [mongoose.Schema.Types.Mixed] })
  // data: INewsApiArticle[];

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

  @Prop()
  content: string;

  // @Prop({ required: true, type: String })
  // external_id: string;

  // @Prop({ required: true, type: Date })
  // published_at: Date;
}

export type NewsDocument = News & Document;

export const NewsSchema = SchemaFactory.createForClass(News);
