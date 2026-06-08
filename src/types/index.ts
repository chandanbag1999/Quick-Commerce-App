import { Request } from 'express';
import type { User } from '../generated/prisma';

// Supabase JWT payload shape (what Supabase puts in every access token)
export interface SupabaseJwtPayload {
  aud: string;
  exp: number;
  iat: number;
  iss: string;
  sub: string;
  email?: string;
  role: string;
  app_metadata: {
    provider: string;
    providers: string[];
  };
  user_metadata: {
    name?: string;
    full_name?: string;
    avatar_url?: string;
  };
}

// What we attach to req.user after token verification
export interface AuthUser {
  sub: string;       // Supabase user UUID
  email: string;
  provider: string;  // 'google' | 'email'
  name?: string;
  avatarUrl?: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
  dbUser?: User;     // populated by loadDbUser middleware when needed
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
