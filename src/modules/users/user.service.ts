import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DateTime } from 'luxon';
import { AuthenticatedRequest } from 'src/shared/request';
import { User } from './users.schema';
import { IUser } from './user.interface';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) public userModel: Model<User>) {}

  hiddenFields(parameters: AuthenticatedRequest) {
    const data = JSON.parse(JSON.stringify(parameters));

    data.token.expires_in = DateTime.fromSeconds(data.token.exp) as any;

    data.user = this.hiddenAuthenticated(data.user);

    return data;
  }

  hiddenAuthenticated(parameters: IUser) {
    const authenticated = JSON.parse(JSON.stringify(parameters));

    if (authenticated?.password) {
      delete authenticated.password;
    }

    if (authenticated?.otp_secret) {
      delete authenticated.otp_secret;
    }

    if (authenticated?.authCode) {
      delete authenticated.authCode;
    }

    return authenticated;
  }
}
