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
import { Transform, Type } from 'class-transformer';
import { AdvertisementType } from '../advertisement.interface';

export class CreateAdvertisementDto {
  @IsNotEmpty()
  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  plan: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsString()
  source_landscape: string;

  @IsNotEmpty()
  @IsString()
  source_portrait: string;

  @IsOptional()
  @IsMongoId()
  company: string;

  @IsString()
  title: string;

  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  seconds: number;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  start_date: Date;

  @IsNotEmpty()
  @IsDate()
  @Type(() => Date)
  @Transform(({ value }) => new Date(value))
  end_date: Date;

  @IsOptional()
  @IsArray()
  @IsMongoId({ each: true })
  @Type(() => String)
  units: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  neighborhood: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  segments: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Type(() => String)
  audience: string[];
}
