
'use client';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { useState, useEffect } from 'react';
import Clock from '@/components/dashboard/clock';
import { usePathname } from 'next/navigation';
import SearchPalette from './search-palette';
import { Button } from '../ui/button';
import { PanelRightClose, PanelRightOpen, PanelLeft, Settings, PanelLeftClose, PanelRight, Sun, Moon } from 'lucide-react';
import { useApp } from './app-provider';
import LevelBar from './level-bar';
import DonationDialog from '@/components/support/donation-dialog';
import { useRouter } from 'next/navigation';
import type { Theme } from '@/lib/types';
import { useHotkeys } from '@/hooks/use-hotkeys-safe';
import Link from 'next/link';

const pageInfo: { [key: string]: { title: string; description: string; } } = {
    '/dashboard': { title: 'Dashboard', description: "A high-level overview of all your modules." },
    '/ai-room': { title: 'Alfred', description: "Your personal AI assistant." },
    '/research': { title: 'Research', description: 'Use AI to search and summarize information from the web.' },
    '/notes': { title: 'Notes', description: 'Your personal knowledge base. Create, edit, and organize your thoughts.' },
    '/canvas': { title: 'Canvas', description: 'Free-form infinite whiteboard for solo creation.' },
    '/tasks': { title: 'Tasks Room', description: 'Aggregate and manage all your tasks in one place.' },
    '/project-board': { title: 'Project Board', description: "Manage your high-level projects." },
    '/clients': { title: 'Clients', description: "Manage your client relationships." },
    '/finance': { title: 'Finance', description: 'Monitor and manage your financial health.' },
    '/asset-tracker': { title: 'Assets', description: "Track your physical, digital, and creative assets." },
    '/brand-room': { title: 'Brand Room', description: "Manage your brand's identity and assets." },
    '/file-vault': { title: 'File Vault', description: "A secure place for your documents and files." },
    '/vilefault': { title: 'VileFault', description: "A secure place for your documents and files." },
    '/sheets': { title: 'Sheets', description: 'Upload and edit spreadsheets.' },
    '/business': { title: 'Business (Legacy)', description: 'Legacy business overview.' },
    '/health': { title: 'Health', description: 'Track your physical training and wellness.' },
    '/creativity': { title: 'Creativity Tools', description: 'Generate content ideas and more.' },
    '/learning': { title: 'Learning', description: 'Save and track your learning resources.' },
    '/networking': { title: 'Networking', description: 'Manage your professional contacts.' },
    '/settings': { title: 'Settings', description: 'Manage your application and workspace settings.' },
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
    const { appSettings, setAppSettings, toggleRightSidebar } = useApp();
    const { toggleSidebar, state } = useSidebar();
    const { title } = pageInfo[pathname] || { title: 'Dashboard' };

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

            <div className="flex-1 min-w-0">
                 <div className="text-left">
                    <h1 className="text-xl font-semibold text-foreground truncate">{title}</h1>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-52">
                    <SearchPalette />
                </div>
                <LevelBar />
                <Clock />
                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={handleThemeCycle}
                    title="Cycle Theme"
                >
                    <ThemeIcon />
                </Button>
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => router.push('/settings')}
                    title="Settings"
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
