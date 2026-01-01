
'use client';

import AppSidebar from '@/components/layout/app-sidebar';
import { Header } from '@/components/layout/header';
import { SidebarInset } from '@/components/ui/sidebar';
import RightSidebar from '@/components/layout/right-sidebar';
import Tour from '@/components/layout/tour';
import GlobalContextMenu from '@/components/ui/global-context-menu';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useApp } from '@/components/layout/app-provider';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { appSettings, userProfile } = useApp();
  const noPaddingRoutes = ['/ai-room', '/notes', '/research', '/settings', '/communications-secure-briefing-room', '/project-board', '/tasks', '/sheets'];
  const hasPadding = !noPaddingRoutes.some(route => pathname.startsWith(route));
  const disableScrollRoutes = ['/sheets', '/ai-room'];
  const isScrollDisabled = disableScrollRoutes.some(route => pathname.startsWith(route));
  const hideRightSidebarRoutes = ['/file-vault', '/communications-secure-briefing-room', '/research'];
  const shouldShowRightSidebar = appSettings.rightSidebar.isOpen && !hideRightSidebarRoutes.some(route => pathname.startsWith(route));

  useEffect(() => {
    const enforceAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const isLoggedIn = !!session?.user || !!userProfile?.email;
        if (!isLoggedIn) {
          router.replace('/login');
        }
      } catch {
        router.replace('/login');
      }
    };
    enforceAuth();
  }, [router, userProfile]);

  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.userAgent.includes('NexarisDesktop')) {
      setIsDesktop(true);
    }
  }, []);

  return (
    <div className={cn(
        "flex h-full w-full bg-background overflow-hidden flex-col",
    )}>
        <div className={cn(
            "flex flex-1 w-full overflow-hidden",
            appSettings.sidebar.side === 'right' && 'flex-row-reverse'
        )}>
        <AppSidebar />
        <SidebarInset className={cn(isScrollDisabled && "h-screen overflow-hidden")}>
            <div className="flex-1 h-full flex flex-col min-w-0">
                <Header />
                <main className={cn(
                    "flex-1 flex flex-col min-h-0",
                    isScrollDisabled ? "overflow-hidden" : "overflow-y-auto", 
                    hasPadding && "p-4 sm:p-6 lg:p-8"
                )}>
                    {children}
                </main>
            </div>
        </SidebarInset>
         <div className={cn(
            "h-full transition-all duration-300 ease-in-out flex-shrink-0",
            shouldShowRightSidebar ? "w-80" : "w-0",
            appSettings.sidebar.side === 'left' ? 'border-l' : 'border-r'
        )}>
            <RightSidebar />
        </div>
        </div>
        <Tour />
    </div>
  );
}
