
'use client';

import AppSidebar from '@/components/layout/app-sidebar';
import { Header } from '@/components/layout/header';
import { SidebarInset } from '@/components/ui/sidebar';
import RightSidebar from '@/components/layout/right-sidebar';
import Tour from '@/components/layout/tour';
import SettingsDialog from '@/components/settings/settings-dialog';
import MobileHeader from '@/components/layout/mobile-header';
import MobileBottomNav from '@/components/layout/mobile-bottom-nav';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useApp } from '@/components/layout/app-provider';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { appSettings, isSettingsOpen, setIsSettingsOpen } = useApp();
  const noPaddingRoutes = ['/mail', '/ai-room', '/notes', '/journal', '/research', '/communications-secure-briefing-room', '/project-board', '/tasks', '/sheets', '/calendar', '/collaboration'];
  const hasPadding = !noPaddingRoutes.some(route => pathname.startsWith(route));
  const disableScrollRoutes = ['/mail', '/sheets', '/ai-room', '/collaboration/', '/notes', '/journal', '/tasks'];
  const isScrollDisabled = disableScrollRoutes.some(route => pathname.startsWith(route));
  const hideRightSidebarRoutes = ['/file-vault', '/communications-secure-briefing-room', '/research'];
  const shouldShowRightSidebar = appSettings?.rightSidebar?.isOpen && !hideRightSidebarRoutes.some(route => pathname.startsWith(route));

    const isMobileOptimizedRoom = ['/notes', '/journal', '/tasks', '/dashboard'].some(route => pathname.startsWith(route));

    return (
        <div className={cn(
            "flex h-full w-full bg-background overflow-hidden flex-col",
        )}>
            {!isMobileOptimizedRoom && <MobileHeader />}
        <div className={cn(
            "flex flex-1 w-full overflow-hidden",
            appSettings?.sidebar?.side === 'right' && 'flex-row-reverse'
        )}>
        <AppSidebar />
        <SidebarInset className="min-w-0 flex-1 flex flex-col h-full overflow-hidden relative">
            <div className="hidden md:block">
                <Header />
            </div>
            <main className={cn(
                "flex-1 flex flex-col min-h-0",
                "md:bg-transparent bg-background/50 sm:bg-transparent md:rounded-none rounded-t-[32px] shadow-[0_-8px_30px_rgb(0,0,0,0.12)] md:shadow-none pb-24 md:pb-0",
                isScrollDisabled ? "overflow-hidden" : "overflow-y-auto", 
                hasPadding && "p-4 sm:p-6 lg:p-8"
            )}>
                {children}
            </main>
        </SidebarInset>
         <div className={cn(
            "h-full transition-all duration-300 ease-in-out flex-shrink-0 border-l bg-background overflow-hidden",
            shouldShowRightSidebar ? "w-full md:w-[350px]" : "w-0",
            "fixed inset-y-0 right-0 z-50 md:static md:z-auto",
            !shouldShowRightSidebar && "translate-x-full md:translate-x-0"
        )}>
            <RightSidebar />
        </div>
        </div>
        <Tour />
        <SettingsDialog isOpen={isSettingsOpen} onOpenChange={setIsSettingsOpen} />
        <MobileBottomNav />
    </div>
  );
}
