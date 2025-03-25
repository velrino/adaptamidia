import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';
import { CompanyUnitController } from './company-unit.controller';
import { CreateCompanyUnitService } from './create/create.service';
import { ListCompanyUnitService } from './list/list.service';
import { GroupCompanyUnitService } from './group/group.service';
import { UpdateCompanyUnitService } from './update/update.service';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([
      MongoCollection.company_units,
      MongoCollection.company_units_popular_times,
    ]),
  ],
  controllers: [CompanyUnitController],
  providers: [
    CreateCompanyUnitService,
    ListCompanyUnitService,
    GroupCompanyUnitService,
    UpdateCompanyUnitService,
  ],
})
export class CompanyUnitModule {}
