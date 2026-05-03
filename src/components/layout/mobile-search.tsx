'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Home, 
  Calendar as CalendarIcon, 
  ClipboardList, 
  FileText, 
  Lock, 
  ArrowRight, 
  Settings as SettingsIcon, 
  User, 
  PenLine, 
  X, 
  Sparkles,
  Layers,
  FolderOpen,
  LayoutDashboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useApp } from './app-provider';
import Logo from '@/components/logo';

export default function MobileSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
    const [query, setQuery] = useState('');
    const [isDark, setIsDark] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const router = useRouter();
    const { tasks, notes, journals, userProfile } = useApp();

    useEffect(() => {
        const check = () => setIsDark(document.documentElement.classList.contains('dark'));
        check();
        const observer = new MutationObserver(check);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (open) { setQuery(''); setTimeout(() => inputRef.current?.focus(), 200); }
    }, [open]);

    const go = (href: string) => {
        router.push(href);
        onClose();
    };

    const glassStyle: React.CSSProperties = isDark ? {
        background: 'linear-gradient(165deg, rgba(20,20,25,0.7) 0%, rgba(10,10,15,0.6) 100%)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
    } : {
        background: 'linear-gradient(165deg, rgba(255,255,255,0.9) 0%, rgba(245,248,255,0.85) 100%)',
        backdropFilter: 'blur(16px) saturate(180%)',
        WebkitBackdropFilter: 'blur(16px) saturate(180%)',
        border: '1px solid rgba(255,255,255,0.6)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.1)',
    };

    const boxStyle: React.CSSProperties = isDark ? {
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.1)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
    } : {
        background: 'rgba(255, 255, 255, 0.7)', 
        border: '1px solid rgba(255,255,255,0.8)',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,1)',
    };

    const searchResults = useMemo(() => {
        if (!query.trim()) return [];
        const q = query.toLowerCase();
        const matchedTasks = tasks.filter(t => t.name.toLowerCase().includes(q)).map(t => ({ title: t.name, href: '/tasks', icon: ClipboardList, type: 'Task' }));
        const matchedNotes = notes.filter(n => (n.title || '').toLowerCase().includes(q)).map(n => ({ title: n.title || 'Untitled', href: '/notes', icon: FileText, type: 'Note' }));
        const matchedJournals = journals.filter(j => (j.title || '').toLowerCase().includes(q)).map(j => ({ title: j.title || 'Untitled', href: '/journal', icon: PenLine, type: 'Journal' }));
        return [...matchedTasks, ...matchedNotes, ...matchedJournals].slice(0, 15);
    }, [query, tasks, notes, journals]);

    return (
        <AnimatePresence>
            {open && (
                <motion.div
                    className="fixed inset-0 z-[150] md:hidden flex flex-col bg-black/[0.05] dark:bg-black/[0.1] backdrop-blur-[12px]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    {/* Main Card */}
                    <div 
                        className="flex-1 mx-4 mt-6 mb-28 rounded-[48px] p-5 flex flex-col gap-4 overflow-hidden relative shadow-2xl"
                        style={glassStyle}
                    >
                        {/* DYNAMIC TOP-LEFT TITLE */}
                        <div className="flex items-center justify-between px-4 mt-2">
                             <motion.h2 
                                key={query.trim() ? 'results' : 'palette'}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 0.4, x: 0 }}
                                className="text-[12px] font-black italic uppercase tracking-[0.2em]"
                             >
                                 {query.trim() ? 'Results' : 'Search Palette'}
                             </motion.h2>

                        </div>

                        {/* Search Input (Now at Top) */}
                        <div className="flex items-center gap-4 shrink-0">
                            <div className="flex-1 flex items-center px-6 py-2 rounded-[24px] h-[64px]" style={boxStyle}>
                                <Search className="h-5 w-5 opacity-20 mr-3" />
                                <input
                                    ref={inputRef}
                                    value={query}
                                    onChange={e => setQuery(e.target.value)}
                                    placeholder="Type to find something..."
                                    className="flex-1 bg-transparent border-none outline-none text-foreground placeholder:opacity-20 text-base font-bold tracking-tight"
                                />
                                {query && (
                                    <button onClick={() => setQuery('')} className="p-1.5 rounded-full bg-black/5 dark:bg-white/10 transition-colors">
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* RESULTS/MAIN AREA */}
                        <div className="flex-1 rounded-[32px] p-6 overflow-y-auto no-scrollbar flex flex-col" style={boxStyle}>
                            <AnimatePresence mode="wait">
                                {query.trim() ? (
                                    <motion.div 
                                        key="results"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="space-y-2.5"
                                    >
                                        {searchResults.map((item, i) => (
                                            <button 
                                                key={i} 
                                                onClick={() => go(item.href)}
                                                className="w-full flex items-center gap-3.5 p-3.5 rounded-[20px] bg-white/10 dark:bg-white/5 border border-white/10 transition-all text-left active:scale-[0.98]"
                                            >
                                                <div className="h-9 w-9 rounded-lg bg-black/5 dark:bg-white/10 flex items-center justify-center shrink-0">
                                                    <item.icon className="h-4 w-4 text-foreground/70" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-[15px] font-bold text-foreground truncate tracking-tight">{item.title}</p>
                                                    <p className="text-[8px] uppercase tracking-[0.2em] opacity-40 font-black mt-0.5">{item.type}</p>
                                                </div>
                                                <ArrowRight className="h-4 w-4 opacity-10" />
                                            </button>
                                        ))}
                                        {searchResults.length === 0 && (
                                            <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-4">
                                                <div className="h-12 w-12 rounded-[18px] bg-black/5 dark:bg-white/5 flex items-center justify-center mb-4 opacity-20">
                                                    <Search className="h-6 w-6" strokeWidth={1.5} />
                                                </div>
                                                <p className="text-[14px] font-bold text-foreground/40 italic">No matches found...</p>
                                                <p className="text-[9px] uppercase tracking-widest opacity-20 font-black mt-2">Try a different search</p>
                                            </div>
                                        )}
                                    </motion.div>
                                ) : (
                                    <motion.div 
                                        key="idle"
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0 }}
                                        className="flex-1 flex flex-col items-center justify-center text-center px-4"
                                    >
                                        <div className="h-14 w-14 rounded-[20px] bg-black/5 dark:bg-white/5 flex items-center justify-center mb-5">
                                            <Search className="h-7 w-7 opacity-20" strokeWidth={1.5} />
                                        </div>
                                        <h3 className="text-[18px] font-black italic uppercase tracking-tighter text-foreground/40 leading-tight">
                                            Search for anything<br/>in the rooms
                                        </h3>
                                        <p className="mt-3 text-[9px] font-black uppercase tracking-[0.3em] opacity-10">Nexaris Intelligence Platform</p>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
