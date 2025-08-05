import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LeadsController } from './leads.controller';
import { LeadsService } from './leads.service';
import { Leads, LeadsSchema } from './leads.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Leads.name, schema: LeadsSchema }]),
  ],
  controllers: [LeadsController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}