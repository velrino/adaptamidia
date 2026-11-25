import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';
import { WeatherModule } from '../weather/weather.module';
import { DisplayController } from './display.controller';
import { DisplayByUnitService } from './unit/unit.service';
import { DisplayService } from './display.service';
import { DisplayUnitInfoService } from './info/info.service';
import { CurrencyModule } from '../currency/currency.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      MongoCollection.advertisement,
      MongoCollection.companies,
      MongoCollection.company_units,
      MongoCollection.news,
    ]),
    CurrencyModule,
    WeatherModule,
  ],
  controllers: [DisplayController],
  providers: [DisplayService, DisplayByUnitService, DisplayUnitInfoService],
})
export class DisplayModule {}
