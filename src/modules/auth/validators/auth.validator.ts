import { z } from 'zod';

export const sendPhoneOtpSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit Indian mobile number'),
});

export const verifyPhoneSchema = z.object({
  phone: z.string().regex(/^[6-9]\d{9}$/),
  otp: z.string().length(6).regex(/^\d+$/, 'OTP must be 6 digits'),
});

export type SendPhoneOtpDto = z.infer<typeof sendPhoneOtpSchema>;
export type VerifyPhoneDto = z.infer<typeof verifyPhoneSchema>;
