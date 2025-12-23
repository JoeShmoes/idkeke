import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (process.env.supabase_url as string) ||
  '';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (process.env.supabase_anon as string) ||
  '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

