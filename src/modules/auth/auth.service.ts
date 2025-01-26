import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { RESULT } from 'src/shared/result.enum';
import { DateTime } from 'luxon';

import AuthHelper from './auth.helper';
import { JwtService } from '@nestjs/jwt';
import { AuthenticatedRequest, RequestCustomClient } from 'src/shared/request';

import { hasPermission } from '../permissions/permissions.helper';

// import { EmailService } from '../email/email.service';

import { User } from '../user/user.schema';
import {
  Authenticated,
  AuthenticationOTPFlow,
  AuthenticationTypeEnum,
  AuthenticationUserTypeEnum,
  AuthForgotPasswordDto,
  AuthLoginDto,
  AuthOTPDto,
  AuthSetPasswordDto,
  AuthSignUpDto,
  AuthTokenParameters,
  GenetateAuthCodeFlow,
} from './auth.interface';
import { UserOTPEnum } from '../user/user.interface';
import { AuthOtpService } from './otp/otp.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private userModel: Model<User>,
    // private readonly logService: LogService,
    // private readonly emailService: EmailService,
    private readonly authOtpService: AuthOtpService,
  ) {}

  /**
   * Registers a new user
   * Validates the email parameters with a hashed password and generates a JWT token for authentication.
   */
  async register(parameters: AuthSignUpDto): Promise<AuthTokenParameters> {
    try {
      await this.registerValidation(parameters.email);

      const newUser = await this.createUser(
        parameters.email,
        parameters.password,
      );

      return this.prepareTokenPayload(newUser._id.toString());
    } catch (error) {
      console.error(`AuthService.register | user ${parameters.email}`, {
        parameters,
        error,
      });
      throw new HttpException(
        error?.message || RESULT.AUTH_REGISTER_FAILED,
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Validates if the email is already registered in the system.
   * Throws an exception if the email already exists.
   */
  private async registerValidation(email: string): Promise<void> {
    const existingUser = await this.userModel.findOne({ email });

    if (existingUser) {
      throw new BadRequestException(RESULT.EMAIL_ALREADY_EXISTS);
    }
  }

  /**
   * Creates a new user with the provided email and password.
   * Returns the newly created user.
   */
  private async createUser(email: string, password: string) {
    const newUser = new this.userModel({ email, password });
    return newUser.save();
  }

  private async genetateAuthCode(
    userId: Types.ObjectId,
    flow: GenetateAuthCodeFlow,
    sendEmail = true,
  ) {
    const authCode = AuthHelper.generateUniqueNumericCodeFromString(
      `${String(userId)}+${String(new Date())}`,
    );

    const checkExists = await this.userModel.exists({
      _id: userId,
      authCode,
    });

    if (checkExists) {
      return await this.genetateAuthCode(userId, flow, sendEmail);
    }
    const now = DateTime.now();
    const authCodeExpiresAt = now.plus({ minutes: 10 });

    const user = await this.userModel.findOneAndUpdate(
      { _id: userId },
      {
        authCode,
        authCodeExpiresAt,
      },
    );

    if (sendEmail) {
      // const language = user.language;
      // Define common translation arguments
      // const commonArguments = { AUTH_CODE: { AUTH_CODE: authCode } };
      // Map flow type to file names and translation payloads
      // const flowConfig = {
      //   [GenetateAuthCodeFlow.SET_PASSWORD]: {
      //     fileName: 'set-password.html',
      //     translationsPayload: {
      //       prefix: II18nPrefix.email_set_password,
      //       language,
      //       keys: [
      //         'TITLE',
      //         'SET_PASSWORD_TITLE',
      //         'GREETING',
      //         'AUTH_CODE',
      //         'SET_PASSWORD_INSTRUCTIONS',
      //         'SIGNATURE',
      //         'TEAM',
      //       ],
      //       arguments: commonArguments,
      //     },
      //   },
      //   [GenetateAuthCodeFlow.FORGOT_PASSWORD]: {
      //     fileName: 'forgot-password.html',
      //     translationsPayload: {
      //       prefix: II18nPrefix.email_forgot_password,
      //       language,
      //       keys: [
      //         'TITLE',
      //         'PASSWORD_RECOVERY_TITLE',
      //         'GREETING',
      //         'AUTH_CODE',
      //         'RESET_INSTRUCTIONS',
      //         'IGNORE_MESSAGE',
      //         'SIGNATURE',
      //         'TEAM',
      //       ],
      //       arguments: commonArguments,
      //     },
      //   },
      // };
      // // Get configuration based on the flow type
      // const { fileName, translationsPayload } = flowConfig[flow];
      // // Load translations using the shared payload
      // const translations =
      //   await this.i18nInternalService.loadTranslations(translationsPayload);
      // const emailContent = ViewsHelper.replace(
      //   join(process.cwd(), 'src', 'views', 'emails', 'auth', fileName),
      //   translations,
      // );
      // await this.emailService.sendEmail({
      //   to: user.email,
      //   bodyHtml: emailContent,
      //   bodyText: '',
      //   subject: translations.EMAIL_SUBJECT,
      // });
    }

    return { user: user?.email };
  }

  /**
   * Retrieves the user based on the provided email.
   * Checks if the user exists and if the password is correct.
   * Also checks for recent failed login attempts.
   * Throws exceptions if the user is not found or if the credentials are invalid.
   */
  private async getUserByLogin(
    parameters: AuthLoginDto,
    request: RequestCustomClient,
  ) {
    console.log('getUserByLogin', request.browser);
    const user = await this.userModel.findOne({
      email: parameters.email,
    });

    if (!user) {
      throw new NotFoundException(RESULT.USER_NOT_FOUND);
    }

    if (user.auth_type !== AuthenticationTypeEnum.DEFAULT) {
      throw new HttpException(RESULT.AUTH_TYPE_WRONG, HttpStatus.BAD_REQUEST);
    }

    if (!user.password && user.auth_type === AuthenticationTypeEnum.DEFAULT) {
      await this.genetateAuthCode(user._id, GenetateAuthCodeFlow.SET_PASSWORD);
      throw new HttpException(
        RESULT.USER_NEED_SET_PASSWORD,
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!parameters.password && user.password) {
      throw new HttpException(
        RESULT.USER_NEED_SEND_PASSWORD,
        HttpStatus.BAD_REQUEST,
      );
    }

    // const recentAttempts = await this.logService.logAuthModel.countDocuments({
    //   user: user._id.toString(),
    //   result: LogAuthResultEnum.failed,
    //   type: LogAuthTypesEnum.login,
    //   createdAt: { $gte: new Date(Date.now() - 5 * 60 * 1000) }, // Attempts in the last 5 minutes
    // });

    // if (recentAttempts >= 3) {
    //   throw new HttpException(
    //     RESULT.USER_TOO_MANY_LOGIN_ATTEMPTS,
    //     HttpStatus.TOO_MANY_REQUESTS,
    //   );
    // }

    const checkPassword = await AuthHelper.validatePassword(
      parameters.password as string,
      user.password,
    );

    if (!checkPassword) {
      // await this.logService.createLog({
      //   type: LogTypeEnum.auth,
      //   parameters: {
      //     action: LogAuthActionEnum.wrong_password,
      //     result: LogAuthResultEnum.failed,
      //     type: LogAuthTypesEnum.login,
      //     data: request,
      //     ip: request.ip,
      //     latitude: request.latitude,
      //     longitude: request.longitude,
      //     user: user._id,
      //     otp: false,
      //   },
      // });
      throw new NotFoundException(RESULT.USER_INVALID_CREDENTIALS);
    }

    if (parameters.type === AuthenticationUserTypeEnum.ADMIN) {
      hasPermission(user?.permissions || []);
    }

    const needOTP: boolean = user.otp === UserOTPEnum.ACTIVE;
    if (needOTP) {
      // TODO remover em PRODUCTION
      if (
        user.otp_secret &&
        parameters.otp_code &&
        (parameters.otp_code !== '000000' ||
          parameters.email !== 'user@xmpmedia.com')
      ) {
        this.authOtpService.verifyFlow(user.otp_secret, parameters.otp_code);
      }
    }

    // await this.logService.createLog({
    //   type: LogTypeEnum.auth,
    //   parameters: {
    //     action: LogAuthActionEnum.authenticated,
    //     result: LogAuthResultEnum.success,
    //     type: LogAuthTypesEnum.login,
    //     data: request,
    //     ip: request.ip,
    //     latitude: request.latitude,
    //     longitude: request.longitude,
    //     user: user._id,
    //     otp: needOTP,
    //   },
    // });

    return user;
  }

  /**
   * Auth user
   * Verifies the user's credentials and generates a JWT token if the credentials are valid.
   */
  async login(parameters: AuthLoginDto, request: RequestCustomClient) {
    try {
      const user = await this.getUserByLogin(parameters, request);

      return this.prepareTokenPayload(user._id.toString());
    } catch (error) {
      delete parameters?.password;

      console.error(`AuthService.login | user ${parameters.email}`, {
        parameters,
        error,
      });
      throw new HttpException(
        error?.message || RESULT.AUTH_LOGIN_FAILED,
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Prepares the JWT token payload for authentication.
   * Generates a JWT token with the user's ID and sets the expiration time.
   */
  private prepareTokenPayload(userId: string): AuthTokenParameters {
    const access_token = this.jwtService.sign({ id: userId });

    const tokenDecoded = this.jwtService.decode(access_token);

    return {
      access_token,
      expires_in: DateTime.fromSeconds(tokenDecoded.exp), //new Date(tokenDecoded.exp * 1000).toISOString(),
      ...tokenDecoded,
    };
  }

  public async setPassword(
    parameters: AuthSetPasswordDto,
    // request: RequestCustomClient,
  ) {
    try {
      const user = await this.userModel.findOne({
        email: parameters.email,
        authCode: parameters.code,
      });

      if (!user) {
        throw new HttpException(RESULT.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
      }

      await this.userModel.findOneAndUpdate(
        { _id: user._id },
        {
          password: await AuthHelper.hashPassword(parameters.password),
          $unset: { authCode: 1, authCodeExpiresAt: 1 }, // Remove a coluna authCode e authCodeExpiresAt
        },
        { new: true },
      );

      const token = this.prepareTokenPayload(user._id.toString());

      // await this.logService.createLog({
      //   type: LogTypeEnum.auth,
      //   parameters: {
      //     action: LogAuthActionEnum.set_password,
      //     result: LogAuthResultEnum.success,
      //     type: LogAuthTypesEnum.password,
      //     data: request,
      //     ip: request.ip,
      //     latitude: request.latitude,
      //     longitude: request.longitude,
      //     user: user._id,
      //     otp: false,
      //   },
      // });

      return token;
    } catch (error) {
      console.error(`AuthService.setPassword | user ${parameters.code}`, {
        parameters,
        error,
      });
      throw new HttpException(
        error?.message || RESULT.AUTH_SET_PASSWORD_FAILED,
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  public async forgotPassword(
    parameters: AuthForgotPasswordDto,
    request: RequestCustomClient,
  ) {
    console.log('forgotPassword', request.browser);

    try {
      const user = await this.userModel.findOne({
        email: parameters.email,
      });

      if (!user) {
        throw new NotFoundException(RESULT.USER_NOT_FOUND);
      }

      if (user.auth_type !== AuthenticationTypeEnum.DEFAULT) {
        throw new HttpException(RESULT.AUTH_TYPE_WRONG, HttpStatus.BAD_REQUEST);
      }

      await this.genetateAuthCode(
        user._id,
        GenetateAuthCodeFlow.FORGOT_PASSWORD,
      );

      // await this.logService.createLog({
      //   type: LogTypeEnum.auth,
      //   parameters: {
      //     action: LogAuthActionEnum.forgot_password,
      //     result: LogAuthResultEnum.success,
      //     type: LogAuthTypesEnum.password,
      //     data: request,
      //     ip: request.ip,
      //     latitude: request.latitude,
      //     longitude: request.longitude,
      //     user: user._id,
      //     otp: false,
      //   },
      // });
    } catch (error) {
      console.error(`AuthService.forgotPassword | user ${parameters.email}`, {
        parameters,
        error,
      });
      throw new HttpException(
        error?.message || RESULT.AUTH_FORGOT_PASSWORD_FAILED,
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async refreshToken(userId: string) {
    return this.prepareTokenPayload(userId);
  }

  public async generateOTP(authenticated: Authenticated) {
    if (authenticated.user.otp === UserOTPEnum.ACTIVE) {
      throw new HttpException(
        RESULT.USER_OTP_ALREADY_ENABLED,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    let secret = authenticated.user?.otp_secret || null;

    if (!secret) {
      secret = this.authOtpService.createSecret();

      await this.userModel.findByIdAndUpdate(
        authenticated.user['_id'],
        { otp_secret: secret, otp: UserOTPEnum.IN_PROGRESS },
        { new: true },
      );
    }

    const otpUri = this.authOtpService
      .execute(secret, authenticated.user.email)
      .toString();

    const qr_code = await this.authOtpService.generateQrCode(otpUri);

    return {
      secret,
      qr_code,
    };
  }

  public async otpFlow(
    request: AuthenticatedRequest,
    parameters: AuthOTPDto,
    flow: AuthenticationOTPFlow,
  ) {
    try {
      const authenticated = request.user.user;
      const userId = authenticated._id as any;
      // const customClient = request.custom_client;
      const isEnableFlow = flow === AuthenticationOTPFlow.ACTIVE;

      if (!isEnableFlow && authenticated.otp !== UserOTPEnum.ACTIVE) {
        throw new HttpException(
          RESULT.USER_OTP_NOT_ENABLED,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      if (isEnableFlow && authenticated.otp === UserOTPEnum.ACTIVE) {
        throw new HttpException(
          RESULT.USER_OTP_ALREADY_ENABLED,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      // if (!authenticated.otp_secret) {
      //   throw new HttpException(
      //     RESULT.USER_OTP_ALREADY_ENABLED,
      //     HttpStatus.UNPROCESSABLE_ENTITY,
      //   );
      // }

      const isValid = this.authOtpService.verify(
        authenticated.otp_secret as string,
        parameters.code,
      );

      if (!isValid) {
        throw new HttpException(
          RESULT.USER_OTP_INVALID_CODE,
          HttpStatus.UNPROCESSABLE_ENTITY,
        );
      }

      const updateQuery = isEnableFlow
        ? { otp: UserOTPEnum.ACTIVE } // Ativa o OTP
        : { otp: UserOTPEnum.INACTIVE, $unset: { otp_secret: '' } }; // Inativa e remove otp_secret

      await this.userModel.updateOne({ _id: userId }, updateQuery);

      // await this.logService.createLog({
      //   type: LogTypeEnum.auth,
      //   parameters: {
      //     action: LogAuthActionEnum.otp,
      //     result: LogAuthResultEnum.success,
      //     type: isEnableFlow
      //       ? LogAuthTypesEnum.activated
      //       : LogAuthTypesEnum.disabled,
      //     data: customClient,
      //     ip: customClient.ip,
      //     latitude: customClient.latitude,
      //     longitude: customClient.longitude,
      //     user: userId,
      //     otp: !isEnableFlow,
      //   },
      // });

      return {
        result: true,
      };
    } catch (error) {
      throw new HttpException(
        error?.message || RESULT.AUTH_LOGIN_FAILED,
        error?.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
