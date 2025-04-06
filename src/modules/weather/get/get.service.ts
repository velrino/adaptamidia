import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Weather, WeatherDocument } from '../weather.schema';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  IGetWeatherService,
  IWeatherApiCurrentResponse,
} from './get.interface';
import { RESULT } from 'src/shared/result.enum';
import { IWeatherProvider } from '../weather.interface';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';
import { DateTime } from 'luxon';
import { Milliseconds, RemoveAccents } from 'src/shared/general';
import { RedisService } from 'src/shared/redis/redis.service';
import { RedisKeysEnum } from 'src/shared/redis/redis.keys';
import { FromEnum } from 'src/shared/interfaces/paginate.dto';

@Injectable()
export class GetWeatherService {
  constructor(
    @InjectModel(Weather.name)
    private readonly weatherModel: Model<WeatherDocument>,
    private readonly redisService: RedisService,
  ) {}

  // async onApplicationBootstrap() {
  //   try {
  //     const test = await this.execute({
  //       from: FromEnum.CACHE,
  //       city: 'São Paulo',
  //       country: 'Brazil',
  //     });
  //     console.log({ test });
  //   } catch (error) {
  //     console.log({ error });
  //   }
  // }

  async getWeatherapi(query: string) {
    const API_KEY = 'e7ef565e6f684715905215446250604';

    const url = `https://api.weatherapi.com/v1/current.json?key=${API_KEY}&q=${encodeURIComponent(query)}&lang=pt`;

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new HttpException(
          response.statusText || RESULT.INVALID_COMPANY_ID,
          response.status || HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      const responseData: IWeatherApiCurrentResponse = await response.json();

      const result: Weather = {
        country: responseData.location.country,
        region: responseData.location.region,
        icon: responseData.current.condition.icon || String(),
        last_provided_at: new Date(
          responseData.current.last_updated || new Date(),
        ),
        latitude: responseData.location.lat || 0,
        longitude: responseData.location.lon || 0,
        timezone: responseData.location.tz_id || String(),
        provider: IWeatherProvider.WEATHERAPI,
        temperature_c: responseData.current.temp_c || 0,
        temperature_f: responseData.current.temp_f || 0,
        text: responseData.current.condition.text || String(),
      };

      return result;
    } catch (error) {
      Log(
        LogType.ERROR,
        GetWeatherService.name,
        this.getWeatherapi.name,
        LogAction.FAILED,
        { query, error },
      );
      throw new HttpException(
        error?.message || RESULT.WEATHER_API_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async execute(parameters: IGetWeatherService) {
    const cityName = RemoveAccents(parameters.city);
    const countryName = RemoveAccents(parameters.country);

    const cacheKey = this.redisService.createKeyByObject(
      RedisKeysEnum.GET_WEATHER,
      parameters,
    );

    // 1. Verificar cache primeiro se solicitado
    if (parameters.from === FromEnum.CACHE) {
      const dataCached = await this.redisService.get(cacheKey.name);
      if (dataCached) {
        return dataCached;
      }
    }

    // 2. Verificar no banco de dados por registros recentes
    const lastAgo = DateTime.now().minus({ minutes: 30 }).toJSDate();

    const record = await this.weatherModel
      .findOne({
        last_provided_at: { $gte: lastAgo },
        region: { $regex: new RegExp(cityName, 'i') },
        country: { $regex: new RegExp(countryName, 'i') },
      })
      .sort({ last_provided_at: -1 })
      .lean(); // Pega o mais recente

    if (record) {
      // Atualizar cache com o registro encontrado
      await this.redisService.set(
        cacheKey.name,
        record,
        Milliseconds({ minutes: 30 }),
      );
      return record;
    }

    // 3. Se não encontrou, buscar da API externa
    const dataProvided = await this.getWeatherapi(
      `${cityName}, ${countryName}`,
    );

    // 4. Atualizar ou criar registro no banco de dados
    const updatedRecord = await this.weatherModel
      .findOneAndUpdate(
        {
          region: { $regex: new RegExp(cityName, 'i') },
          country: { $regex: new RegExp(countryName, 'i') },
        },
        {
          $set: {
            ...dataProvided,
            last_provided_at: new Date(),
          },
        },
        {
          new: true,
          upsert: true,
          setDefaultsOnInsert: true,
        },
      )
      .lean();

    // 5. Atualizar cache com os novos dados
    await this.redisService.set(
      cacheKey.name,
      updatedRecord,
      Milliseconds({ minutes: 30 }),
    );

    return updatedRecord;
  }
}
