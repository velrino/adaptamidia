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
import {
  CompanyUnit,
  CompanyUnitDocument,
} from 'src/modules/company-unit/company-unit.schema';
import { Company } from 'src/modules/company/company.schema';
import { ActionType } from 'src/shared/interfaces/paginate.dto';
// import { DateTime } from 'luxon';

@Injectable()
export class CreateAdvertisementService extends AdvertisementService {
  constructor(
    @InjectModel(Advertisement.name)
    readonly model: Model<AdvertisementDocument>,
    @InjectModel(Company.name) public readonly companyModel: Model<Company>,
    @InjectModel(CompanyUnit.name)
    private readonly companyUnitModel: Model<CompanyUnitDocument>,
  ) {
    super(model);
  }

  executeFromRequest(
    currentRequest: AuthenticatedRequest,
    actionType: ActionType,
    parameters: CreateAdvertisementDto,
    id?: string,
  ) {
    VerifyUserCanProceed({
      need_company: parameters.company,
      user_permissions: currentRequest.user.user.permissions,
      user_companies: currentRequest.user.user.companies,
      need_permissions: [],
    });

    if (actionType === ActionType.CREATE) {
      return this.executeCreate(parameters);
    } else if (actionType === ActionType.UPDATE && id) {
      return this.executeUpdate(id, parameters);
    }
  }

  async validate(parameters: CreateAdvertisementDto) {
    if (!parameters.company) {
      throw new HttpException(RESULT.INVALID_COMPANY_ID, HttpStatus.NOT_FOUND);
    }

    if (parameters.company) {
      const countUnits = await this.companyModel.countDocuments({
        _id: parameters.company,
      });

      if (!countUnits) {
        throw new HttpException(
          RESULT.INVALID_COMPANY_ID,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    if (parameters.units) {
      const countUnits = await this.companyUnitModel.countDocuments({
        _id: { $in: parameters.units },
      });

      if (parameters.units.length !== countUnits) {
        throw new HttpException(
          RESULT.INVALID_COMPANY_UNIT_ID,
          HttpStatus.NOT_FOUND,
        );
      }
    }

    // const isAfterTomorrow = (date) => {
    //   const parsedDate =
    //     typeof date === 'string'
    //       ? DateTime.fromISO(date, { zone: 'utc' })
    //       : DateTime.fromJSDate(date);

    //   if (!parsedDate.isValid) {
    //     throw new HttpException(
    //       RESULT.INVALID_DATE_FORMAT,
    //       HttpStatus.BAD_REQUEST,
    //     );
    //   }

    //   const tomorrow = DateTime.now().plus({ days: 1 }).startOf('day');
    //   return parsedDate > tomorrow;
    // };

    // const validateDateRange = (startDate, endDate) => {
    //   if (!isAfterTomorrow(startDate)) {
    //     throw new HttpException(
    //       RESULT.INVALID_START_DATE,
    //       HttpStatus.BAD_REQUEST,
    //     );
    //   }

    //   if (!isAfterTomorrow(endDate)) {
    //     throw new HttpException(
    //       RESULT.INVALID_END_DATE,
    //       HttpStatus.BAD_REQUEST,
    //     );
    //   }
    // };

    // if (parameters.status) {
    //   validateDateRange(parameters.start_date, parameters.end_date);
    // }
  }

  async executeCreate(parameters: CreateAdvertisementDto) {
    try {
      const company = new Types.ObjectId(parameters.company);

      await this.validate(parameters);

      this.allItemsIsSameType(parameters.items);

      const document: any = {
        ...parameters,
        company,
        status: parameters.status || AdvertisementStatus.REVIEW,
      };

      let record = await this.model.create({
        ...document,
        start_date: new Date(parameters.start_date),
        end_date: new Date(parameters.end_date),
      });

      record = await record.populate<{ company: Company }>('company');

      return record;
    } catch (error) {
      throw new HttpException(
        error?.message || RESULT.ADVERTISEMENT_CREATE_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async executeUpdate(id: string, parameters: CreateAdvertisementDto) {
    try {
      const advertisementId = new Types.ObjectId(id);

      const advertisement = await this.model.findOne({ _id: advertisementId });

      if (!advertisement) {
        throw new HttpException(
          RESULT.ADVERTISEMENT_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      const company = new Types.ObjectId(parameters.company);

      await this.validate(parameters);

      this.allItemsIsSameType(parameters.items);

      const documentData: any = {
        ...parameters,
        company,
        status: parameters.status || AdvertisementStatus.REVIEW,
      };

      const record = await this.model
        .findOneAndUpdate(
          { _id: advertisementId },
          {
            ...documentData,
            start_date: new Date(parameters.start_date),
            end_date: new Date(parameters.end_date),
          },
          { new: true },
        )
        .populate<{ company: Company }>({
          path: 'company',
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
