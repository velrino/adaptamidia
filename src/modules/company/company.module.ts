import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';
import { CompanyController } from './company.controller';
import { CreateCompanyService } from './create/create.service';

@Module({
  imports: [MongooseModule.forFeature([MongoCollection.companies])],
  controllers: [CompanyController],
  providers: [CreateCompanyService],
})
export class CompanyModule {}
