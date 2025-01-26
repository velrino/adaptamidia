import {
  Controller,
  Post,
  Body,
  ValidationPipe,
  Req,
  Get,
  UseGuards,
  Delete,
} from '@nestjs/common';
import {
  AuthenticationOTPFlow,
  AuthForgotPasswordDto,
  AuthLoginDto,
  AuthOTPDto,
  AuthSignUpDto,
} from './auth.interface';
import { Throttle } from '@nestjs/throttler';
import { AuthenticatedRequest, CustomRequest } from 'src/shared/request';
import { AuthJwtGuard } from './auth.guard';
import { AuthDeviceGenerateDto } from './device/device.dto';
import { AuthDeviceService } from './device/device.service';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly authDeviceService: AuthDeviceService,
  ) {}

  @Post('register')
  async register(
    @Body(new ValidationPipe({ transform: true })) data: AuthSignUpDto,
  ) {
    return await this.authService.register(data);
  }

  @Post('login')
  @Throttle({ default: { limit: 5, ttl: 300000 } })
  async login(@Body() data: AuthLoginDto, @Req() req: CustomRequest) {
    return await this.authService.login(data, req.custom_client);
  }

  // @Post('set-password')
  // @Throttle({ default: { limit: 5, ttl: 300000 } })
  // async setPassword(
  //   @Body(new ValidationPipe({ transform: true })) data: AuthSetPasswordDto,
  //   @Req() req: CustomRequest,
  // ) {
  //   return await this.authService.setPassword(data, req.custom_client);
  // }

  @Post('forgot-password')
  async forgotPassword(
    @Body() data: AuthForgotPasswordDto,
    @Req() req: CustomRequest,
  ) {
    return await this.authService.forgotPassword(data, req.custom_client);
  }

  @Get('refresh-token')
  @UseGuards(AuthJwtGuard)
  async refreshToken(@Req() req: any) {
    return this.authService.refreshToken(req.user.id);
  }

  @Get('otp/generate')
  @UseGuards(AuthJwtGuard)
  async generateOTP(@Req() req: AuthenticatedRequest) {
    return await this.authService.generateOTP(req.user);
  }

  @Post('otp')
  @UseGuards(AuthJwtGuard)
  async enableOTP(@Body() data: AuthOTPDto, @Req() req: AuthenticatedRequest) {
    return await this.authService.otpFlow(
      req,
      data,
      AuthenticationOTPFlow.ACTIVE,
    );
  }

  @Delete('otp')
  @UseGuards(AuthJwtGuard)
  async disableOTP(@Body() data: AuthOTPDto, @Req() req: AuthenticatedRequest) {
    return await this.authService.otpFlow(
      req,
      data,
      AuthenticationOTPFlow.DISABLE,
    );
  }

  @Post('device/generate')
  generateDeviceCode(
    @Body() data: AuthDeviceGenerateDto,
    @Req() req: CustomRequest,
  ) {
    return this.authDeviceService.generateDeviceCode(data, req);
  }

  @Post('device')
  @UseGuards(AuthJwtGuard)
  authByDeviceCode(@Body() data: any, @Req() req: AuthenticatedRequest) {
    return this.authDeviceService.authByDeviceCode(data.code, req);
  }
}
