import { prisma } from '@shared/database';
import type { User } from '../../../generated/prisma';

export const AuthRepository = {
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { id } });
  },

  async upsertFromSupabase(data: {
    id: string;
    email?: string;
    name?: string;
    avatarUrl?: string;
  }): Promise<User> {
    return prisma.user.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        email: data.email,
        name: data.name,
        avatarUrl: data.avatarUrl,
      },
      update: {
        ...(data.name && { name: data.name }),
        ...(data.avatarUrl && { avatarUrl: data.avatarUrl }),
      },
    });
  },

  async findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findUnique({ where: { phone } });
  },

  async updatePhone(id: string, phone: string): Promise<User> {
    return prisma.user.update({
      where: { id },
      data: { phone, phoneVerified: true },
    });
  },

  async updateProfile(id: string, data: Partial<{ name: string; avatarUrl: string }>): Promise<User> {
    return prisma.user.update({ where: { id }, data });
  },
};
