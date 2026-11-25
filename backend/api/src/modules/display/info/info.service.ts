import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DisplayService } from '../display.service';
import { RedisService } from 'src/shared/redis/redis.service';
import { RESULT } from 'src/shared/result.enum';
import { IDisplayUnitInfo } from './info.interface';
import { IDisplayAdvertisementUnit } from '../unit/unit.interface';
import { Types } from 'mongoose';
import { GetWeatherService } from 'src/modules/weather/get/get.service';
import { GetCurrencyService } from 'src/modules/currency/get/get.service';
import { ICurrencyName } from 'src/modules/currency/currency.interface';

@Injectable()
export class DisplayUnitInfoService {
  constructor(
    private readonly displayService: DisplayService,
    private readonly redisService: RedisService,
    private readonly getCurrencyService: GetCurrencyService,
    private readonly getWeatherService: GetWeatherService,
  ) {}

  executeFromRequest(parameters: IDisplayUnitInfo) {
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
        error?.message || RESULT.DISPLAY_GET_UNIT_INFO_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async execute(parameters: IDisplayUnitInfo) {
    try {
      const unitId = new Types.ObjectId(parameters.id);

      const currentUnit: IDisplayAdvertisementUnit =
        await this.displayService.getUnit(unitId);

      const getWeather = await this.getWeatherService.execute({
        from: parameters.from,
        city: currentUnit.state,
        country: currentUnit.country,
        lat: currentUnit.location.coordinates[1],
        lon: currentUnit.location.coordinates[0],
      });

      const getCurrency = await this.getCurrencyService.execute({
        from: parameters.from,
        name: ICurrencyName.USD,
      });

      const result = {
        from: parameters.from,
        unit: currentUnit,
        currency: getCurrency,
        weather: getWeather,
      };

      return result;
    } catch (error) {
      throw new HttpException(
        error?.message || RESULT.DISPLAY_GET_UNIT_INFO_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
