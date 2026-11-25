import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../user/user.schema';
import { Authenticated, AuthTokenParameters } from './auth.interface';
import { RESULT } from 'src/shared/result.enum';

@Injectable()
export class AuthStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET'),
    });
  }

  async validate(token: AuthTokenParameters): Promise<Authenticated> {
    const user = await this.userModel.findById(token.id).exec();

    if (!user?._id) {
      throw new HttpException(RESULT.INVALID_TOKEN, HttpStatus.UNAUTHORIZED);
    }

    return { token, user } as any;
  }
}
