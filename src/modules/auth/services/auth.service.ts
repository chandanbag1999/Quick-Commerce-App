import { AuthRepository } from '../repositories/auth.repository';
import { OtpService } from '@shared/utils/otp';
import { BadRequestError, ConflictError } from '@shared/exceptions';
import { env } from '@config/env';
import type { AuthUser } from 'src/types';
import type { SendPhoneOtpDto, VerifyPhoneDto } from '../validators/auth.validator';

export const AuthService = {
  // Called on every authenticated request — ensures user row exists in our DB.
  // Safe to call on every request (upsert is idempotent).
  async syncProfile(authUser: AuthUser) {
    return AuthRepository.upsertFromSupabase({
      id: authUser.sub,
      email: authUser.email,
      name: authUser.name,
      avatarUrl: authUser.avatarUrl,
    });
  },

  async getProfile(id: string) {
    return AuthRepository.findById(id);
  },

  async sendPhoneOtp(dto: SendPhoneOtpDto, userId: string): Promise<{ devOtp?: string }> {
    const check = await OtpService.canSend('PHONE_VERIFY', dto.phone);
    if (!check.allowed) {
      throw new BadRequestError(
        `Please wait ${check.waitSeconds} seconds before requesting a new OTP`,
      );
    }

    const existing = await AuthRepository.findByPhone(dto.phone);
    if (existing && existing.id !== userId) throw new ConflictError('Phone number');

    const otp = OtpService.generate();
    await OtpService.store('PHONE_VERIFY', dto.phone, otp);

    if (env.app.isDev) {
      return { devOtp: otp };
    }

    // PRODUCTION: swap in real SMS service here
    // await SmsService.send(dto.phone, `Your GoBasket OTP is ${otp}. Valid 5 minutes.`);
    return {};
  },

  async verifyPhone(dto: VerifyPhoneDto, userId: string): Promise<void> {
    const valid = await OtpService.verify('PHONE_VERIFY', dto.phone, dto.otp);
    if (!valid) throw new BadRequestError('Invalid or expired OTP. Check the code and try again.');

    const existing = await AuthRepository.findByPhone(dto.phone);
    if (existing && existing.id !== userId) throw new ConflictError('Phone number');

    await AuthRepository.updatePhone(userId, dto.phone);
  },
};
