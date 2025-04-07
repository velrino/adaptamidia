import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';
import { WeatherModule } from '../weather/weather.module';
import { DisplayController } from './display.controller';
import { DisplayByUnitService } from './unit/display.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      MongoCollection.advertisement,
      MongoCollection.companies,
      MongoCollection.company_units,
      MongoCollection.news,
    ]),
    WeatherModule,
  ],
  controllers: [DisplayController],
  providers: [DisplayByUnitService],
})
export class DisplayModule {}
