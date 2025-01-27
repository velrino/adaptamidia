import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';
import { CompanyUnitController } from './company-unit.controller';
import { CreateCompanyUnitService } from './create/create.service';

@Global()
@Module({
  imports: [MongooseModule.forFeature([MongoCollection.company_units])],
  controllers: [CompanyUnitController],
  providers: [CreateCompanyUnitService],
})
export class CompanyUnitModule {}
