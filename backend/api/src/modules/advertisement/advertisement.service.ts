import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Advertisement, AdvertisementDocument } from './advertisement.schema';
import { RESULT } from 'src/shared/result.enum';

@Injectable()
export class AdvertisementService {
  constructor(
    @InjectModel(Advertisement.name)
    public readonly model: Model<AdvertisementDocument>,
  ) {}
}
