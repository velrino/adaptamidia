import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Advertisement, AdvertisementDocument } from '../advertisement.schema';
import { Model, Types } from 'mongoose';
import { AuthenticatedRequest } from 'src/shared/request';
import { AdvertisementService } from '../advertisement.service';
import { AdvertisementStatus } from '../advertisement.interface';
import { CreateAdvertisementDto } from './create.interface';
import { VerifyUserCanProceed } from 'src/modules/permissions/permissions.helper';
import { RESULT } from 'src/shared/result.enum';

@Injectable()
export class CreateAdvertisementService extends AdvertisementService {
  constructor(
    @InjectModel(Advertisement.name)
    readonly model: Model<AdvertisementDocument>,
  ) {
    super(model);
  }

  executeFromRequest(
    currentRequest: AuthenticatedRequest,
    parameters: CreateAdvertisementDto,
  ) {
    VerifyUserCanProceed({
      need_company: parameters.company,
      user_permissions: currentRequest.user.user.permissions,
      user_companies: currentRequest.user.user.companies,
      need_permissions: [],
    });

    return this.execute(parameters);
  }

  async execute(parameters: CreateAdvertisementDto) {
    try {
      const company = new Types.ObjectId(parameters.company);

      this.allItemsIsSameType(parameters.items);

      // const seconds = this.calculateTotalSeconds(parameters.items);

      const document: any = {
        ...parameters,
        company,
        status: AdvertisementStatus.REVIEW,
      };

      const record = await this.model.create({
        ...document,
        start_date: new Date(parameters.start_date),
        end_date: new Date(parameters.end_date),
      });

      return record;
    } catch (error) {
      throw new HttpException(
        error?.message || RESULT.ADVERTISEMENT_CREATE_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
