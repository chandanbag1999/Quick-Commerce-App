import crypto from 'crypto';
import { redis } from '@shared/redis';
import { logger } from '@shared/logger';

export type OtpType = 'EMAIL_VERIFY' | 'PHONE_VERIFY' | 'PASSWORD_RESET';

const TTL: Record<OtpType, number> = {
  EMAIL_VERIFY: 600,
  PHONE_VERIFY: 300,
  PASSWORD_RESET: 900,
};

const MAX_ATTEMPTS = 3;
const COOLDOWN_TTL = 60;
const HOURLY_SEND_LIMIT = 5;

function key(type: OtpType, target: string) {
  return `otp:${type}:${target}`;
}
function cooldownKey(type: OtpType, target: string) {
  return `otp:cooldown:${type}:${target}`;
}
function rateLimitKey(type: OtpType, target: string) {
  return `otp:rate:${type}:${target}`;
}

export const OtpService = {
  generate(): string {
    return String(crypto.randomInt(100000, 999999));
  },

  async canSend(type: OtpType, target: string): Promise<{ allowed: boolean; waitSeconds?: number }> {
    const cooldown = await redis.ttl(cooldownKey(type, target));
    if (cooldown > 0) return { allowed: false, waitSeconds: cooldown };

    const hourlyCount = await redis.get(rateLimitKey(type, target));
    if (hourlyCount && parseInt(hourlyCount, 10) >= HOURLY_SEND_LIMIT) {
      return { allowed: false, waitSeconds: 3600 };
    }

    return { allowed: true };
  },

  async store(type: OtpType, target: string, code: string): Promise<void> {
    const ttl = TTL[type];
    await redis.setex(key(type, target), ttl, `${code}:0`);
    await redis.setex(cooldownKey(type, target), COOLDOWN_TTL, '1');

    const rKey = rateLimitKey(type, target);
    const pipe = redis.pipeline();
    pipe.incr(rKey);
    pipe.expire(rKey, 3600);
    await pipe.exec();

    logger.info(`[OTP] Stored ${type} OTP for ${target} (TTL ${ttl}s)`);
  },

  async verify(type: OtpType, target: string, code: string): Promise<boolean> {
    const stored = await redis.get(key(type, target));
    if (!stored) return false;

    const [storedCode, attemptsStr] = stored.split(':');
    const attempts = parseInt(attemptsStr, 10);

    if (storedCode !== code) {
      if (attempts + 1 >= MAX_ATTEMPTS) {
        await redis.del(key(type, target));
        logger.warn(`[OTP] Max attempts exceeded for ${type}:${target} — key deleted`);
      } else {
        await redis.setex(key(type, target), await redis.ttl(key(type, target)), `${storedCode}:${attempts + 1}`);
      }
      return false;
    }

    await redis.del(key(type, target));
    return true;
  },

  async invalidate(type: OtpType, target: string): Promise<void> {
    await redis.del(key(type, target));
  },
};
