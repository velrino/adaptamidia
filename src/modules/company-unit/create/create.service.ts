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
import { CompanyUnitStatus } from '../company-unit.interface';
import { VerifyUserCanProceed } from 'src/modules/permissions/permissions.helper';
import { PlaceType2 } from '@googlemaps/google-maps-services-js';
import { CompanyType } from 'src/modules/company/company.interface';

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
      VerifyUserCanProceed({
        need_company: parameters.company_id,
        user_permissions: currentRequest.user.user.permissions,
        user_companies: currentRequest.user.user.companies,
        need_permissions: [],
      });

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

      if (record?.type !== CompanyType.LOCAL) {
        throw new HttpException(
          RESULT.COMPANY_NEED_LOCAL_TYPE,
          HttpStatus.BAD_REQUEST,
        );
      }

      const getCoordinates = await GoogleMapsService.getCoordinates(
        parameters.address,
      );

      const addressComponents =
        getCoordinates.results[0]?.address_components || [];

      const getComponent = (type: PlaceType2) => {
        const component = addressComponents.find((c) => c.types.includes(type));
        return component ? component.long_name : null;
      };

      const fullAddressData = {
        neighborhood: getComponent(PlaceType2.sublocality_level_1), // Bairro
        city: getComponent(PlaceType2.administrative_area_level_2), // Cidade
        state: getComponent(PlaceType2.administrative_area_level_1), // Estado
        country: getComponent(PlaceType2.country), // País
        street_number: getComponent(PlaceType2.street_number), // Número da rua
        address: getComponent(PlaceType2.route), // Nome da rua
        full_address: getCoordinates.results[0]?.formatted_address,
      };

      const coordinates = getCoordinates.results[0]?.geometry.location;

      const countRecords = await this.companyUnitModel.countDocuments({
        // company: record?._id,
        ...fullAddressData,
      });

      if (countRecords) {
        const message = RESULT.COMPANY_UNIT_ADDRESS_ALREADY_EXISTS;

        Log(
          LogType.ERROR,
          CreateCompanyUnitService.name,
          this.execute.name,
          LogAction.FAILED,
          { message, parameters, address: fullAddressData },
        );

        throw new HttpException(
          RESULT.COMPANY_UNIT_ADDRESS_ALREADY_EXISTS,
          HttpStatus.CONFLICT,
        );
      }

      const created = await this.companyUnitModel.create({
        ...fullAddressData,
        average_visitors: parameters.average_visitors,
        max_capacity: parameters.max_capacity,
        name: parameters.name,
        complement: parameters.complement,
        company: record?._id,
        type: parameters.type,
        status: CompanyUnitStatus.IN_REVIEW,
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
