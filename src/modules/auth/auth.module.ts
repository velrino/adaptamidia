import { Global, Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthStrategy } from './auth.strategy';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthTokenService } from './token/token.service';
import { AuthDeviceService } from './device/device.service';
import { AuthOtpService } from './otp/otp.service';
import { MongoCollection } from 'src/shared/mongo.schema';

@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([MongoCollection.users]),
  ],
  providers: [
    AuthService,
    AuthStrategy,
    AuthTokenService,
    AuthOtpService,
    AuthDeviceService,
  ],
  controllers: [AuthController],
})
export class AuthModule {}
