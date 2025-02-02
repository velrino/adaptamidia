import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';
import { CompanyUnitController } from './company-unit.controller';
import { CreateCompanyUnitService } from './create/create.service';
import { ListCompanyUnitService } from './list/list.service';

@Global()
@Module({
  imports: [MongooseModule.forFeature([MongoCollection.company_units])],
  controllers: [CompanyUnitController],
  providers: [CreateCompanyUnitService, ListCompanyUnitService],
})
export class CompanyUnitModule {}
