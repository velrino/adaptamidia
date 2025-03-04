import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
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
import { AdvertisementCampaignModule } from './modules/advertisement-campaign/advertisement-campaign.module';
import { NewsModule } from './modules/news/news.module';

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
    NewsModule,
    RedisModule,
    PusherModule,
    AuthModule,
    AdvertisementModule,
    AdvertisementCampaignModule,
    CompanyModule,
    CompanyUnitModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(HttpMiddleware)
      .forRoutes({ path: '*', method: RequestMethod.ALL });
  }
}
