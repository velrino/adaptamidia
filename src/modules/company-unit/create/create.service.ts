import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CompanyUnit, CompanyUnitDocument } from '../company-unit.schema';
import { GoogleMapsService } from 'src/shared/google/google-maps.service';
import { CreateCompanyUnitValidator } from './create.interface';
import { AuthenticatedRequest } from 'src/shared/request';
import { GetCompanyService } from 'src/modules/company/get/get.service';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { RESULT } from 'src/shared/result.enum';
import { PermissionsEnum } from 'src/modules/permissions/permissions.enum';
import { CompanyUnitStatus } from '../company-unit.interface';

@Injectable()
export class CreateCompanyUnitService {
  constructor(
    @InjectModel(CompanyUnit.name)
    private readonly companyUnitModel: Model<CompanyUnitDocument>,
    private readonly getCompanyService: GetCompanyService,
  ) {}

  executeFromRequest(
    currentRequest: AuthenticatedRequest,
    parameters: CreateCompanyUnitValidator,
  ) {
    try {
      let canCreate = (currentRequest.user.user.permissions || []).includes(
        PermissionsEnum.SUDO,
      );

      if (
        currentRequest.user.user.companies?.includes(
          new Types.ObjectId(parameters.company_id),
        ) &&
        !canCreate
      ) {
        canCreate = true;
      }

      if (!canCreate) {
        throw new HttpException(
          RESULT.COMPANY_UNIT_CREATION_NOT_AUTHORIZED,
          HttpStatus.FORBIDDEN,
        );
      }

      return this.execute(parameters);
    } catch (error) {
      throw new HttpException(
        error?.message || RESULT.COMPANY_UNIT_NOT_CREATED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async execute(parameters: CreateCompanyUnitValidator) {
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
          CreateCompanyUnitService.name,
          this.execute.name,
          LogAction.FAILED,
          { message, parameters, address },
        );

        throw new HttpException(
          RESULT.COMPANY_UNIT_ADDRESS_ALREADY_EXISTS,
          HttpStatus.CONFLICT,
        );
      }

      const created = await this.companyUnitModel.create({
        average_visitors: parameters.average_visitors,
        max_capacity: parameters.max_capacity,
        name: parameters.name,
        company: record?._id,
        type: parameters.type,
        status: CompanyUnitStatus.IN_REVIEW,
        address,
        location: {
          type: 'Point',
          coordinates: [coordinates.lng, coordinates.lat],
        },
      });

      return created;
    } catch (error) {
      Log(
        LogType.ERROR,
        CreateCompanyUnitService.name,
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
