import { IsMongoId, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { Types } from 'mongoose';
import { PaginateDto } from 'src/shared/interfaces/paginate.dto';
import { NewsDocument } from 'src/modules/news/news.schema';
import { Transform } from 'class-transformer';
import { AdvertisementStatus } from 'src/modules/advertisement/advertisement.interface';
import { Advertisement } from 'src/modules/advertisement/advertisement.schema';

export class DisplayAdvertisementPaginateDto extends PaginateDto {
  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  min_news_before_ad: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  max_news_before_ad: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  min_ads_in_sequence: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  max_ads_in_sequence: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  target_size: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => Number(value))
  news_limit: number;
}

export class IDisplayAdvertisementPaginateDto extends DisplayAdvertisementPaginateDto {
  @IsNotEmpty()
  @IsMongoId({ message: 'INVALID_ID_FORMAT' })
  id: string;
}

export interface IDisplayAdvertisementUnit {
  _id: Types.ObjectId;
  name: string;
  city: string;
  state: string;
  country: string;
  status: AdvertisementStatus;
  company: {
    _id: Types.ObjectId;
    name: string;
    status: AdvertisementStatus;
  } | null;
  location: { type: 'Point'; coordinates: [number, number] };
  //TODO
  preferences: {
    exclude_source_name: string[];
    include_source_name: string[];
    min_news_before_ad: number;
    max_news_before_ad: number;
    min_ads_in_sequence: number;
    max_ads_in_sequence: number;
    target_size: number;
  };
}

export interface IDisplayAdvertisementNewsQuery {
  exclude_source_name: string[];
  include_source_name: string[];
  limit: number;
  cache: boolean;
}

export enum DisplayType {
  ADVERTISEMENT = 'ADVERTISEMENT',
  NEWS = 'NEWS',
}

export interface IDisplayItem {
  type: DisplayType;
  news?: NewsDocument;
  ads?: Advertisement;
}
