import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (process.env.supabase_url as string) ||
  '';

const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (process.env.supabase_anon as string) ||
  '';

const configured = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = configured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : ({
      auth: {
        async getSession() {
          return { data: { session: null } };
        },
        async signUp() {
          throw new Error(
            'Supabase configuration missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
          );
        },
        async signInWithPassword() {
          throw new Error(
            'Supabase configuration missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
          );
        },
        async resetPasswordForEmail() {
          throw new Error(
            'Supabase configuration missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
          );
        },
      },
    } as any);
