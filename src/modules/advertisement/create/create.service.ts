import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Advertisement, AdvertisementDocument } from '../advertisement.schema';
import { Model } from 'mongoose';
import { AuthenticatedRequest } from 'src/shared/request';

@Injectable()
export class CreateAdvertisementService {
  constructor(
    @InjectModel(Advertisement.name)
    private readonly model: Model<AdvertisementDocument>,
  ) {}

  executeFromRequest(currentRequest: AuthenticatedRequest, parameters: any) {
    return this.execute(parameters);
  }

  execute(parameters: any) {
    return parameters;
  }
}
