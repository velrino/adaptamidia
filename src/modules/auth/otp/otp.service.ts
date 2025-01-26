import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as OTPAuth from 'otpauth';
import * as QRCode from 'qrcode';
import { RESULT } from 'src/shared/result.enum';

@Injectable()
export class AuthOtpService {
  private readonly issuer = 'XMPMedia';
  createSecret(): string {
    const secret = new OTPAuth.Secret();

    return secret.base32;
  }

  execute(secret: string, label?: string): OTPAuth.TOTP {
    return new OTPAuth.TOTP({
      issuer: this.issuer,
      label: label || (null as any),
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: OTPAuth.Secret.fromBase32(secret),
    });
  }

  async generateQrCode(uri: string): Promise<string> {
    return await QRCode.toDataURL(uri);
  }

  verify(secret: string, token: string): boolean {
    const totp = this.execute(secret);

    return totp.validate({ token }) !== null;
  }

  verifyFlow(secret: string, code: string | null): void {
    if (!code) {
      throw new HttpException(
        RESULT.USER_OTP_REQUIRED,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }

    const isValid = this.verify(secret, code);

    if (!isValid) {
      throw new HttpException(
        RESULT.USER_OTP_INVALID_CODE,
        HttpStatus.UNPROCESSABLE_ENTITY,
      );
    }
  }
}
