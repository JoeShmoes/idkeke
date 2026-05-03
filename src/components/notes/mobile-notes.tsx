'use client';

import { useApp } from '@/components/layout/app-provider';
import { useSound } from '@/hooks/use-sound';
import { 
  FileText, 
  MoreVertical, 
  ChevronRight, 
  ArrowLeft,
  Trash2,
  FileDown,
  Search,
  Plus,
  User,
  LogOut,
  Sparkles
} from 'lucide-react';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from '@/lib/utils';
import { useState, useMemo, useEffect } from 'react';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import Editor from '@/components/yoopta/editor';
import { useRouter } from 'next/navigation';

export default function MobileNotes() {
  const { notes, setNotes, userProfile, setUserProfile, setIsNavHidden } = useApp();
  const { playSound } = useSound();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    const check = () => setIsDark(document.documentElement.classList.contains('dark') || document.documentElement.className.includes('dark'));
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Hide nav when entering editor
  useEffect(() => {
    if (activeNoteId) {
      setIsNavHidden(true);
    } else {
      setIsNavHidden(false);
    }
  }, [activeNoteId, setIsNavHidden]);

  const filteredNotes = useMemo(() => {
    return notes.filter(n => (n.title || '').toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
  }, [notes, search]);

  const activeNote = useMemo(() => notes.find(n => n.id === activeNoteId), [notes, activeNoteId]);

  const createNote = () => {
    const newNote = {
      id: crypto.randomUUID(),
      title: '',
      content: {},
      updatedAt: Date.now(),
      createdAt: Date.now()
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    playSound('notification');
  };

  const handleLogout = () => {
    setUserProfile(null);
    router.push('/login');
  };

  return (
    <div className="fixed inset-0 z-40 bg-white dark:bg-[#0A0A0A] flex flex-col md:hidden overflow-hidden">
      <AnimatePresence mode="wait">
        {!activeNoteId ? (
          <motion.div 
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex-1 flex flex-col h-full overflow-hidden"
          >
            {/* Liquid Glass Header */}
            <div className="sticky top-0 z-50 px-4 py-4 shrink-0 bg-white/60 dark:bg-[#000000]/60 backdrop-blur-3xl border-b border-black/[0.03] dark:border-white/[0.05] flex items-center justify-between">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="h-10 w-10 rounded-full bg-zinc-100 dark:bg-white/5 border border-black/5 dark:border-white/10 flex items-center justify-center overflow-hidden active:scale-95 transition-all shadow-sm">
                    {userProfile?.avatar ? (
                      <img src={userProfile.avatar} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <User className="h-5 w-5 opacity-40" />
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 mt-2 backdrop-blur-xl bg-white/90 dark:bg-zinc-900/90 border-black/5 dark:border-white/10 shadow-2xl">
                  <DropdownMenuLabel className="flex flex-col">
                    <span className="font-bold">{userProfile?.name || 'User'}</span>
                    <span className="text-[10px] opacity-50">{userProfile?.email}</span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-500 focus:text-red-500 focus:bg-red-500/10">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <div className="flex flex-col items-center text-center px-4 min-w-0">
                <span className="text-[17px] font-black tracking-tight uppercase italic opacity-90 truncate w-full">Notes</span>
                <span className="text-[10px] font-bold opacity-40 uppercase tracking-[0.1em] truncate w-full">Capture your thoughts</span>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={createNote}
                  className="h-10 w-10 rounded-full bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30 active:scale-90 transition-all"
                >
                  <Plus className="h-5 w-5" strokeWidth={3} />
                </button>
              </div>
            </div>

            {/* Content Area (Scrollable) */}
            <div className="flex-1 overflow-y-auto pb-40 px-4 pt-6">
              <div className="space-y-2">
                {filteredNotes.length > 0 ? filteredNotes.map((note) => (
                  <div
                    key={note.id}
                    onClick={() => { setActiveNoteId(note.id); }}
                    className="flex items-center gap-4 p-4 rounded-[24px] bg-white dark:bg-white/5 border border-black/[0.03] dark:border-white/[0.03] shadow-sm active:scale-[0.98] transition-all"
                  >
                    <div className="h-12 w-12 rounded-2xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-xl shadow-inner">
                      {note.icon || '📄'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-[16px] truncate">{note.title || 'Untitled'}</p>
                      <p className="text-[11px] opacity-40 font-medium">{format(note.updatedAt || Date.now(), 'MMM d, h:mm a')}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 opacity-20" />
                  </div>
                )) : (
                  <div className="py-20 text-center opacity-30 text-sm italic">No notes found</div>
                )}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="editor"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="flex-1 flex flex-col bg-white dark:bg-[#0A0A0A] h-full overflow-hidden"
          >
            {/* Editor Header */}
            <div className="sticky top-0 z-50 bg-white/70 dark:bg-[#000000]/70 backdrop-blur-3xl px-4 h-14 flex items-center justify-between border-b border-black/[0.03] dark:border-white/[0.05] shrink-0">
              <div className="flex items-center gap-2" onClick={() => { setActiveNoteId(null); }}>
                <ArrowLeft className="h-5 w-5 opacity-40" />
                <span className="text-sm font-bold opacity-60">Back</span>
              </div>
              <div className="flex items-center gap-4">
                <Trash2 className="h-5 w-5 text-red-500 opacity-60" onClick={() => {
                  setNotes(prev => prev.filter(n => n.id !== activeNoteId));
                  setActiveNoteId(null);
                }} />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto pb-40 px-6 pt-8">
              <div className="space-y-6">
                <div className="h-20 w-20 rounded-3xl bg-zinc-100 dark:bg-white/5 flex items-center justify-center text-4xl shadow-xl">
                  {activeNote?.icon || '📄'}
                </div>
                <input 
                  value={activeNote?.title || ''}
                  onChange={e => {
                    if (!activeNoteId) return;
                    setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, title: e.target.value, updatedAt: Date.now() } : n));
                  }}
                  placeholder="Untitled"
                  className="w-full bg-transparent border-none outline-none font-bold text-4xl tracking-tight"
                />
                <div className="min-h-screen pt-4">
                  <Editor 
                    noteId={activeNoteId}
                    value={activeNote?.content || {}}
                    onChange={(value) => {
                      if (!activeNoteId) return;
                      // Auto-hide nav when typing starts if not already hidden
                      setIsNavHidden(true);
                      setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, content: value, updatedAt: Date.now() } : n));
                    }}
                    placeholder="Start writing..."
                  />
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
