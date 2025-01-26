import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompanyUnit, CompanyUnitDocument } from '../company-unit.schema';

@Injectable()
export class GetCompanyUnitsByGeolocationService {
  constructor(
    @InjectModel(CompanyUnit.name)
    private readonly companyUnitModel: Model<CompanyUnitDocument>,
  ) {}

  async findUnitsWithinRadius(
    latitude: number,
    longitude: number,
    radius: number, // Radius in meters
  ) {
    return this.companyUnitModel.find({
      location: {
        $geoWithin: {
          $centerSphere: [
            [longitude, latitude], // [longitude, latitude]
            radius / 6371000, // convert radius to meters
          ],
        },
      },
    });
  }
}
