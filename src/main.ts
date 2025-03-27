import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableCors();

  const port = process.env.PORT || 4002;

  await app.listen(port, '0.0.0.0'); // Cloud Run exige isso

  console.info(
    `Server started on http://0.0.0.0:${port}`,
    new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' }),
  );
}
bootstrap();
