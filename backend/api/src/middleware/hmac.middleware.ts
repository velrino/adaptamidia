import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { Response, NextFunction } from 'express';
import * as crypto from 'crypto';

@Injectable()
export class HmacMiddleware implements NestMiddleware {
  use(req: any, res: Response, next: NextFunction) {
    const secret = process.env.HMAC_SECRET;
    if (!secret)
      throw new UnauthorizedException('HMAC authentication is unavailable');
    const signature: any = req.headers['x-hub-signature'];

    if (!signature) {
      throw new UnauthorizedException('No signature provided');
    }

    // Extrai o HMAC da assinatura recebida
    const receivedHmac = signature.split('sha256=')[1];

    // Gera o HMAC do corpo da requisição usando o segredo compartilhado
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(req.rawBody); // Certifique-se de ter o corpo cru disponível
    const generatedHmac = hmac.digest('hex');

    // Compara os HMACs
    if (receivedHmac !== generatedHmac) {
      throw new UnauthorizedException('Invalid signature');
    }

    next(); // Se a assinatura for válida, prossiga para o próximo middleware ou controlador
  }
}
