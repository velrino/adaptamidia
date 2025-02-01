import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CompanyUnit, CompanyUnitDocument } from '../company-unit.schema';
import { GoogleMapsService } from 'src/shared/google/google-maps.service';
import { AuthenticatedRequest } from 'src/shared/request';
import { GetCompanyService } from 'src/modules/company/get/get.service';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { RESULT } from 'src/shared/result.enum';
import { CompanyUnitStatus } from '../company-unit.interface';

@Injectable()
export class ListCompanyUnitService {
  constructor(
    @InjectModel(CompanyUnit.name)
    private readonly companyUnitModel: Model<CompanyUnitDocument>,
    private readonly getCompanyService: GetCompanyService,
  ) {}

  executeFromRequest(currentRequest: AuthenticatedRequest, parameters: any) {
    try {
      //   VerifyUserCanProced({
      //     need_company: parameters.company_id,
      //     user_permissions: currentRequest.user.user.permissions,
      //     user_companies: currentRequest.user.user.companies,
      //     need_permissions: [],
      //   });

      return this.execute(parameters);
    } catch (error) {
      throw new HttpException(
        error?.message || RESULT.COMPANY_UNIT_NOT_CREATED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async execute(parameters: any) {
    try {
      const companyId = new Types.ObjectId(parameters.company_id);

      const record = await this.getCompanyService.execute({
        filter: { _id: companyId },
        validate: true,
      });

      const getCoordinates = await GoogleMapsService.getCoordinates(
        parameters.address,
      );

      const coordinates = getCoordinates.results[0]?.geometry.location;
      const address = getCoordinates.results[0]?.formatted_address;

      const countRecords = await this.companyUnitModel.countDocuments({
        // company: record?._id,
        address,
      });

      if (countRecords) {
        const message = RESULT.COMPANY_UNIT_ADDRESS_ALREADY_EXISTS;

        Log(
          LogType.ERROR,
          ListCompanyUnitService.name,
          this.execute.name,
          LogAction.FAILED,
          { message, parameters, address },
        );

        throw new HttpException(
          RESULT.COMPANY_UNIT_ADDRESS_ALREADY_EXISTS,
          HttpStatus.CONFLICT,
        );
      }
    } catch (error) {
      Log(
        LogType.ERROR,
        ListCompanyUnitService.name,
        this.execute.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.COMPANY_UNIT_NOT_CREATED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
