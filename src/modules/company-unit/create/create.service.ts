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
import {
  CompanyUnitPrepareData,
  CompanyUnitStatus,
} from '../company-unit.interface';
import { VerifyUserCanProceed } from 'src/modules/permissions/permissions.helper';
import { PlaceType2 } from '@googlemaps/google-maps-services-js';
import { CompanyType } from 'src/modules/company/company.interface';
import {
  CompanyUnitPopularTime,
  CompanyUnitPopularTimeDocument,
} from '../popular-times/company-unit-popular-times.schema';
import { CompanyUnitPopularTimeDataDefault } from '../popular-times/company-unit-popular-times.interface';
import { Company } from 'src/modules/company/company.schema';

@Injectable()
export class CreateCompanyUnitService {
  constructor(
    @InjectModel(CompanyUnit.name)
    private readonly companyUnitModel: Model<CompanyUnitDocument>,
    private readonly getCompanyService: GetCompanyService,
    // POPULAR TIMES
    @InjectModel(CompanyUnitPopularTime.name)
    private readonly companyUnitPopularTimeModel: Model<CompanyUnitPopularTimeDocument>,
  ) {}

  // async onApplicationBootstrap() {
  //   await this.companyUnitPopularTimeModel.deleteMany({});
  //   const data = await this.companyUnitModel.find({});

  //   for (let index = 0; index < data.length; index++) {
  //     const element = data[index];
  //     await this.createPopularTime(new Types.ObjectId(element._id as any));
  //     console.log({ element: element._id });
  //   }
  // }

  // async createPopularTime(companyUnitId: Types.ObjectId) {
  //   const getPopularTime = await this.companyUnitPopularTimeModel.findOne({
  //     company_unit: companyUnitId,
  //   });

  //   if (getPopularTime) {
  //     return;
  //   }

  //   await this.companyUnitPopularTimeModel.create({
  //     company_unit: companyUnitId,
  //     days: CompanyUnitPopularTimeDataDefault,
  //   });
  // }

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

      const handleNeighborhood = (informed: string | null) => {
        if (typeof informed !== 'string') return informed;

        if (informed.toLowerCase().includes('alphaville')) {
          return 'Alphaville';
        }

        return informed;
      };

      const fullAddressData = {
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

      const session = await this.companyUnitModel.db.startSession();
      session.startTransaction();

      try {
        const created = await this.companyUnitModel.create(
          [
            {
              ...fullAddressData,
              devices: parameters.devices,
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
            },
          ],
          { session },
        );

        const popularTimesCreated =
          await this.companyUnitPopularTimeModel.create(
            [
              {
                company_unit: created[0]._id,
                days: CompanyUnitPopularTimeDataDefault,
              },
            ],
            { session },
          );

        await session.commitTransaction();
        await session.endSession();

        const updated = await this.companyUnitModel
          .findOneAndUpdate(
            { _id: created[0]._id },
            {
              popular_time: popularTimesCreated[0]._id,
            },
            { new: true },
          )
          .populate<{ company: Company }>({
            path: 'company',
          })
          .populate('popular_time')
          .lean();

        return CompanyUnitPrepareData(updated as any);
      } catch (error) {
        await session.abortTransaction();
        throw error;
      } finally {
        await session.endSession();
      }
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
