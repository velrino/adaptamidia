import {
  IsArray,
  IsDate,
  IsEnum,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AdvertisementType } from '../advertisement.interface';

export class CreateAdvertisementItemDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  seconds: number;

  @IsNotEmpty()
  @IsString()
  source: string;

  @IsNotEmpty()
  @IsEnum(AdvertisementType)
  type: AdvertisementType;
}

export class CreateAdvertisementDto {
  @IsOptional()
  @IsMongoId()
  company: string;

  @IsNotEmpty()
  @IsString()
  title: string;

  @IsArray()
  @IsNotEmpty()
  @ValidateNested({ each: true })
  @Type(() => CreateAdvertisementItemDto)
  items: CreateAdvertisementItemDto[];

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  start_date: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  end_date: Date;
}
