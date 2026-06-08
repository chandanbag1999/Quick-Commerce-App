import winston from 'winston';
import { env } from '@config/env';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack }) => {
  return stack
    ? `${ts} [${level}]: ${message}\n${stack}`
    : `${ts} [${level}]: ${message}`;
});

export const logger = winston.createLogger({
  level: env.log.level,
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    env.app.isDev ? colorize() : winston.format.json(),
    logFormat,
  ),
  transports: [
    new winston.transports.Console(),
    ...(env.app.isProd
      ? [
          new winston.transports.File({ filename: `${env.log.dir}/error.log`, level: 'error' }),
          new winston.transports.File({ filename: `${env.log.dir}/combined.log` }),
        ]
      : []),
  ],
  exitOnError: false,
});
