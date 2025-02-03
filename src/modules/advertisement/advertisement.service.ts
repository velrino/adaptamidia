import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Advertisement,
  AdvertisementDocument,
  AdvertisementItem,
} from './advertisement.schema';
import { RESULT } from 'src/shared/result.enum';

@Injectable()
export class AdvertisementService {
  constructor(
    @InjectModel(Advertisement.name)
    public readonly model: Model<AdvertisementDocument>,
  ) {}

  allItemsIsSameType(items: AdvertisementItem[]) {
    const result = items.every((item) => item.type === items[0].type);

    if (!result) {
      throw new HttpException(
        RESULT.ADVERTISEMENT_NEEDS_SAME_TYPE,
        HttpStatus.BAD_REQUEST,
      );
    }

    return result;
  }

  calculateTotalSeconds(items: AdvertisementItem[]) {
    if (!Array.isArray(items) || !items.length) return 0;

    return items.reduce((acc, item) => acc + (Number(item.seconds) || 0), 0);
  }
}
