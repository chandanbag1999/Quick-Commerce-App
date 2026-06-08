import IORedis from 'ioredis';
import { redisConfig } from '@config/redis';
import { logger } from '@shared/logger';

class RedisClient {
  private static instance: IORedis;

  static getInstance(): IORedis {
    if (!RedisClient.instance) {
      RedisClient.instance = new IORedis(redisConfig);

      RedisClient.instance.on('connect', () => logger.info('[Redis] Connected'));
      RedisClient.instance.on('error', (err) => logger.error('[Redis] Error:', err));
      RedisClient.instance.on('close', () => logger.warn('[Redis] Connection closed'));
    }
    return RedisClient.instance;
  }

  static async disconnect(): Promise<void> {
    if (RedisClient.instance) {
      await RedisClient.instance.quit();
      logger.info('[Redis] Disconnected');
    }
  }
}

export const redis = RedisClient.getInstance();
export { RedisClient };
