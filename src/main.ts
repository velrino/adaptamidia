import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'verbose'],
    abortOnError: false,
  });

  app.useGlobalFilters(new AllExceptionsFilter());
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  app.enableCors();

  const port = process.env.PORT || 8080;

  // Add more detailed startup logging
  console.log(`Attempting to start server on port ${port}`);
  console.log(`Current environment:`, process.env);

  await app.listen(port, '0.0.0.0', () => {
    console.log(`Server successfully started on http://0.0.0.0:${port}`);
  });

  // Add process handlers for better error visibility
  process.on('unhandledRejection', (reason) => {
    console.error('Unhandled Rejection at:', reason);
  });

  process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception thrown:', error);
  });
}
bootstrap();
