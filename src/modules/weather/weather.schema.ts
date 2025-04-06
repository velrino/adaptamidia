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

  @Prop({ required: true })
  region: string;

  @Prop({ required: true })
  country: string;

  @Prop({ required: true })
  temperature: number;

  @Prop({ required: true, index: true })
  provider: IWeatherProvider[];

  @Prop({ required: true, type: Date, index: true })
  last_provided_at: Date;

  @Prop({
    type: {
      type: String,
      enum: ['Point'],
      required: true,
    },
    coordinates: {
      type: [Number],
      required: true,
    },
  })
  location: {
    type: string;
    coordinates: [number, number];
  };
}

export type WeatherDocument = Weather & Document;

export const WeatherSchema = SchemaFactory.createForClass(Weather);
