import { IsMongoId, IsNotEmpty } from 'class-validator';
import { Types } from 'mongoose';
import { CompanyDocument } from 'src/modules/company/company.schema';
import { PaginateDto } from 'src/shared/interfaces/paginate.dto';
import { AdvertisementStatus } from '../advertisement.interface';

export class DisplayAdvertisementPaginateDto extends PaginateDto {}

export class IDisplayAdvertisementPaginateDto extends DisplayAdvertisementPaginateDto {
  @IsNotEmpty()
  @IsMongoId({ message: 'INVALID_ID_FORMAT' })
  id: string;
}

export interface IDisplayAdvertisementUnit {
  _id: Types.ObjectId;
  name: string;
  status: AdvertisementStatus;
  company: {
    _id: Types.ObjectId;
    name: string;
    status: AdvertisementStatus;
  } | null;
}
