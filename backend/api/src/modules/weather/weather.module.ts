import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';
import { GetWeatherService } from './get/get.service';

@Global()
@Module({
  imports: [MongooseModule.forFeature([MongoCollection.weather])],
  controllers: [],
  providers: [GetWeatherService],
  exports: [GetWeatherService],
})
export class WeatherModule {}
