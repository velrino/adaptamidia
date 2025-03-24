import { Global, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';
import { CompanyController } from './company.controller';
import { CreateCompanyService } from './create/create.service';
import { GetCompanyService } from './get/get.service';
import { ListCompanyService } from './list/list.service';
import { UpdateCompanyService } from './update/update.service';

@Global()
@Module({
  imports: [MongooseModule.forFeature([MongoCollection.companies])],
  controllers: [CompanyController],
  providers: [
    CreateCompanyService,
    GetCompanyService,
    ListCompanyService,
    UpdateCompanyService,
  ],
  exports: [GetCompanyService],
})
export class CompanyModule {}
