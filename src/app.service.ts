import { Injectable } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';
import { RedisService } from 'src/shared/redis/redis.service';
import { DateTime } from 'luxon';
import { RedisKeysEnum } from './shared/redis/redis.keys';
import {
  HealthCheckServiceName,
  HealthCheckStatus,
  IHealthCheck,
  IHealthCheckResult,
} from './modules/health-check/health-check.dto';
import { CalculateTimeBetweenDates } from './shared/general';
import { RESULT } from './shared/result.enum';
import { Log, LogAction, LogType } from './modules/logs/log.helper';

@Injectable()
export class HealthCheckService {
  constructor(
    @InjectConnection() private readonly mongoConnection: Connection,
    private readonly redisService: RedisService,
  ) {}

  async execute(parameters: IHealthCheck) {
    const start = Date.now();
    const cacheKey = RedisKeysEnum.HEALTH_CHECK_RESULT;

    let result: IHealthCheckResult[];
    let resultIsCache: boolean = false;

    const cache = await this.redisService.get<IHealthCheckResult[]>(cacheKey);

    if (cache && parameters.cache) {
      result = cache;
      resultIsCache = true;
    } else {
      result = [await this.checkMongoDB(), await this.checkRedis()];

      await this.redisService.set(cacheKey, result, 60000); // Cache de 1 minuto

      resultIsCache = false;
    }

    const overallResponseTime = Date.now() - start;

    return {
      time: this.calculateTimeBetweenDates(),
      result_total_time: `${overallResponseTime}ms`,
      result_is_cache: resultIsCache,
      result,
    };
  }

  private calculateTimeBetweenDates() {
    const lastDeploy = process.env.LAST_DEPLOY
      ? DateTime.fromISO(process.env.LAST_DEPLOY)
      : DateTime.now();

    const now = DateTime.now();

    return CalculateTimeBetweenDates(lastDeploy, now);
  }

  private async checkService(
    serviceName: HealthCheckServiceName,
    serviceCheck: () => Promise<any>,
  ): Promise<IHealthCheckResult> {
    const start = Date.now();

    // Timeout wrapper
    const withTimeout = (promise: Promise<any>, ms: number) => {
      return new Promise((resolve, reject) => {
        const timeoutId = setTimeout(
          () => reject(new Error(RESULT.TIMEOUT_EXCEEDED)),
          ms,
        );
        promise
          .then((value) => {
            clearTimeout(timeoutId);
            resolve(value);
          })
          .catch((error) => {
            clearTimeout(timeoutId);
            reject(error instanceof Error ? error : new Error(String(error)));
          });
      });
    };

    try {
      await withTimeout(serviceCheck(), 3000); // 3-second timeout
      const responseTime = Date.now() - start;
      return {
        [serviceName]: {
          status: HealthCheckStatus.UP,
          response_time: `${responseTime}ms`,
        },
      };
    } catch (error) {
      const responseTime = Date.now() - start;
      return {
        [serviceName]: {
          status: HealthCheckStatus.DOWN,
          response_time: `${responseTime}ms`,
          message: error.message,
        },
      };
    }
  }

  private async checkMongoDB(): Promise<IHealthCheckResult> {
    if (!this.mongoConnection.db) {
      return {
        [HealthCheckServiceName.DATABASE]: {
          response_time: `0ms`,
          status: HealthCheckStatus.DOWN,
          message: 'CONNECTION_NOT_ESTABLISHED',
        },
      };
    }

    return this.checkService(HealthCheckServiceName.DATABASE, () =>
      this.mongoConnection.db!.admin().ping(),
    );
  }

  private async checkRedis(): Promise<IHealthCheckResult> {
    return this.checkService(HealthCheckServiceName.CACHE_MANAGER, () =>
      this.redisService.ping(),
    );
  }

  async onApplicationBootstrap2() {
    this.execute({
      cache: true,
    })
      .then((result) => {
        Log(
          LogType.INFO,
          HealthCheckService.name,
          this.onApplicationBootstrap2.name,
          LogAction.SUCCESS,
          {
            result,
          },
        );
      })
      .catch((error) => {
        Log(
          LogType.ERROR,
          HealthCheckService.name,
          this.onApplicationBootstrap2.name,
          LogAction.FAILED,
          {
            error,
          },
        );
      });
  }
}
