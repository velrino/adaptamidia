import { Document } from 'mongoose';

import { User } from './user.schema';

export type IUser = Document & User;

export enum UserOTPEnum {
  ACTIVE = 'ACTIVE',
  IN_PROGRESS = 'IN_PROGRESS',
  INACTIVE = 'INACTIVE',
}
