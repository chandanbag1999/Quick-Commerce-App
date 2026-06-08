import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '@shared/guards/auth.guard';

const phoneRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests, please try again in 15 minutes.' },
});

export function authRouter(): Router {
  const router = Router();

  // All auth routes require a valid Supabase token
  router.use(authenticate);

  router.get('/me', AuthController.me);
  router.post('/send-phone-otp', phoneRateLimit, AuthController.sendPhoneOtp);
  router.post('/verify-phone', AuthController.verifyPhone);

  return router;
}
