'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Plus,
  FileText,
  Trash2,
  Search,
  MoreHorizontal,
  Image as ImageIcon,
  Smile,
  X,
  ChevronRight,
  Palette,
  Download,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Code as CodeIcon,
  Quote,
  Minus,
  Table as TableIcon,
  CheckSquare,
  ExternalLink,
  Copy,
  Check,
  Loader2,
  Cloud,
  CloudOff
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn, copyToClipboard } from '@/lib/utils';
import { useApp } from '@/components/layout/app-provider';
import type { Note } from '@/lib/types';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator,
  ContextMenuLabel,
} from "@/components/ui/context-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import EmojiPicker, { Theme } from 'emoji-picker-react';
import { useHover } from '@/components/layout/hover-context';
import Editor, { type EditorMethods } from '@/components/yoopta/editor';
import { generateId } from '@yoopta/editor';
import { useToast } from "@/hooks/use-toast";
import { useIsMobile } from '@/hooks/use-mobile';
import MobileNotes from '@/components/notes/mobile-notes';
import FloatingAI from '@/components/notes/FloatingAI';

type Html2PdfOptions = {
  margin?: number | [number, number] | [number, number, number, number];
  filename?: string;
  image?: { type?: 'jpeg' | 'png' | 'webp'; quality?: number };
  enableLinks?: boolean;
  html2canvas?: object;
  jsPDF?: { unit?: string; format?: string | [number, number]; orientation?: 'portrait' | 'landscape' };
};

// Import Yoopta Styles - CSS files not found in node_modules, assuming bundled or not needed for this version
// import '@yoopta/editor/dist/index.css';
// import '@yoopta/action-menu-list/dist/index.css';
// import '@yoopta/toolbar/dist/index.css';
// import '@yoopta/paragraph/dist/index.css';
// import '@yoopta/headings/dist/index.css';
// import '@yoopta/lists/dist/index.css';
// import '@yoopta/code/dist/index.css';
// import '@yoopta/blockquote/dist/index.css';
// import '@yoopta/callout/dist/index.css';
// import '@yoopta/embed/dist/index.css';
// import '@yoopta/image/dist/index.css';

const SOLID_COLORS = [
  'bg-zinc-100 dark:bg-zinc-800',
  'bg-red-100 dark:bg-red-900/30',
  'bg-orange-100 dark:bg-orange-900/30',
  'bg-amber-100 dark:bg-amber-900/30',
  'bg-yellow-100 dark:bg-yellow-900/30',
  'bg-lime-100 dark:bg-lime-900/30',
  'bg-green-100 dark:bg-green-900/30',
  'bg-emerald-100 dark:bg-emerald-900/30',
  'bg-teal-100 dark:bg-teal-900/30',
  'bg-cyan-100 dark:bg-cyan-900/30',
  'bg-sky-100 dark:bg-sky-900/30',
  'bg-blue-100 dark:bg-blue-900/30',
  'bg-indigo-100 dark:bg-indigo-900/30',
  'bg-violet-100 dark:bg-violet-900/30',
  'bg-purple-100 dark:bg-purple-900/30',
  'bg-fuchsia-100 dark:bg-fuchsia-900/30',
  'bg-pink-100 dark:bg-pink-900/30',
  'bg-rose-100 dark:bg-rose-900/30',
];

const GRADIENTS = [
  'bg-gradient-to-r from-rose-400 to-orange-300',
  'bg-gradient-to-r from-slate-900 to-slate-700',
  'bg-gradient-to-r from-teal-200 to-teal-500',
  'bg-gradient-to-r from-indigo-400 to-cyan-400',
  'bg-gradient-to-r from-fuchsia-500 to-pink-500',
  'bg-gradient-to-r from-emerald-500 to-emerald-900',
  'bg-gradient-to-r from-orange-400 to-rose-400',
  'bg-gradient-to-r from-blue-400 to-emerald-400',
  'bg-gradient-to-r from-purple-500 to-indigo-500',
  'bg-gradient-to-r from-yellow-200 to-orange-500',
];

// 3. Define Safe Defaults & Normalization
const createEmptyNoteContent = () => {
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
  if (!content) return createEmptyNoteContent();
  
  // If it's already a valid Yoopta content object
  if (typeof content === 'object' && !Array.isArray(content)) {
    const keys = Object.keys(content);
    // Check if values look like blocks (have id and type)
    if (keys.length > 0 && content[keys[0]]?.id && content[keys[0]]?.type) {
      return content;
    }
  }

  // Handle Legacy Array format
  if (Array.isArray(content)) {
    const blocks: Record<string, any> = {};
    content.forEach((block, index) => {
      const id = block.id || generateId();
      blocks[id] = {
        id,
        type: block.type || 'Paragraph',
        value: block.value || [
          {
            id: generateId(),
            type: 'Paragraph',
            children: block.children || [{ text: '' }]
          }
        ],
        meta: block.meta || { order: index, depth: 0 },
      };
    });
    return blocks;
  }

  return createEmptyNoteContent();
};

const isCustomCover = (cover?: string) => {
  if (!cover) return false;
  return cover.includes('gradient') || cover.startsWith('#') || cover.startsWith('rgb');
};

const EMPTY_EDITOR_VALUE = createEmptyNoteContent();

export default function NotesPage() {
  const { notes, setNotes, appSettings } = useApp();
  const { toast } = useToast();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mounted, setMounted] = useState(false);
  
  // Dialog States
  const [deleteDialog, setDeleteDialog] = useState<{ isOpen: boolean; noteId: string | null }>({
    isOpen: false,
    noteId: null
  });
  const [renameDialog, setRenameDialog] = useState<{ isOpen: boolean; noteId: string | null; title: string }>({
    isOpen: false,
    noteId: null,
    title: ''
  });

  const editorRef = useRef<EditorMethods>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Migration: Check for legacy 'nexaris-notes' and merge into app state
  useEffect(() => {
    if (!mounted) return;
    const legacyNotesStr = localStorage.getItem('nexaris-notes');
    if (legacyNotesStr) {
      try {
        const legacyNotes: Note[] = JSON.parse(legacyNotesStr);
        if (Array.isArray(legacyNotes) && legacyNotes.length > 0) {
          setNotes(prev => {
            const merged = [...prev];
            legacyNotes.forEach(legacy => {
              if (!merged.some(n => n.id === legacy.id)) {
                merged.push(legacy);
              }
            });
            return merged;
          });
          localStorage.removeItem('nexaris-notes');
        }
      } catch (e) {
        console.error('Failed to migrate legacy notes', e);
      }
    }
  }, [setNotes, mounted]);

  // Navigation
  const searchParams = useSearchParams();
  const router = useRouter();

  // Custom cover state
  const [customColor1, setCustomColor1] = useState('#3b82f6');
  const [customColor2, setCustomColor2] = useState('#ef4444');
  const [pendingDownloadId, setPendingDownloadId] = useState<string | null>(null);

  const { setHoveredItem } = useHover();

  // Local state for immediate editor updates and saving status
  const [transientContent, setTransientContent] = useState<any>(null);
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'syncing' | 'error'>('saved');
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const loadedNoteId = useRef<string | null>(null);
  const selectionRef = useRef<HTMLDivElement | null>(null);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // Handle Ask AI event
  useEffect(() => {
    const handleOpenAI = () => setIsAIOpen(true);
    window.addEventListener('open-alfred-ai', handleOpenAI);
    return () => window.removeEventListener('open-alfred-ai', handleOpenAI);
  }, []);

  // Initialize active note and handle navigation
  useEffect(() => {
    const noteIdFromUrl = searchParams?.get('id');

    // 1. Prioritize URL param if valid
    if (noteIdFromUrl && notes.some(n => n.id === noteIdFromUrl)) {
      if (activeNoteId !== noteIdFromUrl) {
        setActiveNoteId(noteIdFromUrl);
      }
    }
    // 2. Fallback to first note if no URL param and no active note
    else if (!activeNoteId && notes.length > 0 && !noteIdFromUrl) {
      setActiveNoteId(notes[0].id);
    }

    // 3. Listen for custom navigation event from NoteLinkPlugin
    const handleNavigation = (e: Event) => {
      const customEvent = e as CustomEvent;
      const noteId = customEvent.detail?.noteId;
      if (noteId && notes.some(n => n.id === noteId)) {
        setActiveNoteId(noteId);
        // Use router to update URL cleanly
        router.push(`/notes?id=${noteId}`);
      }
    };

    window.addEventListener('navigate-to-note', handleNavigation);
    return () => window.removeEventListener('navigate-to-note', handleNavigation);
  }, [notes, activeNoteId, searchParams]);

  // Helper to update active note and URL
  const handleNoteSelect = (id: string) => {
    setActiveNoteId(id);
    router.push(`/notes?id=${id}`);
  };

  const activeNote = useMemo(() =>
    notes.find(n => n.id === activeNoteId),
    [notes, activeNoteId]
  );

  const breadcrumbs = useMemo(() => {
    const path = [];
    let currentId = activeNoteId;
    // Safety check to prevent infinite loops (max depth 20)
    let depth = 0;
    while (currentId && depth < 20) {
      const note = notes.find(n => n.id === currentId);
      if (note) {
        path.unshift(note);
        currentId = note.parentId || null;
      } else {
        break;
      }
      depth++;
    }
    return path;
  }, [activeNoteId, notes]);

  // Listen for storage errors and cloud sync events
  useEffect(() => {
    const handleStorageError = (e: Event) => {
      setSaveStatus('error');
    };

    const handleCloudSyncStart = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.key === 'notes') {
        setSaveStatus('syncing');
      }
    };

    const handleCloudSyncSuccess = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.key === 'notes') {
        setSaveStatus('saved');
      }
    };

    const handleCloudSyncError = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (detail.key === 'notes') {
        setSaveStatus('error');
      }
    };

    window.addEventListener('local-storage-error', handleStorageError);
    window.addEventListener('cloud-sync-start', handleCloudSyncStart);
    window.addEventListener('cloud-sync-success', handleCloudSyncSuccess);
    window.addEventListener('cloud-sync-error', handleCloudSyncError);

    return () => {
      window.removeEventListener('local-storage-error', handleStorageError);
      window.removeEventListener('cloud-sync-start', handleCloudSyncStart);
      window.removeEventListener('cloud-sync-success', handleCloudSyncSuccess);
      window.removeEventListener('cloud-sync-error', handleCloudSyncError);
    };
  }, []);

  const [editorValue, setEditorValue] = useState<any>(createEmptyNoteContent());
  // Track the ID for which editorValue is valid
  const [valueId, setValueId] = useState<string | null>(null);

  // Derived state: Sync editorValue with activeNoteId immediately during render
  if (activeNoteId && activeNoteId !== valueId) {
    setValueId(activeNoteId);
    if (activeNote) {
        const normalized = normalizeContent(activeNote.content);
        setEditorValue(normalized);
        setTransientContent(normalized);
        loadedNoteId.current = activeNoteId;
        setSaveStatus('saved');
    }
  }

  // Effect only for side effects, not value syncing
  useEffect(() => {
    // No-op for value syncing now
  }, [activeNoteId, activeNote]);

  const handleDownloadPDF = useCallback(async () => {
    if (!activeNote) return;

    // Dynamically import html2pdf to avoid SSR issues
    const html2pdf = (await import('html2pdf.js')).default;

    // We need to capture the content area. We'll add an ID to the editor wrapper.
    const element = document.getElementById('note-printable-content');

    if (!element) return;

    const opt: Html2PdfOptions = {
      margin: 10,
      filename: `${activeNote.title || 'Untitled'}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save();
  }, [activeNote]);

  // Handle pending PDF download (waiting for note to become active/render)
  useEffect(() => {
    if (pendingDownloadId && activeNoteId === pendingDownloadId) {
      const timer = setTimeout(() => {
        handleDownloadPDF();
        setPendingDownloadId(null);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [pendingDownloadId, activeNoteId, handleDownloadPDF]);

  const handleContentChange = (value: any) => {
    if (!activeNoteId) return;

    // 1. Update local UI state immediately to prevent stale prop "ping-pong"
    setTransientContent(value);
    setEditorValue(value); // Keep in sync instantly
    setSaveStatus('saving');

    // 2. Debounce persistence to global state and storage
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(() => {
      setNotes(prev => prev.map(note =>
        note.id === activeNoteId
          ? { ...note, content: value, updatedAt: Date.now() }
          : note
      ));
      setSaveStatus('saved');
      saveTimeoutRef.current = null;
    }, 1000); // 1 second debounce
  };

  const createNewNote = () => {
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: '',
      content: createEmptyNoteContent(),
      updatedAt: Date.now(),
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
  };

  const deleteNote = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setNotes(prev => prev.filter(n => n.id !== id));
    if (activeNoteId === id) {
      setActiveNoteId(null);
    }
  };

  const updateTitle = (newTitle: string) => {
    if (!activeNoteId) return;
    setNotes(prev => prev.map(note =>
      note.id === activeNoteId
        ? { ...note, title: newTitle, updatedAt: Date.now() }
        : note
    ));
  };

  const updateNoteProperty = (key: keyof Note, value: any) => {
    if (!activeNoteId) return;
    setNotes(prev => prev.map(note =>
      note.id === activeNoteId
        ? { ...note, [key]: value, updatedAt: Date.now() }
        : note
    ));
  };

  const handleInsertBlock = (type: string, data = {}) => {
    // Blocks are handled within the Editor component's context menu/slash commands
  };

  const duplicateNote = (note: Note) => {
    const newNote: Note = {
      ...note,
      id: crypto.randomUUID(),
      title: `${note.title || 'Untitled'} (Copy)`,
      updatedAt: Date.now(),
      createdAt: Date.now(),
    };
    setNotes(prev => [newNote, ...prev]);
    setActiveNoteId(newNote.id);
    router.push(`/notes?id=${newNote.id}`);
    toast({
      title: "Note Duplicated",
      description: `Created a copy of "${note.title}"`,
    });
  };

  const handleRename = (note: Note) => {
    setRenameDialog({
      isOpen: true,
      noteId: note.id,
      title: note.title || ''
    });
  };

  const confirmRename = () => {
    if (renameDialog.noteId) {
      setNotes(prev => prev.map(n => 
        n.id === renameDialog.noteId ? { ...n, title: renameDialog.title, updatedAt: Date.now() } : n
      ));
      setRenameDialog({ isOpen: false, noteId: null, title: '' });
      toast({
        title: "Note Renamed",
        description: "Your changes have been saved.",
      });
    }
  };


  const filteredNotes = notes.filter(n =>
    (n.title || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Check if cover is a custom style (hex or gradient) or a tailwind class
  const isCustomCover = (cover?: string) => {
    if (!cover) return false;
    return cover.startsWith('#') || cover.startsWith('linear-gradient') || cover.startsWith('rgb');
  };

  // Handle click on links to other notes
  useEffect(() => {
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a');
      if (link && link.href) {
        const url = new URL(link.href);
        // Check if it's a note link (e.g. /notes?id=...)
        if (url.pathname === '/notes' || url.searchParams.has('id')) {
          const noteId = url.searchParams.get('id');
          if (noteId) {
            e.preventDefault();
            setActiveNoteId(noteId);
          }
        }
      }
    };

    document.addEventListener('click', handleLinkClick);
    return () => document.removeEventListener('click', handleLinkClick);
  }, []);


  const isMobile = useIsMobile();

  if (isMobile) return <MobileNotes />;

  return (
    <div className="flex h-full bg-background text-foreground">
      {/* Left Sidebar - Smart Hover Behavior */}
      <div 
        className={cn(
          "flex flex-col items-start border-r bg-zinc-50/50 dark:bg-zinc-900/50 backdrop-blur-xl transition-all duration-300 ease-in-out group/sidebar overflow-hidden shrink-0 relative",
          notes.length === 0 
            ? "w-64" 
            : "w-3 hover:w-64 delay-300 hover:delay-0 cursor-pointer"
        )}
      >
        {/* Hover Hint Indicator */}
        {notes.length > 0 && (
          <div className="absolute inset-y-0 right-0 w-[1px] bg-white/5 group-hover/sidebar:bg-transparent transition-colors z-20" />
        )}

        {/* Pin inner container to the left edge */}
        <div className="w-64 flex flex-col h-full shrink-0 absolute left-0 top-0 bottom-0">
          {/* Sidebar Header & Actions */}
          <div className="p-3 space-y-3">
            <div
              onClick={createNewNote}
              className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground bg-white dark:bg-white/5 border shadow-sm hover:bg-zinc-50 dark:hover:bg-white/10 rounded-md cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 text-muted-foreground" />
              <span>New Page</span>
            </div>

            <div className="relative group px-0">
              <div className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground bg-muted/30 hover:bg-muted/50 rounded-md transition-colors border border-transparent focus-within:border-muted-foreground/20 focus-within:bg-background">
                <Search className="w-4 h-4 opacity-50" />
                <input
                  className="flex-1 bg-transparent border-none outline-none placeholder:text-muted-foreground/50 text-foreground h-6"
                  placeholder="Search pages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>

          <ScrollArea className="flex-1">
            <div className="pb-4 pt-2 px-3">
              <h2 className="text-[11px] font-semibold text-muted-foreground/40 uppercase tracking-wider mb-2 px-1">Private</h2>

              <div className="space-y-1">
                {filteredNotes.length === 0 ? (
                  <div className="px-2 py-8 text-center text-xs text-muted-foreground/50 italic">
                    {searchQuery ? 'No pages found' : 'No pages yet'}
                  </div>
                ) : (
                  filteredNotes.map(note => (
                    <ContextMenu key={note.id}>
                      <ContextMenuTrigger>
                        <div
                          onClick={() => handleNoteSelect(note.id)}
                          onMouseEnter={() => setHoveredItem({ type: 'note', data: note })}
                          onMouseLeave={() => setHoveredItem(null)}
                          className={cn(
                            "group flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-all select-none border border-transparent",
                            activeNoteId === note.id
                              ? "bg-white dark:bg-white/10 text-foreground font-medium shadow-sm border-black/5 dark:border-white/5"
                              : "text-muted-foreground hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground"
                          )}
                        >
                          <div className="flex items-center gap-3 min-w-0 overflow-hidden flex-1">
                            <span className="text-base shrink-0 opacity-80">{note.icon || <FileText className="w-4 h-4" />}</span>
                            <span className="truncate text-sm">
                              {note.title || 'Untitled'}
                            </span>
                          </div>

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted-foreground/10 rounded-sm ml-1"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreHorizontal className="w-3 h-3 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="w-64 max-h-[300px] overflow-y-auto">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (activeNoteId !== note.id) {
                                    handleNoteSelect(note.id);
                                    setPendingDownloadId(note.id);
                                  } else {
                                    handleDownloadPDF();
                                  }
                                }}
                              >
                                <Download className="w-4 h-4 mr-2" />
                                Download PDF
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={(e) => deleteNote(e, note.id)} className="text-red-500 focus:text-red-500">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </ContextMenuTrigger>
                      <ContextMenuContent className="w-64 max-h-[300px] overflow-y-auto">
                        <ContextMenuItem
                          onClick={() => {
                            if (activeNoteId !== note.id) {
                              handleNoteSelect(note.id);
                              setPendingDownloadId(note.id);
                            } else {
                              handleDownloadPDF();
                            }
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download PDF
                        </ContextMenuItem>
                        <ContextMenuItem onClick={(e) => deleteNote(e, note.id)} className="text-red-500 focus:text-red-500">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </ContextMenuItem>
                      </ContextMenuContent>
                    </ContextMenu>
                  ))
                )}
              </div>
            </div>
          </ScrollArea>
        </div>
      </div>

      {/* Right Column - Editor */}
      <div
        className="flex-1 flex flex-col h-full overflow-hidden bg-background text-foreground relative"
        ref={selectionRef}
      >
        {activeNote ? (
          <>
            {/* Top Bar - Minimal */}
            <div className="h-12 flex items-center justify-between px-4 absolute top-0 left-0 right-0 z-10 hover:bg-white/80 transition-colors">
              <div className="flex items-center gap-2 text-sm text-slate-500 overflow-hidden opacity-0 hover:opacity-100 transition-opacity">
                <div className="flex items-center gap-1">
                  {breadcrumbs.map((crumb, index) => (
                    <div key={crumb.id} className="flex items-center gap-1">
                      {index > 0 && <span className="text-slate-300">/</span>}
                      <button
                        onClick={() => handleNoteSelect(crumb.id)}
                        className="truncate max-w-[150px] text-slate-500 hover:text-slate-900 hover:underline transition-colors text-xs font-medium"
                      >
                        {crumb.title || 'Untitled'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-1">
                {/* Save Status Indicator */}
                <div className="mr-2 flex items-center">
                  {saveStatus === 'saving' && (
                    <div className="flex items-center gap-1 text-slate-400 text-xs animate-pulse">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span className="hidden sm:inline">Saving...</span>
                    </div>
                  )}
                  {saveStatus === 'syncing' && (
                    <div className="flex items-center gap-1 text-blue-400 text-xs animate-pulse">
                      <Cloud className="w-3 h-3 animate-bounce" />
                      <span className="hidden sm:inline">Syncing...</span>
                    </div>
                  )}
                  {saveStatus === 'saved' && (
                    <div className="flex items-center gap-1 text-slate-400 text-xs opacity-50 hover:opacity-100 transition-opacity">
                      <Cloud className="w-3 h-3" />
                      <span className="hidden sm:inline">Saved</span>
                    </div>
                  )}
                  {saveStatus === 'error' && (
                    <div className="flex items-center gap-1 text-red-400 text-xs" title="Failed to save locally">
                      <CloudOff className="w-3 h-3" />
                      <span className="hidden sm:inline">Error</span>
                    </div>
                  )}
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setPendingDownloadId(activeNote.id)}>
                      <Download className="w-4 h-4 mr-2" />
                      Export PDF
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-red-600 focus:text-red-600 focus:bg-red-50"
                      onClick={(e) => deleteNote(e, activeNote.id)}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete Note
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>

            <ScrollArea className="flex-1 h-full">
              {/* Cover Image Area */}
              {activeNote.cover && (
                <div
                  className={cn(
                    "w-full h-56 relative group transition-all bg-cover bg-center",
                    !isCustomCover(activeNote.cover) && activeNote.cover
                  )}
                  style={isCustomCover(activeNote.cover) ? { background: activeNote.cover } : undefined}
                >
                  <div data-html2canvas-ignore="true" className="absolute bottom-4 right-10 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-6 text-xs bg-black/50 hover:bg-black/70 text-white border-none backdrop-blur-sm"
                        >
                          <Palette className="w-3 h-3 mr-1.5" /> Change cover
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent align="end" className="w-80 p-0 shadow-xl border-border/50">
                        <Tabs defaultValue="presets" className="w-full">
                          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0 border-border/50">
                            <TabsTrigger value="presets" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-muted-foreground data-[state=active]:text-foreground">
                              Presets
                            </TabsTrigger>
                            <TabsTrigger value="custom" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent text-muted-foreground data-[state=active]:text-foreground">
                              Custom
                            </TabsTrigger>
                          </TabsList>

                          <TabsContent value="presets" className="p-3">
                            <div className="space-y-4">
                              <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-2">Colors</h4>
                                <div className="grid grid-cols-6 gap-1.5">
                                  {SOLID_COLORS.map((color) => (
                                    <div
                                      key={color}
                                      className={cn("w-8 h-8 rounded-md cursor-pointer hover:scale-105 transition-transform border border-black/5", color)}
                                      onClick={() => updateNoteProperty('cover', color)}
                                    />
                                  ))}
                                </div>
                              </div>
                              <div>
                                <h4 className="text-xs font-medium text-muted-foreground mb-2">Gradients</h4>
                                <div className="grid grid-cols-4 gap-1.5">
                                  {GRADIENTS.map((gradient) => (
                                    <div
                                      key={gradient}
                                      className={cn("w-12 h-8 rounded-md cursor-pointer hover:scale-105 transition-transform", gradient)}
                                      onClick={() => updateNoteProperty('cover', gradient)}
                                    />
                                  ))}
                                </div>
                              </div>
                            </div>
                          </TabsContent>

                          <TabsContent value="custom" className="p-3">
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <h4 className="text-xs font-medium text-muted-foreground">Solid Color</h4>
                                <div className="flex items-center gap-3">
                                  <input
                                    type="color"
                                    className="h-10 w-20 p-1 rounded cursor-pointer border bg-transparent"
                                    onChange={(e) => updateNoteProperty('cover', e.target.value)}
                                  />
                                  <div className="text-xs text-muted-foreground">Pick a custom solid color</div>
                                </div>
                              </div>

                              <div className="space-y-2 pt-2 border-t">
                                <h4 className="text-xs font-medium text-muted-foreground">Gradient Builder</h4>
                                <div className="flex items-center gap-2">
                                  <input
                                    type="color"
                                    value={customColor1}
                                    onChange={(e) => setCustomColor1(e.target.value)}
                                    className="h-8 w-12 p-0.5 rounded cursor-pointer border bg-transparent"
                                  />
                                  <span className="text-xs text-muted-foreground">to</span>
                                  <input
                                    type="color"
                                    value={customColor2}
                                    onChange={(e) => setCustomColor2(e.target.value)}
                                    className="h-8 w-12 p-0.5 rounded cursor-pointer border bg-transparent"
                                  />
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="ml-auto text-xs h-8"
                                    onClick={() => updateNoteProperty('cover', `linear-gradient(to right, ${customColor1}, ${customColor2})`)}
                                  >
                                    Apply Gradient
                                  </Button>
                                </div>
                                <div
                                  className="h-8 w-full rounded-md mt-2 border border-black/5"
                                  style={{ background: `linear-gradient(to right, ${customColor1}, ${customColor2})` }}
                                />
                              </div>
                            </div>
                          </TabsContent>
                        </Tabs>
                      </PopoverContent>
                    </Popover>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="h-6 text-xs bg-black/50 hover:bg-black/70 text-white border-none backdrop-blur-sm"
                      onClick={() => updateNoteProperty('cover', undefined)}
                    >
                      <X className="w-3 h-3 mr-1" /> Remove
                    </Button>
                  </div>
                </div>
              )}

              <ContextMenu>
                <ContextMenuTrigger className="min-h-full block outline-none">
                  <div id="note-printable-content" className="max-w-4xl mx-auto w-full px-12 sm:px-24 pb-32">
                    {/* Icon Area */}
                    <div className="relative group mb-6">
                      {activeNote.icon ? (
                        <div className={cn("relative group/icon inline-flex", activeNote.cover ? "-mt-[44px]" : "mt-16")}>
                          <Popover>
                            <PopoverTrigger asChild>
                              <div
                                className="text-[78px] leading-none select-none cursor-pointer hover:bg-muted/10 rounded-md transition-colors"
                              >
                                {activeNote.icon}
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none">
                              <EmojiPicker
                                onEmojiClick={(emoji) => updateNoteProperty('icon', emoji.emoji)}
                                theme={Theme.AUTO}
                                skinTonesDisabled
                                searchDisabled={false}
                                width={350}
                                height={400}
                              />
                            </PopoverContent>
                          </Popover>

                          <Button
                            variant="ghost"
                            size="icon"
                            data-html2canvas-ignore="true"
                            className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-muted-foreground/20 hover:bg-destructive hover:text-white opacity-0 group-hover/icon:opacity-100 transition-all"
                            onClick={(e) => { e.stopPropagation(); updateNoteProperty('icon', undefined); }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        /* If no icon but cover exists, add spacing */
                        activeNote.cover ? <div className="mt-12" /> : <div className="mt-20" />
                      )}
                    </div>

                    {/* Title & Metadata Controls */}
                    <div className="group relative mb-8">
                      {/* Controls (Add Icon/Cover) - Visible on hover if not present */}
                      <div className="flex justify-between items-start">
                        <div data-html2canvas-ignore="true" className={cn(
                          "flex items-center gap-4 text-xs text-muted-foreground mb-4 opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 left-0",
                          (activeNote.icon || activeNote.cover) && "static opacity-100 h-auto mb-2"
                        )}>
                          {!activeNote.icon && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="hover:text-foreground flex items-center gap-1.5 transition-colors">
                                  <Smile className="w-4 h-4 text-muted-foreground/70" />
                                  Add icon
                                </button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0 border-none bg-transparent shadow-none" align="start">
                                <EmojiPicker
                                  onEmojiClick={(emoji) => updateNoteProperty('icon', emoji.emoji)}
                                  theme={appSettings.theme === 'dark' ? Theme.DARK : Theme.LIGHT}
                                  skinTonesDisabled
                                  searchDisabled={false}
                                  width={350}
                                  height={400}
                                />
                              </PopoverContent>
                            </Popover>
                          )}
                          {!activeNote.cover && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <button className="hover:text-foreground flex items-center gap-1.5 transition-colors">
                                  <ImageIcon className="w-4 h-4 text-muted-foreground/70" />
                                  Add cover
                                </button>
                              </PopoverTrigger>
                              <PopoverContent align="start" className="w-80 p-0">
                                <Tabs defaultValue="presets" className="w-full">
                                  <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
                                    <TabsTrigger value="presets" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                                      Presets
                                    </TabsTrigger>
                                    <TabsTrigger value="custom" className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent">
                                      Custom
                                    </TabsTrigger>
                                  </TabsList>

                                  <TabsContent value="presets" className="p-3">
                                    <div className="space-y-4">
                                      <div>
                                        <h4 className="text-xs font-medium text-muted-foreground mb-2">Colors</h4>
                                        <div className="grid grid-cols-6 gap-1.5">
                                          {SOLID_COLORS.map((color) => (
                                            <div
                                              key={color}
                                              className={cn("w-8 h-8 rounded-md cursor-pointer hover:scale-105 transition-transform border border-black/5", color)}
                                              onClick={() => updateNoteProperty('cover', color)}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                      <div>
                                        <h4 className="text-xs font-medium text-muted-foreground mb-2">Gradients</h4>
                                        <div className="grid grid-cols-4 gap-1.5">
                                          {GRADIENTS.map((gradient) => (
                                            <div
                                              key={gradient}
                                              className={cn("w-12 h-8 rounded-md cursor-pointer hover:scale-105 transition-transform", gradient)}
                                              onClick={() => updateNoteProperty('cover', gradient)}
                                            />
                                          ))}
                                        </div>
                                      </div>
                                    </div>
                                  </TabsContent>

                                  <TabsContent value="custom" className="p-3">
                                    <div className="space-y-4">
                                      <div>
                                        <div className="space-y-2">
                                          <h4 className="text-xs font-medium text-muted-foreground">Solid Color</h4>
                                          <div className="flex items-center gap-3">
                                            <input
                                              type="color"
                                              className="h-10 w-20 p-1 rounded cursor-pointer border bg-transparent"
                                              onChange={(e) => updateNoteProperty('cover', e.target.value)}
                                            />
                                            <div className="text-xs text-muted-foreground">Pick a custom solid color</div>
                                          </div>
                                        </div>

                                        <div className="space-y-2 pt-2 border-t">
                                          <h4 className="text-xs font-medium text-muted-foreground">Gradient Builder</h4>
                                          <div className="flex items-center gap-2">
                                            <input
                                              type="color"
                                              value={customColor1}
                                              onChange={(e) => setCustomColor1(e.target.value)}
                                              className="h-8 w-12 p-0.5 rounded cursor-pointer border bg-transparent"
                                            />
                                            <span className="text-xs text-muted-foreground">to</span>
                                            <input
                                              type="color"
                                              value={customColor2}
                                              onChange={(e) => setCustomColor2(e.target.value)}
                                              className="h-8 w-12 p-0.5 rounded cursor-pointer border bg-transparent"
                                            />
                                            <Button
                                              size="sm"
                                              variant="secondary"
                                              className="ml-auto text-xs h-8"
                                              onClick={() => updateNoteProperty('cover', `linear-gradient(to right, ${customColor1}, ${customColor2})`)}
                                            >
                                              Apply Gradient
                                            </Button>
                                          </div>
                                          <div
                                            className="h-8 w-full rounded-md mt-2 border border-black/5"
                                            style={{ background: `linear-gradient(to right, ${customColor1}, ${customColor2})` }}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  </TabsContent>
                                </Tabs>
                              </PopoverContent>
                            </Popover>
                          )}
                        </div>

                        {/* Page Options Menu (Three Dots) - Removed as requested */}
                      </div>

                      <Input
                        ref={titleInputRef}
                        value={activeNote.title}
                        onChange={(e) => updateTitle(e.target.value)}
                        className="text-5xl font-bold border-none shadow-none px-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent h-auto placeholder:text-muted-foreground/20 leading-tight text-foreground w-full"
                        placeholder="Untitled"
                      />
                      <div className="h-px w-full bg-border mt-4 mb-8" />
                    </div>

                    <div className="relative min-h-[500px]" id="note-editor-content">
                      <Editor 
                        ref={editorRef}
                        key={activeNote?.id}
                        noteId={activeNote?.id || ''}
                        value={editorValue}
                        onChange={(nextValue: any) => {
                          setEditorValue(nextValue);
                          handleContentChange(nextValue);
                        }}
                      />
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-64 max-h-[300px] overflow-y-auto">
                  <ContextMenuItem onClick={() => handleRename(activeNote)}>
                    <FileText className="w-4 h-4 mr-2 text-muted-foreground" /> Rename
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => duplicateNote(activeNote)}>
                    <Copy className="w-4 h-4 mr-2 text-muted-foreground" /> Duplicate
                  </ContextMenuItem>
                  <ContextMenuItem onClick={() => setPendingDownloadId(activeNote.id)}>
                    <Download className="w-4 h-4 mr-2 text-muted-foreground" /> Export PDF
                  </ContextMenuItem>

                  <ContextMenuSeparator />
                  
                  <ContextMenuItem 
                    onClick={() => setDeleteDialog({ isOpen: true, noteId: activeNote.id })}
                    className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-950/30"
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Delete Note
                  </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            </ScrollArea>

            {/* Dialogs */}
            <AlertDialog open={deleteDialog.isOpen} onOpenChange={(open) => setDeleteDialog(prev => ({ ...prev, isOpen: open }))}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete your note and remove it from our servers.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    className="bg-red-600 hover:bg-red-700 text-white"
                    onClick={() => {
                      if (deleteDialog.noteId) {
                        deleteNote({ stopPropagation: () => {} } as any, deleteDialog.noteId);
                        setDeleteDialog({ isOpen: false, noteId: null });
                      }
                    }}
                  >
                    Delete Note
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Dialog open={renameDialog.isOpen} onOpenChange={(open) => setRenameDialog(prev => ({ ...prev, isOpen: open }))}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Rename Note</DialogTitle>
                </DialogHeader>
                <div className="flex items-center space-x-2 py-4">
                  <div className="grid flex-1 gap-2">
                    <Input
                      id="note-title"
                      value={renameDialog.title}
                      onChange={(e) => setRenameDialog(prev => ({ ...prev, title: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') confirmRename();
                        if (e.key === 'Escape') setRenameDialog(prev => ({ ...prev, isOpen: false }));
                      }}
                      autoFocus
                    />
                  </div>
                </div>
                <DialogFooter className="sm:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setRenameDialog(prev => ({ ...prev, isOpen: false }))}
                  >
                    Cancel
                  </Button>
                  <Button type="button" onClick={confirmRename}>
                    Save changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border flex items-center justify-center mb-2 shadow-sm">
              <FileText className="w-8 h-8 opacity-20" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-medium text-foreground">Select a page to start writing</h3>
              <p className="text-xs text-muted-foreground max-w-[200px]">Choose an existing page from the sidebar or create a new one.</p>
            </div>
            <Button variant="outline" size="sm" onClick={createNewNote} className="h-8 gap-2 bg-white dark:bg-white/5 border shadow-sm hover:bg-zinc-50 dark:hover:bg-white/10 transition-all">
              <Plus className="w-4 h-4" />
              <span>Create new page</span>
            </Button>
          </div>
        )}
        
        {/* Floating AI Panel */}
        <FloatingAI isOpen={isAIOpen} onClose={() => setIsAIOpen(false)} />
      </div>
    </div>
  );
}
