'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Home, Calendar as CalendarIcon, ClipboardList, Search, X, Notebook, Lock, PenLine } from 'lucide-react';
import Logo from '@/components/logo';
import { cn } from '@/lib/utils';
import { useApp } from '@/components/layout/app-provider';
import MobileSearch from './mobile-search';

const navItems = [
    { href: '/dashboard', label: 'Overview', icon: Home, isLogo: false },
    { href: '/tasks',     label: 'Tasks',     icon: ClipboardList, isLogo: false },
    { href: '/notes',     label: 'Notes',     icon: Notebook, isLogo: false },
    { href: '/journal',   label: 'Journal',   icon: PenLine, isLogo: false },
];

export default function MobileBottomNav() {
    const { isNavHidden, setIsNavHidden } = useApp();
    const pathname = usePathname();
    const router = useRouter();
    const [searchOpen, setSearchOpen] = useState(false);
    const [isDark, setIsDark] = useState(false);

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

    // Enhanced Liquid glass style
    const glassStyle: React.CSSProperties = isDark ? {
        background: 'linear-gradient(165deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.03) 100%)',
        backdropFilter: 'blur(32px) saturate(210%)',
        WebkitBackdropFilter: 'blur(32px) saturate(210%)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderTop: '1px solid rgba(255,255,255,0.22)',
        boxShadow: [
            '0 20px 50px rgba(0,0,0,0.60)',
            'inset 0 1px 1px rgba(255,255,255,0.15)',
            'inset 0 -1px 1px rgba(0,0,0,0.40)',
        ].join(', '),
    } : {
        background: 'linear-gradient(165deg, rgba(255,255,255,0.85) 0%, rgba(245,248,255,0.75) 100%)',
        backdropFilter: 'blur(32px) saturate(210%)',
        WebkitBackdropFilter: 'blur(32px) saturate(210%)',
        border: '1px solid rgba(255,255,255,0.60)',
        borderTop: '1px solid rgba(255,255,255,0.95)',
        boxShadow: [
            '0 20px 50px rgba(0,0,0,0.08)',
            'inset 0 1px 1px rgba(255,255,255,1)',
            'inset 0 -1px 1px rgba(0,0,0,0.02)',
        ].join(', '),
    };

    const activeChipStyle: React.CSSProperties = isDark ? {
        background: 'rgba(255,255,255,0.12)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 12px rgba(0,0,0,0.2)',
    } : {
        background: 'rgba(0,0,0,0.05)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.8), 0 4px 12px rgba(0,0,0,0.05)',
    };

    return (
        <>
            <MobileSearch open={searchOpen} onClose={() => setSearchOpen(false)} />

            {/* Restore Handle (when hidden) */}
            <div 
                className={cn(
                    "fixed bottom-2 left-1/2 -translate-x-1/2 h-1.5 w-14 rounded-full bg-zinc-400/30 dark:bg-white/20 z-[250] md:hidden transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
                    isNavHidden ? "opacity-100 scale-100 translate-y-0 pointer-events-auto cursor-pointer" : "opacity-0 scale-50 translate-y-4 pointer-events-none"
                )}
                onClick={() => setIsNavHidden(false)}
            />

            <div className={cn(
                "fixed bottom-6 left-0 right-0 flex items-center justify-center gap-3 z-[200] md:hidden pointer-events-none transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]",
                isNavHidden ? "translate-y-40 opacity-0 scale-95" : "translate-y-0 opacity-100 scale-100"
            )}>

                <div
                    className="flex items-center px-4 py-3 gap-3 md:gap-6 rounded-[40px] pointer-events-auto max-w-[calc(100vw-100px)] overflow-x-auto no-scrollbar"
                    style={{ ...glassStyle, WebkitOverflowScrolling: 'touch' }}
                >
                    {navItems.map((item) => {
                        const isActive = pathname?.startsWith(item.href) && !searchOpen;
                        const Icon = item.icon;
                        return (
                            <button
                                key={item.href}
                                onClick={() => { setSearchOpen(false); router.push(item.href); }}
                                className="flex flex-col items-center justify-center gap-[3px] transition-all duration-300 active:scale-90 min-w-[44px] group"
                            >
                                <div
                                    className="h-8 w-8 rounded-[14px] flex items-center justify-center transition-all duration-300 group-hover:scale-110"
                                    style={isActive ? activeChipStyle : {}}
                                >
                                    {item.isLogo ? (
                                        <Logo className={cn('h-[22px] w-[22px] transition-all', isActive ? 'text-foreground' : 'text-muted-foreground')} />
                                    ) : (
                                        Icon && (
                                            <Icon
                                                className={cn('h-[22px] w-[22px] transition-all', isActive ? 'text-foreground' : 'text-muted-foreground')}
                                                strokeWidth={isActive ? 2.5 : 2}
                                            />
                                        )
                                    )}
                                </div>
                                <span className={cn('text-[9px] font-black uppercase tracking-[0.05em] transition-all', isActive ? 'text-foreground opacity-100' : 'text-muted-foreground opacity-40 group-hover:opacity-100')}>
                                    {item.label}
                                </span>
                            </button>
                        );
                    })}
                </div>

                {/* ── Liquid Glass Search Button ── */}
                <button
                    onClick={() => setSearchOpen(v => !v)}
                    className="h-[58px] w-[58px] rounded-full flex items-center justify-center pointer-events-auto transition-all duration-300 active:scale-90 hover:scale-105"
                    style={glassStyle}
                >
                    {searchOpen ? (
                        <X className="h-[22px] w-[22px] text-foreground" strokeWidth={2.5} />
                    ) : (
                        <Search className="h-[22px] w-[22px] text-muted-foreground" strokeWidth={2} />
                    )}
                </button>
            </div>
        </>
    );
}
