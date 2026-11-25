import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';
import { GetCurrencyService } from './get/get.service';

@Module({
  imports: [MongooseModule.forFeature([MongoCollection.currency])],
  controllers: [],
  providers: [GetCurrencyService],
  exports: [GetCurrencyService],
})
export class CurrencyModule {}
