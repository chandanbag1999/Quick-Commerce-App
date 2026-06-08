import { env } from './env';
import type { RedisOptions } from 'ioredis';

export const redisConfig: RedisOptions = {
  host: env.redis.host,
  port: env.redis.port,
  password: env.redis.password || undefined,
  db: env.redis.db,
  lazyConnect: true,
  retryStrategy: (times: number) => {
    if (times > 10) return null;
    return Math.min(times * 200, 2000);
  },
  enableOfflineQueue: false,
};
