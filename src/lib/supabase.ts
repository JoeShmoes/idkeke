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
        async getUser() {
          return { data: { user: null }, error: null };
        },
        async getSession() {
          return { data: { session: null }, error: null };
        },
        onAuthStateChange() {
            return { data: { subscription: { unsubscribe: () => {} } } };
        },
        async signUp() {
          const error = new Error(
            'Supabase configuration missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
          );
          return { data: { user: null, session: null }, error };
        },
        async signInWithPassword() {
          const error = new Error(
            'Supabase configuration missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
          );
          return { data: { user: null, session: null }, error };
        },
        async resetPasswordForEmail() {
          const error = new Error(
            'Supabase configuration missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
          );
          return { data: null, error };
        },
      },
      from() {
        return {
          select: () => ({ eq: () => ({ single: () => ({ data: null, error: null }), data: [] }) }),
          upsert: () => ({ data: null, error: null }),
        };
      },
      channel() {
        return {
          on: () => ({ subscribe: () => {} }),
        };
      },
      removeChannel() {},
      rpc() {
        return { data: null, error: new Error('Supabase configuration missing.') };
      },
    } as any);
