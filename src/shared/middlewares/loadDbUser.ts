import { Request, Response, NextFunction } from 'express';
import { prisma } from '@shared/database';
import { AuthService } from '@modules/auth/services/auth.service';
import type { AuthenticatedRequest } from 'src/types';

// Run after authenticate() on routes that need role-based access or full user profile.
// Auto-creates the user row if this is their first API call.
export async function loadDbUser(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const { user } = req as AuthenticatedRequest;
    const dbUser = await AuthService.syncProfile(user);
    (req as AuthenticatedRequest).dbUser = dbUser;
    next();
  } catch (err) {
    next(err);
  }
}
