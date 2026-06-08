import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '@shared/utils/response';
import { ValidationError } from '@shared/exceptions';
import type { AuthenticatedRequest } from 'src/types';
import { sendPhoneOtpSchema, verifyPhoneSchema } from '../validators/auth.validator';

function validate<T extends object>(
  schema: { safeParse: (d: unknown) => { success: boolean; data?: T; error?: { flatten: () => { fieldErrors: Record<string, string[]> } } } },
  data: unknown,
): T {
  const r = schema.safeParse(data);
  if (!r.success) throw new ValidationError(r.error!.flatten().fieldErrors as Record<string, string[]>);
  return r.data!;
}

export const AuthController = {
  // GET /auth/me — returns current user's app profile (auto-creates on first call)
  me: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { user } = req as AuthenticatedRequest;
      const profile = await AuthService.syncProfile(user);
      return sendSuccess(res, profile, 'Profile fetched');
    } catch (err) { next(err); }
  },

  // POST /auth/send-phone-otp
  sendPhoneOtp: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = validate(sendPhoneOtpSchema, req.body);
      const { user } = req as AuthenticatedRequest;
      const result = await AuthService.sendPhoneOtp(dto, user.sub);
      return sendSuccess(res, Object.keys(result).length ? result : null, 'OTP sent to your phone');
    } catch (err) { next(err); }
  },

  // POST /auth/verify-phone
  verifyPhone: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = validate(verifyPhoneSchema, req.body);
      const { user } = req as AuthenticatedRequest;
      await AuthService.verifyPhone(dto, user.sub);
      return sendSuccess(res, null, 'Phone number verified successfully');
    } catch (err) { next(err); }
  },
};
