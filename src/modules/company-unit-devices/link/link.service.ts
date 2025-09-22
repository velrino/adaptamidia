import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import {
  CompanyUnitDevices,
  CompanyUnitDevicesDocument,
} from '../company-unit-devices.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  CompanyUnit,
  CompanyUnitDocument,
} from 'src/modules/company-unit/company-unit.schema';
import { CustomRequest } from 'src/shared/request';
import {
  ILinkDeviceWithCompanyUnitService,
  LinkDeviceWithCompanyUnitDto,
} from './link.interface';
import { RESULT } from 'src/shared/result.enum';

@Injectable()
export class LinkDeviceWithCompanyUnitService {
  constructor(
    @InjectModel(CompanyUnit.name)
    private readonly companyUnitModel: Model<CompanyUnitDocument>,
    @InjectModel(CompanyUnitDevices.name)
    private readonly companyUnitDevicesModel: Model<CompanyUnitDevicesDocument>,
  ) {}

  async executeFromRequest(
    currentRequest: CustomRequest,
    body: LinkDeviceWithCompanyUnitDto,
  ) {
    try {
      return await this.execute({
        ...body,
        headers: currentRequest.custom_client,
      });
    } catch (error) {
      throw new HttpException(
        error?.message || RESULT.COMPANY_UNIT_DEVICE_CREATE_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async execute(parameters: ILinkDeviceWithCompanyUnitService) {
    try {
      const record = await this.companyUnitModel
        .findOne({
          identifier: parameters.company_unit_identifier,
        })
        .select(['_id', 'identifier'])
        .lean();

      if (!record) {
        throw new HttpException(
          RESULT.COMPANY_UNIT_DEVICE_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      return await this.companyUnitDevicesModel.findOneAndUpdate(
        {
          local_unit: record._id,
          identifier: parameters.identifier,
        },
        {
          local_unit: record._id,
          identifier: parameters.identifier,
          data: parameters?.data || {},
          headers: parameters?.headers || {},
        },
        {
          upsert: true,
          new: true,
        },
      );
    } catch (error) {
      throw new HttpException(
        error?.message || RESULT.COMPANY_UNIT_DEVICE_CREATE_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
