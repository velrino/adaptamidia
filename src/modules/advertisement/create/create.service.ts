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
    console.log({ parameters });
    return this.execute(parameters);
  }

  execute(parameters: any) {
    // await this.model.create({
    //   company: currentRequest.user.company,
    //   ...parameters,
    // })
    return parameters;
  }
}
