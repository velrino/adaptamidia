import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);

  // const port = configService.get<number>('PORT', 4002);
  const host = configService.get<string>('HOST', '0.0.0.0');

  app.useGlobalFilters(new AllExceptionsFilter());

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  app.enableCors();

  const port = process.env.PORT || 4002;

  await app.listen(port, host);

  console.info(
    `Server VERCEL started on ${host}:${port}`,
    new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
  );
}
bootstrap();
