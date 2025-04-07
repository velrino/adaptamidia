import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { DisplayService } from '../display.service';
import { RedisService } from 'src/shared/redis/redis.service';
import { RESULT } from 'src/shared/result.enum';
import { IDisplayUnitInfo } from './info.interface';
import {
  FindByIdParamsDto,
  FromEnum,
} from 'src/shared/interfaces/paginate.dto';
import { IDisplayAdvertisementUnit } from '../unit/unit.interface';
import { Types } from 'mongoose';
import { GetWeatherService } from 'src/modules/weather/get/get.service';

@Injectable()
export class DisplayUnitInfoService {
  constructor(
    private readonly displayService: DisplayService,
    private readonly redisService: RedisService,
    private readonly getWeatherService: GetWeatherService,
  ) {}

  executeFromRequest(parameters: FindByIdParamsDto) {
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
        from: FromEnum.CACHE,
        city: currentUnit.state,
        country: currentUnit.country,
      });

      const result = { unit: currentUnit, weather: getWeather };

      return result;
    } catch (error) {
      throw new HttpException(
        error?.message || RESULT.DISPLAY_GET_UNIT_INFO_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
