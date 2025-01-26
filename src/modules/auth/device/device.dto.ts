import { IsNotEmpty, IsString } from 'class-validator';
import { RequestCustomClient } from 'src/shared/request';

export class AuthDeviceGenerateDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}

export interface IAuthDeviceCache {
  id: string;
  code: string;
  qr_code: string;
  expires_in: any;
  custom_client: RequestCustomClient;
}
