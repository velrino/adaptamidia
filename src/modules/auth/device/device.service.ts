import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as crypto from 'crypto';
import * as QRCode from 'qrcode';
import { AuthDeviceGenerateDto, IAuthDeviceCache } from './device.dto';
import { RedisService } from 'src/shared/redis/redis.service';
import { AuthenticatedRequest, CustomRequest } from 'src/shared/request';
import { DateTime } from 'luxon';
import { RedisKeysEnum } from 'src/shared/redis/redis.keys';

import { AuthTokenService } from '../token/token.service';
import { RESULT } from 'src/shared/result.enum';
import { FirebaseDatabaseService } from 'src/shared/firebase/firebase-database.service';
import { FirebasePathsEnum } from 'src/shared/firebase/firebase.enum';

@Injectable()
export class AuthDeviceService {
  constructor(
    private readonly firebaseDatabaseService: FirebaseDatabaseService,
    private readonly redisService: RedisService,
    private readonly authTokenService: AuthTokenService,
    // private readonly logService: LogService,
  ) {}

  async generateDeviceCode(data: AuthDeviceGenerateDto, req: CustomRequest) {
    try {
      const { custom_client } = req;

      const preHash = `${data.id}-${custom_client.ip}`;

      const hash = crypto.createHash('sha256').update(preHash).digest('hex');

      const code = hash.slice(0, 6).toUpperCase();

      const cacheKey = `${RedisKeysEnum.AUTH_DEVICE_CODE}:${code}`;

      const checkCache = await this.redisService.get(cacheKey);

      if (checkCache) {
        throw new HttpException(
          RESULT.AUTH_DEVICE_CODE_ALREADY_EXIST,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      const expires_in = DateTime.now().plus({ minutes: 5 });

      const qr_code = await QRCode.toDataURL(code, {
        scale: 10,
      });

      const result: IAuthDeviceCache = {
        expires_in,
        id: data.id,
        code,
        qr_code,
        custom_client,
      };

      await this.redisService.set(cacheKey, result, 600000); // Cache de 10 minutos

      return result;
    } catch (error) {
      console.log('AuthDeviceService.generateDeviceCode', { data, error });

      throw new HttpException(
        error?.message || RESULT.AUTH_DEVICE_CODE_GENERATE_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }

  async authByDeviceCode(code: string, authenticated: AuthenticatedRequest) {
    try {
      const cacheKey = `${RedisKeysEnum.AUTH_DEVICE_CODE}:${code.toUpperCase()}`;

      const data: IAuthDeviceCache | null =
        await this.redisService.get(cacheKey);

      if (!data) {
        throw new HttpException(
          RESULT.AUTH_DEVICE_CODE_NOT_FOUND,
          HttpStatus.NOT_FOUND,
        );
      }

      const user = authenticated.user.user.id;

      const result = this.authTokenService.execute(
        user,
        String(authenticated?.custom_client?.ip),
      );

      // await this.logService.createLog({
      //   type: LogTypeEnum.auth,
      //   parameters: {
      //     action: LogAuthActionEnum.authenticated,
      //     result: LogAuthResultEnum.success,
      //     type: LogAuthTypesEnum.login_device,
      //     data: data.custom_client,
      //     ip: data.custom_client.ip,
      //     latitude: data.custom_client.latitude,
      //     longitude: data.custom_client.longitude,
      //     user: user,
      //     otp: false,
      //   },
      // });

      await this.firebaseDatabaseService.save(
        FirebasePathsEnum.AUTH_DEVICES,
        data.id,
        result,
      );

      console.log(RESULT.AUTH_DEVICE_CODE_SEND_EVENT_SUCCESS, {
        device_id: data.id,
        result,
      });

      // await this.redisService.del(cacheKey);

      return result;
    } catch (error) {
      console.log('AuthDeviceService.authByDeviceCode', { code, error });

      throw new HttpException(
        error?.message || RESULT.AUTH_DEVICE_CODE_FAILED,
        error?.status || HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
