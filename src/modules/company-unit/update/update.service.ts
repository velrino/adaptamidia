import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CompanyUnit, CompanyUnitDocument } from '../company-unit.schema';
import { GoogleMapsService } from 'src/shared/google/google-maps.service';
import { AuthenticatedRequest } from 'src/shared/request';
import { GetCompanyService } from 'src/modules/company/get/get.service';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { RESULT } from 'src/shared/result.enum';
import {
  CompanyUnitPrepareData,
  IFullAddressData,
} from '../company-unit.interface';
import { VerifyUserCanProceed } from 'src/modules/permissions/permissions.helper';
import { LatLngLiteral, PlaceType2 } from '@googlemaps/google-maps-services-js';
import { ICompany } from 'src/modules/company/company.interface';
import { Company } from 'src/modules/company/company.schema';
import { UpdateCompanyUnitValidator } from './update.interface';

@Injectable()
export class UpdateCompanyUnitService {
  constructor(
    @InjectModel(CompanyUnit.name)
    private readonly companyUnitModel: Model<CompanyUnitDocument>,
    private readonly getCompanyService: GetCompanyService,
  ) {}

  executeFromRequest(
    currentRequest: AuthenticatedRequest,
    id: string,
    parameters: UpdateCompanyUnitValidator,
  ) {
    try {
      VerifyUserCanProceed({
        need_company: parameters.company_id,
        user_permissions: currentRequest.user.user.permissions,
        user_companies: currentRequest.user.user.companies,
        need_permissions: [],
      });

      return this.execute(id, parameters);
    } catch (error) {
      throw new HttpException(
        error?.message || RESULT.COMPANY_UNIT_NOT_UPDATED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async execute(id: string, parameters: UpdateCompanyUnitValidator) {
    try {
      const companyUnitId = new Types.ObjectId(id);

      const record = await this.companyUnitModel
        .findOne({ _id: companyUnitId })
        .populate<{ company: ICompany }>({
          path: 'company',
        });

      if (!record) {
        throw new HttpException(
          RESULT.COMPANY_UNIT_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      const companyId = new Types.ObjectId(parameters.company_id);

      if (companyId !== record.company._id) {
        await this.getCompanyService.execute({
          filter: { _id: companyId },
          validate: true,
        });
      }

      let fullAddressData: IFullAddressData = {
        neighborhood: String(record.neighborhood),
        city: String(record.city),
        state: String(record.state),
        country: String(record.country),
        street_number: String(record.street_number),
        address: String(record.address),
        full_address: String(record.full_address),
      };

      let location = {
        type: 'Point',
        coordinates: [
          record.location.coordinates[0],
          record.location.coordinates[1],
        ],
      };

      if (parameters.full_address !== record.full_address) {
        const getCoordinates = await GoogleMapsService.getCoordinates(
          parameters.full_address,
        );

        const addressComponents =
          getCoordinates.results[0]?.address_components || [];

        const getComponent = (type: PlaceType2) => {
          const component = addressComponents.find((c) =>
            c.types.includes(type),
          );
          return component ? component.long_name : null;
        };

        const handleNeighborhood = (informed: string | null) => {
          if (typeof informed !== 'string') return informed;

          if (informed.toLowerCase().includes('alphaville')) {
            return 'Alphaville';
          }

          return informed;
        };

        fullAddressData = {
          neighborhood: handleNeighborhood(
            getComponent(PlaceType2.sublocality_level_1),
          ), // Bairro
          city: getComponent(PlaceType2.administrative_area_level_2), // Cidade
          state: getComponent(PlaceType2.administrative_area_level_1), // Estado
          country: getComponent(PlaceType2.country), // País
          street_number: getComponent(PlaceType2.street_number), // Número da rua
          address: getComponent(PlaceType2.route), // Nome da rua
          full_address: getCoordinates.results[0]?.formatted_address,
        };

        const countRecords = await this.companyUnitModel.countDocuments({
          // company: record?._id,
          ...fullAddressData,
        });

        if (countRecords) {
          const message = RESULT.COMPANY_UNIT_ADDRESS_ALREADY_EXISTS;

          Log(
            LogType.ERROR,
            UpdateCompanyUnitService.name,
            this.execute.name,
            LogAction.FAILED,
            { message, parameters, address: fullAddressData },
          );

          throw new HttpException(
            RESULT.COMPANY_UNIT_ADDRESS_ALREADY_EXISTS,
            HttpStatus.CONFLICT,
          );
        }

        const coordinates: LatLngLiteral =
          getCoordinates.results[0]?.geometry.location;

        location = {
          type: 'Point',
          coordinates: [coordinates.lng, coordinates.lat],
        };
      }

      const updateData = {
        ...fullAddressData,
        company: companyId,
        complement: parameters.complement,
        name: parameters.name,
        type: parameters.type,
        status: parameters.status,
        devices: {
          smart_tv: parameters.devices.smart_tv,
        },
        max_capacity: parameters.max_capacity,
        location,
      };

      const updated = await this.companyUnitModel
        .findOneAndUpdate({ _id: record._id }, updateData, {
          new: true,
        })
        .populate<{ company: Company }>({
          path: 'company',
        })
        .populate('popular_time')
        .lean();

      return CompanyUnitPrepareData(updated as any);
    } catch (error) {
      Log(
        LogType.ERROR,
        UpdateCompanyUnitService.name,
        this.execute.name,
        LogAction.FAILED,
        { parameters, error },
      );
      throw new HttpException(
        error?.message || RESULT.COMPANY_UNIT_NOT_UPDATED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
