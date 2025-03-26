import { createHash } from 'crypto';
import { Injectable, Inject } from '@nestjs/common';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { RedisKeysEnum } from './redis.keys';

@Injectable()
export class RedisService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {}

  createKeyByObject(index: string, obj: Record<string, any>) {
    const parameters_encrypted = createHash('sha256')
      .update(String(JSON.stringify(obj)))
      .digest('hex');

    return {
      name: `${index.toUpperCase()}_${parameters_encrypted}`,
      parameters_encrypted,
    };
  }

  prepareCacheKey(prefix: string, ...args: string[]): string {
    return `${prefix}:${args.map(String).join(':')}`.toUpperCase();
  }

  async set(key: string, value: any, ttl: number) {
    return await this.cacheManager.set(key, value, ttl);
  }

  async get<T>(key: string): Promise<T | null> {
    return this.cacheManager.get<T>(key);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async ping(): Promise<string> {
    try {
      const key = RedisKeysEnum.HEALTH_CHECK_PING;
      await this.cacheManager.set(key, 'pong', 10);
      const result = await this.cacheManager.get(key);
      return result === 'pong' ? 'PONG' : 'ERROR';
    } catch (error) {
      throw new Error('Redis ping failed');
    }
  }
}
