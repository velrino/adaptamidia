import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  ICurrencyGetFromProviderResult,
  ICurrencyProviderAwesomeAPILast,
  ICurrencyProviderCoingeckoSimplePrice,
  IGetCurrencyService,
} from './get.interface';
import { DateTime } from 'luxon';
import { Milliseconds } from 'src/shared/general';
import { RedisService } from 'src/shared/redis/redis.service';
import { RedisKeysEnum } from 'src/shared/redis/redis.keys';
import { FromEnum } from 'src/shared/interfaces/paginate.dto';
import { Currency, CurrencyDocument } from '../currency.schema';
import { ICurrencyName, ICurrencyProvider } from '../currency.interface';
import { RESULT } from 'src/shared/result.enum';
import { Log, LogAction, LogType } from 'src/modules/logs/log.helper';

@Injectable()
export class GetCurrencyService {
  constructor(
    @InjectModel(Currency.name)
    private readonly currencyModel: Model<CurrencyDocument>,
    private readonly redisService: RedisService,
  ) {}

  async getFromProvider(
    name: ICurrencyName,
  ): Promise<ICurrencyGetFromProviderResult> {
    try {
      // 🎯 Tentativa principal: AwesomeAPI
      const awesomeRes = await fetch(
        'https://economia.awesomeapi.com.br/json/last/USD-BRL',
      );
      const data: ICurrencyProviderAwesomeAPILast = await awesomeRes.json();
      const usdbrl = data?.USDBRL;

      if (
        usdbrl?.bid &&
        usdbrl?.high &&
        usdbrl?.low &&
        usdbrl?.pctChange &&
        usdbrl?.timestamp
      ) {
        return {
          name,
          provider: ICurrencyProvider.AWESOMEAPI,
          bid: Number(usdbrl.bid),
          high: Number(usdbrl.high),
          low: Number(usdbrl.low),
          pctChange: Number(usdbrl.pctChange),
          last_provided_at: DateTime.fromSeconds(
            Number(usdbrl.timestamp),
          ).toJSDate(),
        };
      }

      throw new HttpException(
        RESULT.CURRENCY_PROVIDER_AWESOMEAPI_FAILED,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    } catch {
      // 🔁 Fallback: CoinGecko (usando USDT como proxy do USD)
      const cgRes = await fetch(
        'https://api.coingecko.com/api/v3/simple/price?ids=tether&vs_currencies=brl&include_24hr_change=true&include_last_updated_at=true',
      );
      const cgData: ICurrencyProviderCoingeckoSimplePrice = await cgRes.json();
      const tether = cgData?.tether;

      if (
        tether?.brl &&
        tether?.brl_24h_change != null &&
        tether?.last_updated_at
      ) {
        const bid = tether.brl;
        const pctChange = tether.brl_24h_change;

        // Estimar low e high (assumindo variação simétrica pra simplificar)
        const high = (bid * (1 + pctChange / 100)).toFixed(4);
        const low = (bid * (1 - pctChange / 100)).toFixed(4);

        return {
          name,
          provider: ICurrencyProvider.COINGECKO,
          bid: Number(bid.toString()),
          high: Number(high),
          low: Number(low),
          pctChange: Number(pctChange.toFixed(6)),
          last_provided_at: DateTime.fromSeconds(
            tether.last_updated_at,
          ).toJSDate(),
        };
      }

      throw new HttpException(
        RESULT.CURRENCY_PROVIDER_COINGECKO_FAILED,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async execute(parameters: IGetCurrencyService): Promise<CurrencyDocument> {
    const cacheKey = this.redisService.createKeyByObject(
      RedisKeysEnum.GET_CURRENCY,
      parameters,
    );

    // 1. Verificar cache primeiro se solicitado
    if (parameters.from === FromEnum.CACHE) {
      const dataCached: CurrencyDocument | null = await this.redisService.get(
        cacheKey.name,
      );
      if (dataCached) {
        return dataCached;
      }
    }

    // 2. Verificar no banco de dados por registros recentes
    const lastAgo = DateTime.now().minus({ minutes: 30 }).toJSDate();

    const record: CurrencyDocument | null = await this.currencyModel
      .findOne({
        name: parameters.name,
        last_provided_at: { $gte: lastAgo },
      })
      .sort({ last_provided_at: -1 })
      .lean(); // Pega o mais recente

    if (record) {
      // Atualizar cache com o registro encontrado
      await this.redisService.set(
        cacheKey.name,
        record,
        Milliseconds({ minutes: 10 }),
      );
      return record;
    }

    try {
      // 3. Se não encontrou, buscar da API externa
      const dataProvided = await this.getFromProvider(parameters.name);
      console.debug({ dataProvided });
      // 4. Atualizar ou criar registro no banco de dados
      const updatedRecord = await this.currencyModel
        .findOneAndUpdate(
          {
            name: parameters.name,
          },
          dataProvided,
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
        Milliseconds({ minutes: 10 }),
      );

      return updatedRecord;
    } catch (error) {
      Log(
        LogType.ERROR,
        GetCurrencyService.name,
        this.execute.name,
        LogAction.FAILED,
        { parameters, error },
      );
      const record = await this.currencyModel
        .findOne({ name: parameters.name })
        .sort({ last_provided_at: -1 })
        .lean();

      if (!record) {
        throw new HttpException(
          RESULT.CURRENCY_GET_FAILED,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      await this.redisService.set(
        cacheKey.name,
        record,
        Milliseconds({ minutes: 10 }),
      );

      return record;
    }
  }
}
