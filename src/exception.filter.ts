import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    let message =
      exception instanceof HttpException
        ? (exception.getResponse() as any).message
        : 'Internal server error';

    let currentMessage: string | null = null;
    if (typeof exception['response'] === 'string') {
      currentMessage = exception['response'];
    }

    if (!currentMessage) {
      if (Array.isArray(message)) {
        message = formatMessages(message);
        currentMessage = message[0];
      } else if (typeof message === 'string') {
        // Se for uma string, formate diretamente
        currentMessage = message.toUpperCase().replace(/\s+/g, '_');
      }
    }

    response.status(status).json({
      statusCode: status,
      message: currentMessage,
      error:
        exception instanceof HttpException
          ? exception.name
          : 'Internal Server Error',
    });
  }
}

function formatMessages(messages: string[]): string[] {
  return messages.map((message) =>
    message
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z_]/g, ''),
  );
}
