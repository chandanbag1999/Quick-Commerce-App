import { createClient } from '@supabase/supabase-js';
import { env } from '@config/env';

// Admin client — never expose this key to frontend
export const supabaseAdmin = createClient(
  env.supabase.url,
  env.supabase.serviceRoleKey,
  { auth: { autoRefreshToken: false, persistSession: false } },
);
