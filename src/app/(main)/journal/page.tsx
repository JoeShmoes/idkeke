'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  Trash2,
  Search,
  MoreHorizontal,
  X,
  ChevronRight,
  Palette,
  Download,
  Loader2,
  Cloud,
  CloudOff,
  BookOpen,
  Calendar,
  Smile,
  Frown,
  Meh,
  Heart,
  Star
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useApp } from '@/components/layout/app-provider';
import type { JournalEntry } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Editor, { type EditorMethods } from '@/components/yoopta/editor';
import { generateId } from '@yoopta/editor';
import { useToast } from "@/hooks/use-toast";
import { format, isToday, isYesterday, startOfToday } from 'date-fns';
import { useIsMobile } from '@/hooks/use-mobile';
import MobileJournal from '@/components/journal/mobile-journal';

const MOODS = [
  { icon: Smile, label: 'Happy', color: 'text-green-500', bg: 'bg-green-500/10' },
  { icon: Meh, label: 'Neutral', color: 'text-zinc-500', bg: 'bg-zinc-500/10' },
  { icon: Frown, label: 'Sad', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { icon: Heart, label: 'Loved', color: 'text-pink-500', bg: 'bg-pink-500/10' },
  { icon: Star, label: 'Inspired', color: 'text-amber-500', bg: 'bg-amber-500/10' },
];

const createEmptyJournalContent = () => {
  const id = generateId();
  return {
    [id]: {
      id,
      type: 'Paragraph',
      meta: { order: 0, depth: 0 },
      value: [
        {
          id: generateId(),
          type: 'Paragraph',
          children: [{ text: '' }],
        },
      ],
    },
  };
};

const normalizeContent = (content: any) => {
  if (!content) return createEmptyJournalContent();
  if (typeof content === 'object' && !Array.isArray(content)) {
    const keys = Object.keys(content);
    if (keys.length > 0 && content[keys[0]]?.id && content[keys[0]]?.type) {
      return content;
    }
  }
  return createEmptyJournalContent();
};

export default function JournalPage() {
  const { journals, setJournals, appSettings } = useApp();
  const { toast } = useToast();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'syncing' | 'error'>('saved');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const editorRef = useRef<EditorMethods>(null);
  const searchParams = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize active entry
  useEffect(() => {
    const idFromUrl = searchParams?.get('id');
    if (idFromUrl && journals.some(j => j.id === idFromUrl)) {
      if (activeId !== idFromUrl) setActiveId(idFromUrl);
    } else if (!activeId && journals.length > 0 && !idFromUrl) {
      setActiveId(journals[0].id);
    }
  }, [journals, activeId, searchParams]);

  const activeEntry = useMemo(() =>
    journals.find(j => j.id === activeId),
    [journals, activeId]
  );

  const [editorValue, setEditorValue] = useState<any>(createEmptyJournalContent());
  const [valueId, setValueId] = useState<string | null>(null);

  if (activeId && activeId !== valueId) {
    setValueId(activeId);
    if (activeEntry) {
      const normalized = normalizeContent(activeEntry.content);
      setEditorValue(normalized);
      setSaveStatus('saved');
    }
  }

  const handleContentChange = (value: any) => {
    if (!activeId) return;
    setEditorValue(value);
    setSaveStatus('saving');

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

    saveTimeoutRef.current = setTimeout(() => {
      setJournals(prev => prev.map(entry =>
        entry.id === activeId
          ? { ...entry, content: value, updatedAt: Date.now() }
          : entry
      ));
      setSaveStatus('saved');
      saveTimeoutRef.current = null;
    }, 1000);
  };

  const createNewEntry = () => {
    const today = format(new Date(), 'MMMM d, yyyy');
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      title: today,
      content: createEmptyJournalContent(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      mood: 'Neutral',
    };
    setJournals(prev => [newEntry, ...prev]);
    setActiveId(newEntry.id);
    router.push(`/journal?id=${newEntry.id}`);
  };

  const deleteEntry = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setJournals(prev => prev.filter(j => j.id !== id));
    if (activeId === id) setActiveId(null);
    toast({ title: "Entry deleted" });
  };

  const updateMood = (mood: string) => {
    if (!activeId) return;
    setJournals(prev => prev.map(j =>
      j.id === activeId ? { ...j, mood, updatedAt: Date.now() } : j
    ));
  };

  const updateTitle = (title: string) => {
    if (!activeId) return;
    setJournals(prev => prev.map(j =>
      j.id === activeId ? { ...j, title, updatedAt: Date.now() } : j
    ));
  };

  const filteredEntries = journals.filter(j =>
    (j.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groupedEntries = useMemo(() => {
    const groups: Record<string, JournalEntry[]> = {};
    filteredEntries.forEach(entry => {
      const date = new Date(entry.createdAt);
      let group = format(date, 'MMMM yyyy');
      if (isToday(date)) group = 'Today';
      else if (isYesterday(date)) group = 'Yesterday';
      
      if (!groups[group]) groups[group] = [];
      groups[group].push(entry);
    });
    return groups;
  }, [filteredEntries]);

  const isMobile = useIsMobile();

  if (!mounted) return null;

  if (isMobile) return <MobileJournal />;

  return (
    <div className="flex h-full bg-background text-foreground overflow-hidden">
      {/* Sidebar */}
      <div className="w-80 border-r flex flex-col bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-xl">
        <div className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold tracking-tight">Journal</h1>
            <Button size="icon" variant="ghost" onClick={createNewEntry}>
              <Plus className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground opacity-50" />
            <Input 
              placeholder="Search entries..." 
              className="pl-9 bg-muted/50 border-none h-9 text-sm"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="px-3 pb-8 space-y-6">
            {Object.entries(groupedEntries).map(([group, items]) => (
              <div key={group} className="space-y-1">
                <h2 className="px-3 text-[11px] font-semibold text-muted-foreground/50 uppercase tracking-wider mb-2">{group}</h2>
                {items.map(entry => {
                  const MoodIcon = MOODS.find(m => m.label === entry.mood)?.icon || Meh;
                  const isActive = activeId === entry.id;
                  return (
                    <div
                      key={entry.id}
                      onClick={() => {
                        setActiveId(entry.id);
                        router.push(`/journal?id=${entry.id}`);
                      }}
                      className={cn(
                        "group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-all border border-transparent",
                        isActive 
                          ? "bg-white dark:bg-white/10 shadow-sm border-black/5 dark:border-white/5" 
                          : "hover:bg-black/5 dark:hover:bg-white/5 text-muted-foreground hover:text-foreground"
                      )}
                    >
                      <div className={cn("p-1.5 rounded-md", MOODS.find(m => m.label === entry.mood)?.bg || 'bg-zinc-500/10')}>
                        <MoodIcon className={cn("w-4 h-4", MOODS.find(m => m.label === entry.mood)?.color || 'text-zinc-500')} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{entry.title || 'Untitled'}</p>
                        <p className="text-[11px] opacity-50">{format(entry.createdAt, 'h:mm a')}</p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                            <MoreHorizontal className="w-3.5 h-3.5" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => deleteEntry(e, entry.id)} className="text-red-500">
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })}
              </div>
            ))}
            {filteredEntries.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-center opacity-40">
                <BookOpen className="w-8 h-8 mb-2" />
                <p className="text-sm">No entries found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full bg-background relative">
        {activeEntry ? (
          <>
            <div className="h-14 border-b flex items-center justify-between px-6 bg-background/50 backdrop-blur-md z-10">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Calendar className="w-4 h-4 text-muted-foreground" />
                  <span>{format(activeEntry.createdAt, 'EEEE, MMMM d')}</span>
                </div>
                <div className="h-4 w-px bg-border" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 gap-2 px-2">
                      {(() => {
                        const m = MOODS.find(m => m.label === activeEntry.mood) || MOODS[1];
                        const Icon = m.icon;
                        return <Icon className={cn("w-4 h-4", m.color)} />;
                      })()}
                      <span className="text-xs">{activeEntry.mood}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start">
                    {MOODS.map(m => (
                      <DropdownMenuItem key={m.label} onClick={() => updateMood(m.label)} className="gap-2">
                        <m.icon className={cn("w-4 h-4", m.color)} />
                        {m.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-2 py-1 rounded-full bg-muted/50">
                  {saveStatus === 'saving' ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : saveStatus === 'error' ? (
                    <CloudOff className="w-3 h-3 text-red-500" />
                  ) : (
                    <Cloud className="w-3 h-3" />
                  )}
                  <span className="capitalize">{saveStatus}</span>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <Download className="w-4 h-4" />
                </Button>
              </div>
            </div>

            <ScrollArea className="flex-1">
              <div className="max-w-3xl mx-auto py-12 px-8 space-y-8">
                <input
                  value={activeEntry.title}
                  onChange={(e) => updateTitle(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-4xl font-bold placeholder:text-muted-foreground/20"
                  placeholder="Today's thought..."
                />
                <div className="min-h-[500px]">
                  <Editor
                    noteId={activeEntry.id}
                    value={editorValue}
                    onChange={handleContentChange}
                    placeholder="Start writing..."
                    variant="compact"
                  />
                </div>
              </div>
            </ScrollArea>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <BookOpen className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Your Story Starts Here</h2>
            <p className="text-muted-foreground max-w-sm mb-6">
              Write down your thoughts, capture your moods, and look back at your journey.
            </p>
            <Button onClick={createNewEntry} className="gap-2">
              <Plus className="w-4 h-4" /> Write Today's Entry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
