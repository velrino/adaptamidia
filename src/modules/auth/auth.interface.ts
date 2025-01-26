import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { IUser } from '../user/user.interface';

export enum AuthenticationTypeEnum {
  DEFAULT = 'DEFAULT',
  GOOGLE = 'GOOGLE',
  APPLE = 'APPLE',
  APPLE_AND_GOOGLE = 'APPLE_AND_GOOGLE',
  COGNITO_APPLE = 'COGNITO_APPLE',
  COGNITO_GOOGLE = 'COGNITO_GOOGLE',
}

export enum AuthenticationUserTypeEnum {
  ADMIN = 'ADMIN',
}

export enum AuthenticationOTPFlow {
  ACTIVE = 'ACTIVE',
  DISABLE = 'DISABLE',
}

export enum GenetateAuthCodeFlow {
  FORGOT_PASSWORD = 'FORGOT_PASSWORD',
  SET_PASSWORD = 'SET_PASSWORD',
}

export class AuthSignUpDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class FlowNeedDto {
  @IsOptional({ message: 'OTP Code is required' })
  @IsString()
  otp_code?: string;
}

export class AuthLoginDto extends FlowNeedDto {
  @IsEmail()
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @IsOptional()
  @IsString()
  password?: string;

  @IsOptional()
  @IsEnum(AuthenticationUserTypeEnum)
  type?: AuthenticationUserTypeEnum;
}

export class AuthForgotPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;
}

export class AuthOTPDto {
  @IsNotEmpty()
  @IsString()
  code: string;
}

export class AuthSetPasswordDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @MinLength(6)
  password: string;
}

export class AuthTokenParameters {
  id: string;
  iat: number;
  exp: number;
  expires_in: Date;
  access_token: string;
}

export class Authenticated {
  token: AuthTokenParameters;
  user: IUser;
}
