import { createApp } from './app';
import { env } from './config/env';
import { connectDb, disconnectDb } from '@shared/database';
import { RedisClient } from '@shared/redis';
import { logger } from '@shared/logger';

async function bootstrap() {
  await connectDb();

  const app = createApp();

  const server = app.listen(env.app.port, () => {
    logger.info(`[${env.app.name}] Running on port ${env.app.port} in ${env.app.nodeEnv} mode`);
    logger.info(`[${env.app.name}] Health: http://localhost:${env.app.port}/api/${env.app.apiVersion}/health`);
  });

  const shutdown = async (signal: string) => {
    logger.info(`\n[${env.app.name}] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await disconnectDb();
      await RedisClient.disconnect();
      logger.info(`[${env.app.name}] Server closed.`);
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('uncaughtException', (err) => {
    logger.error('[FATAL] Uncaught exception:', err);
    process.exit(1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.error('[FATAL] Unhandled rejection:', reason);
    process.exit(1);
  });
}

bootstrap();
