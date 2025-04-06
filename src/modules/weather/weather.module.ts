import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';

@Global()
@Module({
  imports: [MongooseModule.forFeature([MongoCollection.weather])],
  controllers: [],
  providers: [],
})
export class WeatherModule {}
