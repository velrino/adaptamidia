import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Leads, LeadsDocument } from './leads.schema';
import { CreateLeadValidator } from './leads.interface';

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Leads.name) private readonly leadsModel: Model<LeadsDocument>,
  ) {}

  async create(data: CreateLeadValidator): Promise<LeadsDocument> {
    try {
      const lead = new this.leadsModel(data);
      return lead.save();
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }
}
