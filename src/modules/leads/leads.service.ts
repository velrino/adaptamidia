import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Leads, LeadsDocument } from './leads.schema';
import { CreateLeadValidator } from './leads.interface';
import { CustomRequest, RequestCustomClient } from 'src/shared/request';
import { RedisService } from 'src/shared/redis/redis.service';
import { RedisKeysEnum } from 'src/shared/redis/redis.keys';
import { Milliseconds } from 'src/shared/general';

@Injectable()
export class LeadsService {
  constructor(
    @InjectModel(Leads.name) private readonly leadsModel: Model<LeadsDocument>,
    private readonly redisService: RedisService,
  ) {}

  async execute(request: CustomRequest, parameters: any) {
    try {
      const ip = request.custom_client.ip;

      const lead = new this.leadsModel({
        ...parameters,
        ip,
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

  async sync(request: CustomRequest) {
    try {
      const ip = request.custom_client.ip;

      const cacheKey = `${RedisKeysEnum.LEAD_IP}_${ip}`;

      if (cacheKey) {
        const dataCached = await this.redisService.get(cacheKey);

        if (dataCached) {
          return dataCached;
        }
      }

      const lead = await this.leadsModel.findOneAndUpdate(
        { ip },
        {
          $setOnInsert: {
            ip,
            request: request.custom_client || null,
          },
        },
        {
          upsert: true,
          new: true,
          projection: { _id: 1 },
        },
      );

      const result = {
        id: lead._id,
      };

      await this.redisService.set(
        cacheKey,
        result,
        Milliseconds({ minutes: 10 }),
      );

      return result;
    } catch (error) {
      console.error('Error creating lead:', error);
      throw error;
    }
  }
}
