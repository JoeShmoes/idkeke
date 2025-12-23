
'use client';

import { useEffect } from 'react';
import { useApp } from '@/components/layout/app-provider';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import GlobalContextMenu from './global-context-menu';
import { SidebarProvider } from '../ui/sidebar';
import { HoverProvider } from './hover-context';
import { Loader2 } from 'lucide-react';
import { CommandPaletteProvider } from './search-palette';
import { useSound } from '@/hooks/use-sound';

export default function AppBody({ children }: { children: React.ReactNode }) {
    const { appSettings, loading, isDataLoaded, welcomePlayed, setWelcomePlayed } = useApp();
    const { playSound } = useSound();
  
    // This effect safely applies the theme on the client side after hydration
    useEffect(() => {
      if (isDataLoaded) {
        const root = window.document.documentElement;
        
        // Remove all theme classes
        root.classList.remove('light', 'dark');
        const themeClasses = Array.from(root.classList).filter(c => c.startsWith('theme-'));
        root.classList.remove(...themeClasses);

        // Add the current theme class
        root.classList.add(appSettings.theme);
      }
    }, [appSettings.theme, isDataLoaded]);

    useEffect(() => {
      if (isDataLoaded && !welcomePlayed) {
        playSound('welcome');
        setWelcomePlayed(true);
      }
    }, [isDataLoaded, welcomePlayed, playSound, setWelcomePlayed]);

    if(loading) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background gap-4">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Loading Workspace...</p>
        </div>
      )
    }

    return (
        <div className={cn("font-sans antialiased min-h-screen", "bg-background")}>
          <CommandPaletteProvider>
            <HoverProvider>
                <SidebarProvider>
                  <GlobalContextMenu>
                    <div className={cn(!loading ? 'opacity-100 transition-opacity duration-500' : 'opacity-0', 'min-h-screen')}>
                      {children}
                    </div>
                  </GlobalContextMenu>
                </SidebarProvider>
            </HoverProvider>
          </CommandPaletteProvider>
            <Toaster />
        </div>
    );
  };
