import { IsEnum, IsNotEmpty } from 'class-validator';
import { FromEnum } from 'src/shared/interfaces/paginate.dto';

export class DisplayUnitInfoDto {
  @IsNotEmpty()
  @IsEnum(FromEnum)
  from: FromEnum = FromEnum.CACHE;
}

export interface IDisplayUnitInfo {
  from: FromEnum;
  id: string;
}
