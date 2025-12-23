'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { useApp } from '@/components/layout/app-provider';

export default function Home() {
  const router = useRouter();
  const { userProfile } = useApp();

  useEffect(() => {
    const check = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const isLoggedIn = !!session?.user || !!userProfile?.email;
        router.replace(isLoggedIn ? '/dashboard' : '/login');
      } catch {
        router.replace('/login');
      }
    };
    check();
  }, [router, userProfile]);

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
