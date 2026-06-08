import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const optional = (key: string, fallback: string): string =>
  process.env[key] ?? fallback;

export const env = {
  app: {
    nodeEnv: optional('NODE_ENV', 'development'),
    port: parseInt(optional('PORT', '3000'), 10),
    apiVersion: optional('API_VERSION', 'v1'),
    name: optional('APP_NAME', 'GoBasket-API'),
    isDev: optional('NODE_ENV', 'development') === 'development',
    isProd: optional('NODE_ENV', 'development') === 'production',
  },
  supabase: {
    url: optional('SUPABASE_URL', ''),
    serviceRoleKey: optional('SUPABASE_SERVICE_ROLE_KEY', ''),
  },
  redis: {
    host: optional('REDIS_HOST', 'localhost'),
    port: parseInt(optional('REDIS_PORT', '6379'), 10),
    password: optional('REDIS_PASSWORD', ''),
    db: parseInt(optional('REDIS_DB', '0'), 10),
    ttl: parseInt(optional('REDIS_TTL', '3600'), 10),
  },
  rateLimit: {
    windowMs: parseInt(optional('RATE_LIMIT_WINDOW_MS', '900000'), 10),
    max: parseInt(optional('RATE_LIMIT_MAX', '100'), 10),
  },
  log: {
    level: optional('LOG_LEVEL', 'debug'),
    dir: optional('LOG_DIR', 'logs'),
  },
  cors: {
    origins: optional('CORS_ORIGINS', 'http://localhost:3000').split(','),
  },
} as const;

export type Env = typeof env;
