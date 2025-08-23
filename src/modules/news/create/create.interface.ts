import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsUrl,
  IsDateString,
  IsArray,
  ArrayNotEmpty,
  ArrayUnique,
  IsEnum,
} from 'class-validator';
import {
  LanguageEnum,
  NewsKeywordEnum,
  NewsProviderEnum,
} from '../news.interface';
import { Types } from 'mongoose';
import { Transform } from 'class-transformer';

export class CreateNewsDto {
  @IsEnum(NewsProviderEnum)
  @IsNotEmpty()
  provider: NewsProviderEnum;

  @IsEnum(LanguageEnum)
  @IsNotEmpty()
  language: LanguageEnum;

  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value?.toString().toUpperCase().trim())
  keyword: string;

  @IsString()
  @IsOptional()
  source_id: string;

  @IsString()
  @IsNotEmpty()
  source_name: string;

  @IsString()
  @IsNotEmpty()
  author: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsUrl()
  @IsNotEmpty()
  url: string;

  @IsString()
  @IsOptional()
  image: string;

  @IsDateString()
  @IsNotEmpty()
  published_at: string;

  @IsDateString()
  @IsOptional()
  end_at: string;

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  units: string[];

  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  neighborhood: string[];
}

export interface ICreateNewsCommon {
  provider: NewsProviderEnum;
  language: LanguageEnum;
  keyword: string;
  source_id: string;
  source_name: string;
  author: string;
  title: string;
  description: string;
  url: string;
  image: string;
  published_at: string;
  units: string[];
  neighborhood: string[];
  user?: string | Types.ObjectId;
}
