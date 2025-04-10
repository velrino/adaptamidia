import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { RESULT } from 'src/shared/result.enum';
import { RedisService } from 'src/shared/redis/redis.service';
import { RedisKeysEnum } from 'src/shared/redis/redis.keys';

import {
  CompanyUnit,
  CompanyUnitDocument,
} from 'src/modules/company-unit/company-unit.schema';
import { IDisplayAdvertisementUnit } from './unit/unit.interface';
import { Milliseconds } from 'src/shared/general';

@Injectable()
export class DisplayService {
  constructor(
    @InjectModel(CompanyUnit.name)
    private readonly companyUnitModel: Model<CompanyUnitDocument>,
    private readonly redisService: RedisService,
  ) {}

  async getUnit(
    id: Types.ObjectId,
    select: string[] = [],
  ): Promise<IDisplayAdvertisementUnit> {
    const selectColumns: string[] = select.length
      ? select
      : [
          '_id',
          'name',
          'state',
          'status',
          'company',
          'preferences',
          'city',
          'country',
        ];

    const cacheKey = this.redisService.createKeyByObject(
      RedisKeysEnum.DISPLAY_GET_COMPANY_UNIT,
      {
        id: id.toString(),
        selectColumns,
      },
    );

    const dataCached: IDisplayAdvertisementUnit | null =
      await this.redisService.get(cacheKey.name);

    if (dataCached) {
      return dataCached;
    }

    const record = await this.companyUnitModel
      .findOne({ _id: id, company: { $exists: true, $ne: null } })
      .select(selectColumns)
      .populate<{
        company: NonNullable<IDisplayAdvertisementUnit['company']>;
      }>({
        path: 'company',
        select: ['_id', 'name', 'status'],
      })
      .lean<IDisplayAdvertisementUnit>();

    if (!record) {
      throw new HttpException(
        RESULT.INVALID_COMPANY_UNIT_ID,
        HttpStatus.NOT_FOUND,
      );
    }

    if (!record?.company?._id) {
      throw new HttpException(
        RESULT.COMPANY_UNIT_WITHOUT_COMPANY_ID,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    await this.redisService.set(
      cacheKey.name,
      record,
      Milliseconds({ minutes: 5 }),
    );

    return record;
  }
}
