import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DateTime } from 'luxon';
import { AuthTokenParameters } from '../auth.interface';

@Injectable()
export class AuthTokenService {
  constructor(private readonly jwtService: JwtService) {}

  execute(userId: string, ip: string): AuthTokenParameters {
    const session = `${userId}-${ip}-${Date.now()}`;

    const access_token = this.jwtService.sign({ id: userId, session });

    const tokenDecoded = this.jwtService.decode(access_token);

    return {
      access_token,
      expires_in: DateTime.fromSeconds(tokenDecoded.exp),
      ...tokenDecoded,
    };
  }
}
