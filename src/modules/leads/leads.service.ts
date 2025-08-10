import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Leads, LeadsDocument } from './leads.schema';
import { CreateLeadValidator } from './leads.interface';
import { CustomRequest, RequestCustomClient } from 'src/shared/request';

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Leads.name) private readonly leadsModel: Model<LeadsDocument>,
  ) {}

  async execute(request: CustomRequest, parameters: CreateLeadValidator) {
    try {
      const lead = new this.leadsModel({
        ...parameters,
        request: request.custom_client || null,
      });
      const created = await lead.save();

      return {
        id: created._id,
      };
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }
}
