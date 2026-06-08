import crypto from 'crypto';
import { Request, Response, NextFunction } from 'express';
import { supabaseAdmin } from '@shared/utils/supabase';
import { redis } from '@shared/redis';
import { UnauthorizedError, ForbiddenError } from '@shared/exceptions';
import type { AuthenticatedRequest, AuthUser } from 'src/types';

const CACHE_TTL = 300; // 5 minutes — short enough to catch revocations

function tokenCacheKey(token: string): string {
  const hash = crypto.createHash('sha256').update(token).digest('hex');
  return `auth:user:${hash}`;
}

// Verifies Supabase access token via supabaseAdmin.auth.getUser().
// Works with ECC P-256 (asymmetric) and any future key type Supabase uses.
// Result is cached in Redis for 5 minutes to avoid a network call on every request.
export async function authenticate(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return next(new UnauthorizedError('Missing token'));

  const token = header.split(' ')[1];
  const cacheKey = tokenCacheKey(token);

  try {
    // 1. Check Redis cache first
    const cached = await redis.get(cacheKey);
    if (cached) {
      (req as AuthenticatedRequest).user = JSON.parse(cached) as AuthUser;
      return next();
    }

    // 2. Verify with Supabase (handles ECC P-256 asymmetric JWT internally)
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) return next(new UnauthorizedError('Invalid or expired token'));

    const authUser: AuthUser = {
      sub: user.id,
      email: user.email ?? '',
      provider: (user.app_metadata?.provider as string) ?? 'email',
      name: user.user_metadata?.full_name ?? user.user_metadata?.name,
      avatarUrl: user.user_metadata?.avatar_url,
    };

    // 3. Cache verified user for 5 minutes
    await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(authUser));

    (req as AuthenticatedRequest).user = authUser;
    next();
  } catch {
    next(new UnauthorizedError('Invalid or expired token'));
  }
}

// Role guard — must run after authenticate + loadDbUser
export function authorize(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const dbUser = (req as AuthenticatedRequest).dbUser;
    if (!dbUser) return next(new UnauthorizedError('User profile not loaded'));
    if (!roles.includes(dbUser.role)) return next(new ForbiddenError('Insufficient permissions'));
    next();
  };
}

export const adminOnly = authorize('ADMIN');
