import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoCollection } from 'src/shared/mongo.schema';
import { CompanyUnitDevicesController } from './company-unit-devices.controller';
import { LinkDeviceWithCompanyUnitService } from './link/link.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      MongoCollection.company_unit_devices,
      MongoCollection.company_units,
    ]),
  ],
  controllers: [CompanyUnitDevicesController],
  providers: [LinkDeviceWithCompanyUnitService],
})
export class CompanyUnitDevicesModule {}
