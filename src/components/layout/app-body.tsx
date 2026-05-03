
'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/components/layout/app-provider';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import GlobalContextMenu from './global-context-menu';
import { SidebarProvider } from '../ui/sidebar';
import { HoverProvider } from './hover-context';
import { Loader2 } from 'lucide-react';
import { CommandPaletteProvider } from './search-palette';
import { useSound } from '@/hooks/use-sound';
import CalendarNotifications from '@/components/calendar/CalendarNotifications';
import TaskNotifications from '@/components/tasks/TaskNotifications';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { supabase } from '@/lib/supabase';

import WindowControls from '../ui/window-controls';
import AddTaskDialog from '../tasks/add-task-dialog';
import AddNoteDialog from '../notes/add-note-dialog';
import { useToast } from '@/hooks/use-toast';

export default function AppBody({ children }: { children: React.ReactNode }) {
    const { appSettings, loading, isDataLoaded, welcomePlayed, setWelcomePlayed, taskGroups, setTasks, isAddTaskOpen, setIsAddTaskOpen, isAddNoteOpen, setIsAddNoteOpen, notes, setNotes } = useApp();
    const { playSound } = useSound();
    const { toast } = useToast();
    const { subscribe } = usePushNotifications();

    // Register Service Worker and subscribe to Web Push for background notifications
    useEffect(() => {
        if ('serviceWorker' in navigator && typeof window !== 'undefined') {
            const registerSW = async () => {
                try {
                    const registration = await navigator.serviceWorker.register('/service-worker.js');
                    console.log('[SW] Registered with scope:', registration.scope);

                    // Only request notification permission and subscribe if the user is logged in
                    // This prevents the permission prompt from appearing on the login/signup pages
                    const NotificationApi = typeof window !== 'undefined' ? (window as any).Notification : undefined;
                    if (NotificationApi) {
                        const { data: { session } } = await supabase.auth.getSession();
                        if (session?.user) {
                            if (NotificationApi.permission === 'default') {
                                await NotificationApi.requestPermission();
                            }
                            if (NotificationApi.permission === 'granted') {
                                // Subscribe (stores in Supabase so server can push while app is closed)
                                await subscribe();
                            }
                        }
                    }
                } catch (error) {
                    console.error('[SW] Registration failed:', error);
                }
            };
            registerSW();
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const [isDesktop, setIsDesktop] = useState(false);
    useEffect(() => {
        if (typeof navigator !== 'undefined' && navigator.userAgent.includes('NexarisDesktop')) {
            setIsDesktop(true);
        }
    }, []);
  
    // This effect safely applies the theme on the client side after hydration
    useEffect(() => {
      if (isDataLoaded) {
        const root = window.document.documentElement;
        
        // Remove all theme classes
        root.classList.remove('light', 'dark');
        const themeClasses = Array.from(root.classList).filter(c => c.startsWith('theme-'));
        root.classList.remove(...themeClasses);

        let activeTheme = appSettings.theme;
        if (activeTheme === 'system') {
          activeTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }

        // Add the current theme class
        root.classList.add(activeTheme);

        // Optional: listen for system theme changes if set to system
        if (appSettings.theme === 'system') {
          const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
          const handleChange = (e: MediaQueryListEvent) => {
            root.classList.remove('light', 'dark');
            root.classList.add(e.matches ? 'dark' : 'light');
          };
          mediaQuery.addEventListener('change', handleChange);
          return () => mediaQuery.removeEventListener('change', handleChange);
        }
      }
    }, [appSettings.theme, isDataLoaded]);

    useEffect(() => {
      if (isDataLoaded && !welcomePlayed) {
        setWelcomePlayed(true);
      }
    }, [isDataLoaded, welcomePlayed, setWelcomePlayed]);

    if(loading) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background gap-4">
            <WindowControls />
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-muted-foreground">Loading Workspace...</p>
        </div>
      )
    }

    return (
        <div 
            className={cn("font-sans antialiased h-screen flex flex-col overflow-hidden gap-[10px]", "bg-background")}
            style={{ 
                paddingTop: isDesktop ? "32px" : "0px" 
            } as React.CSSProperties}
        >
          <WindowControls />
          <div className="flex-1 flex flex-col overflow-hidden relative">
            <CommandPaletteProvider>
                <HoverProvider>
                    <SidebarProvider>
                        <GlobalContextMenu>
                            <div className={cn(!loading ? 'opacity-100 transition-opacity duration-300' : 'opacity-0', 'h-full w-full')}>
                                {children}
                            </div>
                            <CalendarNotifications />
                            <TaskNotifications />
                        </GlobalContextMenu>
                    </SidebarProvider>
                </HoverProvider>
            </CommandPaletteProvider>
          </div>
          <AddTaskDialog 
            isOpen={isAddTaskOpen} 
            onOpenChange={setIsAddTaskOpen} 
            onAddTask={(task) => {
              setTasks(prev => [{ ...task, id: Date.now().toString(), createdAt: new Date().toISOString(), completed: false }, ...prev]);
              toast({ title: "Task Created", description: "Your global task has been added." });
            }}
            groups={taskGroups}
          />
          <AddNoteDialog
            isOpen={isAddNoteOpen}
            onOpenChange={setIsAddNoteOpen}
            onAddNote={(note) => {
                setNotes(prev => [{ ...note, id: Date.now().toString(), createdAt: new Date().toISOString(), lastModified: new Date().toISOString() }, ...prev]);
                toast({ title: "Note Created", description: "Your global note has been added." });
            }}
          />
          <Toaster />
        </div>
    );
}
