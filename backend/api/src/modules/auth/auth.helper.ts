import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';

export default class AuthHelper {
  public static async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  public static async validatePassword(
    passwordInformed: string,
    userPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(passwordInformed, userPassword);
  }

  public static generateUniqueHexCodeFromString(
    stringInformed: string,
    size = 6,
  ): string {
    const hash = crypto
      .createHash('sha256')
      .update(stringInformed)
      .digest('hex');

    return hash.substring(0, size);
  }

  public static generateUniqueNumericCodeFromString(
    stringInformed: string,
    size = 6,
  ): string {
    const hash = crypto
      .createHash('sha256')
      .update(stringInformed)
      .digest('hex');

    // Use a substring do hash para gerar um número
    const numericString = hash.replace(/[^0-9]/g, '');

    // Pega os primeiros 'size' dígitos, preenchendo com zeros se necessário
    return numericString.substring(0, size).padStart(size, '0');
  }
}
