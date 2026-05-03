'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useApp } from './app-provider';
import Logo from '@/components/logo';
import { User, X } from 'lucide-react';
import { RoomStorage } from '@/components/collaboration/storage';

const pageInfo: { [key: string]: string } = {
    '/dashboard': 'Overview',
    '/ai-room': 'Alfred',
    '/research': 'Research',
    '/notes': 'Notes',
    '/collaboration': 'Canvas',
    '/tasks': 'Tasks',
    '/project-board': 'Projects',
    '/clients': 'Clients',
    '/budgeting': 'Budgeting',
    '/asset-tracker': 'Assets',
    '/file-vault': 'File Vault',
    '/vilefault': 'VileFault',
    '/sheets': 'Spreadsheets',
    '/health': 'Health',
    '/learning': 'Learning',
    '/networking': 'Networking',
    '/calendar': 'Calendar',
    '/mail': 'Mail',
    '/growth-hub': 'Growth Hub',
    '/communications-secure-briefing-room': 'Comms Room',
};

export default function MobileHeader() {
    const pathname = usePathname();
    const { setIsSettingsOpen, isSettingsOpen } = useApp();
    const [dynamicTitle, setDynamicTitle] = useState<string | null>(null);
    const [isDark, setIsDark] = useState(false);

    // Detect theme
    useEffect(() => {
        const check = () => setIsDark(
            document.documentElement.classList.contains('dark') ||
            document.documentElement.className.includes('dark')
        );
        check();
        const observer = new MutationObserver(check);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    // Resolve page title
    const base = '/' + (pathname?.split('/')[1] ?? '');
    let title = pageInfo[pathname || '/dashboard'] ?? pageInfo[base] ?? 'Overview';
    if (pathname?.startsWith('/collaboration/') && pathname !== '/collaboration') {
        title = dynamicTitle || 'Canvas';
    }

    useEffect(() => {
        if (pathname?.startsWith('/collaboration/') && pathname !== '/collaboration') {
            const roomId = pathname.split('/').pop();
            if (roomId) {
                const upd = () => { const r = RoomStorage.getRoom(roomId); if (r) setDynamicTitle(r.name); };
                upd();
                window.addEventListener('storage', upd);
                return () => window.removeEventListener('storage', upd);
            }
        } else { setDynamicTitle(null); }
    }, [pathname]);

    // Liquid glass button style
    const btnStyle: React.CSSProperties = isDark ? {
        background: 'linear-gradient(145deg, rgba(255,255,255,0.12) 0%, rgba(255,255,255,0.05) 100%)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.18)',
        borderTop: '1px solid rgba(255,255,255,0.30)',
        boxShadow: [
            '0 4px 16px rgba(0,0,0,0.40)',
            'inset 0 2px 0 rgba(255,255,255,0.20)',
            'inset 0 -1px 0 rgba(0,0,0,0.15)',
        ].join(', '),
    } : {
        background: 'linear-gradient(145deg, rgba(255,255,255,0.92) 0%, rgba(240,245,255,0.80) 100%)',
        backdropFilter: 'blur(30px) saturate(180%)',
        WebkitBackdropFilter: 'blur(30px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.75)',
        borderTop: '1px solid rgba(255,255,255,1)',
        boxShadow: [
            '0 4px 16px rgba(0,0,0,0.08)',
            'inset 0 2px 0 rgba(255,255,255,1)',
            'inset 0 -1px 0 rgba(0,0,0,0.04)',
        ].join(', '),
    };

    return (
        <header className="sticky top-0 z-50 flex h-20 items-center justify-between px-5 md:hidden flex-shrink-0 bg-transparent">
            {/* Profile / Close button */}
            <button
                className="h-10 w-10 rounded-full flex items-center justify-center transition-all duration-200 active:scale-90"
                style={btnStyle}
                onClick={() => setIsSettingsOpen(!isSettingsOpen)}
            >
                {isSettingsOpen
                    ? <X className="h-5 w-5 text-foreground" strokeWidth={2.5} />
                    : <User className="h-5 w-5 text-foreground" strokeWidth={1.75} />
                }
            </button>

            {/* Centered page title */}
            <h1 className="absolute left-1/2 -translate-x-1/2 text-[22px] font-bold text-foreground tracking-tight pointer-events-none">
                {title}
            </h1>

            {/* App logo */}
            <div
                className="h-10 w-10 rounded-full flex items-center justify-center"
                style={btnStyle}
            >
                <Logo className="h-6 w-6 text-foreground" />
            </div>
        </header>
    );
}
