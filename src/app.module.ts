import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { HttpMiddleware } from './middleware/http.middleware';
import { RedisModule } from './shared/redis/redis.module';
import { AuthModule } from './modules/auth/auth.module';
import { PusherModule } from './shared/pusher/pusher.module';
import { UserModule } from './modules/user/user.module';
import { CompanyModule } from './modules/company/company.module';
import { CompanyUnitModule } from './modules/company-unit/company-unit.module';
import { AdvertisementModule } from './modules/advertisement/advertisement.module';
import { AdvertisementMetricsModule } from './modules/advertisement-metrics/advertisement-metrics.module';
import { NewsModule } from './modules/news/news.module';
import { FilesModule } from './modules/files/files.module';
import { ScheduleModule } from '@nestjs/schedule';
import { DisplayLogsModule } from './modules/display-logs/display-logs.module';
import { BullModule } from '@nestjs/bull';
import { QueueModule } from './modules/queue/queue.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { WeatherModule } from './modules/weather/weather.module';
import { DisplayModule } from './modules/display/display.module';
import { LeadsModule } from './modules/leads/leads.module';
import { HealthCheckService } from './app.service';
import { DetectionService } from './shared/detection/detection.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 300000, // Time-to-live in milliseconds: The rate limit counter will reset every 60 seconds (1 minute) = 60000
        limit: 10, // Maximum number of requests allowed within the TTL period
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    /*
     * MongoDB
     */
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const uri = await Promise.resolve(
          configService.get<string>('MONGO_URI'),
        );
        return { uri };
      },
      inject: [ConfigService],
    }),
    /*
     * Bull com Redis para fila
     */
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    QueueModule,
    ScheduleModule.forRoot(),
    NewsModule,
    DashboardModule,
    RedisModule,
    PusherModule,
    DisplayModule,
    AuthModule,
    AdvertisementModule,
    AdvertisementMetricsModule,
    CompanyModule,
    CompanyUnitModule,
    DisplayLogsModule,
    FilesModule,
    UserModule,
    WeatherModule,
    LeadsModule,
  ],
  controllers: [AppController],
  providers: [HealthCheckService, DetectionService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HttpMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
