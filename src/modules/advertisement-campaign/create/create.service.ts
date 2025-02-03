import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  AdvertisementCampaign,
  AdvertisementCampaignDocument,
} from '../advertisement-campaign.schema';
import { Model } from 'mongoose';
import { AuthenticatedRequest } from 'src/shared/request';
import { VerifyUserCanProceed } from 'src/modules/permissions/permissions.helper';

@Injectable()
export class CreateAdvertisementCampaignService {
  constructor(
    @InjectModel(AdvertisementCampaign.name)
    readonly model: Model<AdvertisementCampaignDocument>,
  ) {}

  executeFromRequest(currentRequest: AuthenticatedRequest, parameters: any) {
    VerifyUserCanProceed({
      need_company: parameters.company,
      user_permissions: currentRequest.user.user.permissions,
      user_companies: currentRequest.user.user.companies,
      need_permissions: [],
    });

    return this.execute(parameters);
  }

  execute(parameters: any) {
    return parameters;
  }
}
