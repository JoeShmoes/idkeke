
'use client';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useState, useEffect } from 'react';
import Clock from '@/components/dashboard/clock';
import { usePathname } from 'next/navigation';
import SearchPalette from './search-palette';
import { Button } from '../ui/button';
import { PanelRightClose, PanelRightOpen, PanelLeft, Settings, PanelLeftClose, PanelRight, Sun, Moon, Brain, ChevronDown, ExternalLink, RefreshCw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { useApp } from './app-provider';
import LevelBar from './level-bar';
import DonationDialog from '@/components/support/donation-dialog';
import { useRouter } from 'next/navigation';
import type { Theme } from '@/lib/types';
import { useHotkeys } from '@/hooks/use-hotkeys-safe';
import Link from 'next/link';
import { RoomStorage } from '@/components/collaboration/storage';
import { availableRooms } from '@/lib/constants';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';

const pageInfo: { [key: string]: { title: string; description: string; } } = {
    '/dashboard': { title: 'Dashboard', description: "A high-level overview of all your modules." },
    '/ai-room': { title: 'Alfred', description: "Your personal AI assistant." },
    '/research': { title: 'Research', description: 'Use AI to search and summarize information from the web.' },
    '/notes': { title: 'Notes', description: 'Create and organize your personal notes and documentation.' },
    '/collaboration': { title: 'Canvas Collaboration', description: 'Free-form infinite whiteboard for solo creation.' },
    '/tasks': { title: 'Tasks Room', description: 'Aggregate and manage all your tasks in one place.' },
    '/project-board': { title: 'Project Board', description: "Manage your high-level projects." },
    '/clients': { title: 'Clients', description: "Manage your client relationships." },
    '/budgeting': { title: 'Budgeting', description: 'Monitor and manage your financial health.' },
    '/asset-tracker': { title: 'Assets', description: "Track your physical, digital, and creative assets." },
    '/brand-room': { title: 'Brand Room', description: "Manage your brand's identity and assets." },
    '/file-vault': { title: 'File Vault', description: "A secure place for your documents and files." },
    '/vilefault': { title: 'VileFault', description: "A secure place for your documents and files." },
    '/sheets': { title: 'Spreadsheets', description: 'Advanced spreadsheet and data management.' },
    '/business': { title: 'Business (Legacy)', description: 'Legacy business overview.' },
    '/health': { title: 'Health', description: 'Track your physical training and wellness.' },
    '/creativity': { title: 'Creativity Tools', description: 'Generate content ideas and more.' },
    '/learning': { title: 'Learning', description: 'Save and track your learning resources.' },
    '/networking': { title: 'Networking', description: 'Manage your professional contacts.' },
    '/calendar': { title: 'Calendar', description: 'View and manage your schedule.' },
    '/mail': { title: 'Mail', description: 'Gmail-powered secure communications.' },
    '/growth-hub': { title: 'Growth Hub', description: 'Track your achievements and unlock perks.' },
    '/server-network-room': { title: 'Server / Network Room', description: "Houses servers, NAS, routers, backups and networking gear." },
    '/forensics-evidence-lab': { title: 'Forensics / Evidence Lab', description: "Analyze physical evidence, document items and run basic lab tests." },
    '/data-ai-lab': { title: 'Data & AI Lab', description: "Run data analysis, ML models, facial/voice recognition prototypes and dashboards." },
    '/communications-secure-briefing-room': { title: 'Communications / Secure Briefing Room', description: "Secure comms and private meetings." },
    '/workshop-fabrication-garage': { title: 'Workshop / Fabrication Garage', description: "Build and repair hardware, gadgets, and drones." },
};


export function Header() {
    const pathname = usePathname();
    const router = useRouter();
    const { appSettings, setAppSettings, toggleRightSidebar, selectedRoom, setSelectedRoom, chats, setIsSettingsOpen } = useApp();
    const { toggleSidebar, state } = useSidebar();
    const [dynamicTitle, setDynamicTitle] = useState<string | null>(null);
    const [mailConnected, setMailConnected] = useState<boolean | null>(null);
    const [excalidrawLive, setExcalidrawLive] = useState<boolean>(false);
    const [excalidrawSave, setExcalidrawSave] = useState<string>('idle');

    useEffect(() => {
        if (!pathname.startsWith('/collaboration/')) return;
        const liveHandler = (e: any) => setExcalidrawLive(e.detail);
        const saveHandler = (e: any) => setExcalidrawSave(e.detail);
        window.addEventListener('excalidraw-live-status', liveHandler);
        window.addEventListener('excalidraw-save-status', saveHandler);
        return () => {
            window.removeEventListener('excalidraw-live-status', liveHandler);
            window.removeEventListener('excalidraw-save-status', saveHandler);
        };
    }, [pathname]);

    useEffect(() => {
        if (pathname !== '/mail') { setMailConnected(null); return; }
        let isMounted = true;
        const check = async () => {
            try {
                const ctrl = new AbortController();
                const t = setTimeout(() => ctrl.abort(), 2000);
                await fetch('http://localhost:3001', { mode: 'no-cors', signal: ctrl.signal, cache: 'no-store' });
                clearTimeout(t);
                if (isMounted) setMailConnected(true);
            } catch {
                if (isMounted) setMailConnected(false);
            }
        };
        check();
        const interval = setInterval(check, 5000);
        return () => { isMounted = false; clearInterval(interval); };
    }, [pathname]);

    const hideRightSidebarRoutes = ['/file-vault', '/communications-secure-briefing-room', '/research'];
    const shouldShowRightSidebar = appSettings.rightSidebar.isOpen && !hideRightSidebarRoutes.some(route => pathname.startsWith(route));

    let { title, description } = pageInfo[pathname] || { title: 'Dashboard', description: "A high-level overview of all your modules." };

    // Dynamic Title Overrides
    if (pathname.startsWith('/collaboration/') && pathname !== '/collaboration') {
        title = dynamicTitle || 'Canvas';
        description = "Collaborative whiteboard session";
    }

    useEffect(() => {
        if (pathname.startsWith('/collaboration/') && pathname !== '/collaboration') {
            const roomId = pathname.split('/').pop();
            if (roomId) {
                // Poll for room name in case it's being created or loaded
                const updateTitle = () => {
                    const room = RoomStorage.getRoom(roomId);
                    if (room) setDynamicTitle(room.name);
                };
                updateTitle();
                // Add listener for storage events to update title if renamed
                window.addEventListener('storage', updateTitle);
                return () => window.removeEventListener('storage', updateTitle);
            }
        } else {
            setDynamicTitle(null);
        }
    }, [pathname]);

    const aiMessageCount = chats.reduce((acc, chat) => acc + chat.messages.length, 0);

    useHotkeys(appSettings.shortcuts.toggleSidebar.keys.join('+'), (e) => { if (e) e.preventDefault(); toggleSidebar() }, { enableOnFormTags: false });

    const handleThemeCycle = () => {
        const currentTheme = appSettings.theme;
        const cycle = appSettings.themeCycle.length > 0 ? appSettings.themeCycle : ['light', 'dark'];
        const currentIndex = cycle.indexOf(currentTheme);
        const nextIndex = (currentIndex + 1) % cycle.length;
        const nextTheme = cycle[nextIndex];
        setAppSettings(prev => ({...prev, theme: nextTheme as Theme}));
    }

    const ThemeIcon = appSettings.theme.includes('dark') || appSettings.theme.includes('matrix') ? Moon : Sun;

    const [donationOpen, setDonationOpen] = useState(false);
    useEffect(() => {
        try {
            const hide = localStorage.getItem('donation_hide_forever') === 'true';
            if (hide) return;
        } catch {}
        let cancelled = false;
        const schedule = () => {
            if (cancelled) return;
            const minutes = Math.floor(Math.random() * (45 - 30 + 1)) + 30;
            const t = setTimeout(() => {
                if (cancelled) return;
                setDonationOpen(true);
                try { localStorage.setItem('donation_last_shown_at', String(Date.now())); } catch {}
                schedule();
            }, minutes * 60 * 1000);
            return t;
        };
        const id = schedule();
        return () => { cancelled = true; if (id) clearTimeout(id as any) };
    }, []);
    useEffect(() => {
        const handler = () => setDonationOpen(true);
        window.addEventListener('openDonationDialog', handler as any);
        return () => window.removeEventListener('openDonationDialog', handler as any);
    }, []);

    return (
        <>
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6 flex-shrink-0">
            <SidebarTrigger className="md:hidden" asChild>
                <Button variant="ghost" size="icon">
                    <PanelLeft />
                </Button>
            </SidebarTrigger>
            <Button variant="ghost" size="icon" className="hidden md:flex" onClick={toggleSidebar} title="Collapse Sidebar">
                {state === 'expanded' ? <PanelLeftClose /> : <PanelRight />}
            </Button>

            <div className="flex-1 min-w-0 pt-0">
                 <div className="flex flex-col items-start justify-center">
                    <div className="flex items-center gap-2">
                        <h1 className="text-sm sm:text-lg font-bold text-foreground truncate leading-none mb-0.5">{title}</h1>
                        {pathname === '/mail' && mailConnected !== null && (
                            mailConnected ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500 mb-0.5" title="Mail server connected" />
                            ) : (
                                <XCircle className="w-4 h-4 text-red-500 mb-0.5" title="Mail server disconnected" />
                            )
                        )}
                        {pathname.startsWith('/collaboration/') && pathname !== '/collaboration' && (
                            <div className="flex items-center gap-2 mb-0.5">
                                <div className={`h-2 w-2 rounded-full ${excalidrawLive ? 'bg-green-500' : 'bg-red-400'}`} title={excalidrawLive ? "Live Sync Active" : "Offline / Local Mode"} />
                                <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground mr-1">
                                    {excalidrawLive ? 'Live' : 'Offline'}
                                </span>
                                {excalidrawSave === 'saving' && (
                                    <div className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded-sm">
                                        <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />
                                        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground">Saving...</span>
                                    </div>
                                )}
                                {excalidrawSave === 'saved' && (
                                    <div className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded-sm">
                                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                                        <span className="text-[10px] sm:text-xs font-medium text-muted-foreground hidden sm:inline">Saved</span>
                                    </div>
                                )}
                                {excalidrawSave === 'error' && (
                                    <div className="flex items-center gap-1 bg-muted/50 px-1.5 py-0.5 rounded-sm">
                                        <XCircle className="w-3 h-3 text-destructive" />
                                        <span className="text-[10px] sm:text-xs font-medium text-destructive hidden sm:inline">Save Failed</span>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                    {(!shouldShowRightSidebar || state !== 'expanded') && (
                        <p className="text-[10px] sm:text-xs text-muted-foreground truncate leading-none pb-2">{description}</p>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {pathname === '/ai-room' && (
                  <div className="flex items-center gap-4 mr-2 border-r pr-4 border-border/40">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm" className="gap-2 h-8">
                            <Brain className="h-4 w-4" />
                            <span className="hidden sm:inline-block max-w-[100px] truncate text-left">
                                {selectedRoom ? availableRooms.find(r => r.id === selectedRoom)?.name : 'All Rooms'}
                            </span>
                            <ChevronDown className="h-3 w-3" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 max-h-[calc(100vh-100px)] overflow-y-auto">
                          <DropdownMenuItem onClick={() => setSelectedRoom(null)}>
                            <Brain className="h-4 w-4 mr-2" />
                            All Rooms
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {availableRooms.map((room) => (
                            <DropdownMenuItem
                              key={room.id}
                              onClick={() => setSelectedRoom(room.id)}
                              className="flex-col items-start"
                            >
                              <div className="font-medium">{room.name}</div>
                              <div className="text-xs text-muted-foreground">{room.description}</div>
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>

                      <div className="text-xs text-muted-foreground whitespace-nowrap hidden sm:block">
                        {aiMessageCount} msgs
                      </div>
                  </div>
                )}
                {pathname === '/mail' && (
                  <div className="flex items-center gap-1 mr-2 border-r pr-3 border-border/40">
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => window.location.reload()} title="Refresh">
                          <RefreshCw className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" asChild title="Open in New Tab">
                          <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                      </Button>
                  </div>
                )}
                <div className="w-full max-w-[80px] min-[400px]:max-w-[120px] sm:max-w-[200px]">
                    <SearchPalette />
                </div>
                <div className="hidden sm:block">
                    <LevelBar />
                </div>
                <div className="hidden md:block">
                    <Clock />
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleThemeCycle}
                    title="Cycle Theme"
                    className="hidden sm:flex"
                >
                    <ThemeIcon />
                </Button>
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => setIsSettingsOpen(true)}
                    title="Settings"
                    className="hidden sm:flex"
                >
                    <Settings />
                </Button>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={toggleRightSidebar}
                    title={appSettings.rightSidebar.isOpen ? "Hide Activity Panel" : "Show Activity Panel"}
                >
                    {appSettings.rightSidebar.isOpen ? <PanelRightClose /> : <PanelRightOpen />}
                </Button>
            </div>
        </header>
        <DonationDialog open={donationOpen} onOpenChange={setDonationOpen} />
        </>
    );
}
