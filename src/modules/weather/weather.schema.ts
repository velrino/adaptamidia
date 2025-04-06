import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { SchemaDefault } from 'src/shared/shema';
import { IWeatherProvider } from './weather.interface';

@Schema({ ...SchemaDefault, collection: 'weather' })
export class Weather {
  @Prop({ required: false, default: String() })
  text: string;

  @Prop({ required: false, default: String() })
  icon: string;

  @Prop({ required: false, default: String() })
  timezone: string;

  @Prop({ required: true })
  region: string;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  temperature_c: number;

  @Prop({ required: true })
  temperature_f: number;

  @Prop({ required: true, index: true })
  provider: IWeatherProvider;

  @Prop({ required: true, type: Date, index: true })
  last_provided_at: Date;

  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;
}

export type WeatherDocument = Weather & Document;

export const WeatherSchema = SchemaFactory.createForClass(Weather);
