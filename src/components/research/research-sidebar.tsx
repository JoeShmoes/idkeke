
'use client';

import { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Trash2, X, ExternalLink, Copy } from 'lucide-react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import type { ResearchSession } from '@/lib/types';

interface ResearchSidebarProps {
  sessions: ResearchSession[];
  activeSessionId: string | null;
  onSelectSession: (sessionId: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onNewSearch: (topic: string) => void;
}

export default function ResearchSidebar({
  sessions,
  activeSessionId,
  onSelectSession,
  onDeleteSession,
  onNewSearch
}: ResearchSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sessionToDelete, setSessionToDelete] = useState<string | null>(null);
  const [isBulkDeleteConfirmOpen, setIsBulkDeleteConfirmOpen] = useState(false);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectionBox, setSelectionBox] = useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
    isSelecting: boolean;
  } | null>(null);

  // Safe clipboard copy
  const copyToClipboard = async (text: string) => {
    try {
      if (typeof window === 'undefined' || !document.hasFocus()) return;
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.error("Clipboard blocked:", err);
    }
  };

  const filteredSessions = sessions.filter(session =>
    session.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.articleTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore shortcuts if user is typing in an input/textarea
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') {
        return;
      }

      // Delete: Ctrl + Shift + Backspace OR Delete key
      if ((e.ctrlKey && e.shiftKey && e.key === 'Backspace') || e.key === 'Delete') {
        if (selectedIds.length > 0) {
          e.preventDefault();
          setIsBulkDeleteConfirmOpen(true);
        }
      }
      
      // Select All: Ctrl + A
      if (e.ctrlKey && e.key === 'a') {
        e.preventDefault();
        setSelectedIds(filteredSessions.map(s => s.id));
      }

      // Escape to clear selection
      if (e.key === 'Escape') {
        setSelectedIds([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, filteredSessions, onDeleteSession]);

  // Mouse Selection Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignore if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, a, input, [role="dialog"]')) return;

    if (!e.shiftKey && !e.ctrlKey) {
      setSelectedIds([]);
    }

    setSelectionBox({
      startX: e.clientX,
      startY: e.clientY,
      currentX: e.clientX,
      currentY: e.clientY,
      isSelecting: true,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!selectionBox?.isSelecting) return;

    setSelectionBox(prev => prev ? { ...prev, currentX: e.clientX, currentY: e.clientY } : null);

    const selectionRect = {
      left: Math.min(selectionBox.startX, e.clientX),
      top: Math.min(selectionBox.startY, e.clientY),
      right: Math.max(selectionBox.startX, e.clientX),
      bottom: Math.max(selectionBox.startY, e.clientY),
    };

    const selectableElements = document.querySelectorAll('[data-selectable="true"]');
    const newSelectedIds = new Set(e.shiftKey || e.ctrlKey ? selectedIds : []);

    selectableElements.forEach(el => {
      const rect = el.getBoundingClientRect();
      const id = el.getAttribute('data-id');
      
      if (id && 
          rect.left < selectionRect.right &&
          rect.right > selectionRect.left &&
          rect.top < selectionRect.bottom &&
          rect.bottom > selectionRect.top) {
        newSelectedIds.add(id);
      }
    });

    setSelectedIds(Array.from(newSelectedIds));
  };

  const handleMouseUp = () => {
    if (selectionBox?.isSelecting) {
      setSelectionBox(null);
    }
  };

  const handleToggleSelection = (sessionId: string, e: React.MouseEvent) => {
    if (e.shiftKey && selectedIds.length > 0) {
        e.stopPropagation();
      const lastSelectedId = selectedIds[selectedIds.length - 1];
      const allIds = filteredSessions.map(s => s.id);
      const startIdx = allIds.indexOf(lastSelectedId);
      const endIdx = allIds.indexOf(sessionId);
      
      if (startIdx !== -1 && endIdx !== -1) {
        const start = Math.min(startIdx, endIdx);
        const end = Math.max(startIdx, endIdx);
        const rangeIds = allIds.slice(start, end + 1);
        
        setSelectedIds(prev => {
          const newSet = new Set(prev);
          rangeIds.forEach(id => newSet.add(id));
          return Array.from(newSet);
        });
      }
    } else if (e.ctrlKey) {
        e.stopPropagation();
      setSelectedIds(prev => 
        prev.includes(sessionId) 
          ? prev.filter(id => id !== sessionId)
          : [...prev, sessionId]
      );
    } else {
      if (selectedIds.length > 0) {
        setSelectedIds([]);
      }
      onSelectSession(sessionId);
    }
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
        onNewSearch(searchTerm);
        setSearchTerm('');
    }
  }

  const confirmDelete = () => {
    if (sessionToDelete) {
      onDeleteSession(sessionToDelete);
      setSessionToDelete(null);
    }
  };

  return (
    <div 
      className="h-full flex flex-col bg-secondary/30 border-r select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
        <div className="p-3 border-b">
            <h2 className="text-lg font-semibold px-2 mb-2">Research</h2>
             <form onSubmit={handleSearchSubmit}>
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search or new topic..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 h-9"
                    />
                </div>
             </form>
        </div>
      <ScrollArea className="flex-1">
        {filteredSessions.length > 0 ? (
          <div className="p-2 space-y-2">
            {filteredSessions.map(session => (
              <ContextMenu key={session.id}>
                <ContextMenuTrigger asChild>
                  <div
                    data-selectable="true"
                    data-id={session.id}
                    onClick={(e) => handleToggleSelection(session.id, e)}
                    className={cn(
                      'w-full text-left p-3 rounded-lg border transition-all cursor-pointer relative group',
                      activeSessionId === session.id
                        ? 'bg-primary/10 border-primary/20 shadow-sm'
                        : 'bg-card hover:bg-accent/50 border-transparent hover:border-border',
                      selectedIds.includes(session.id) && 'ring-2 ring-primary bg-primary/15'
                    )}
                  >
                    <div className="flex flex-col gap-1">
                        <div className="flex items-start justify-between">
                             <h3 className="font-medium text-sm truncate pr-6">{session.topic}</h3>
                        </div>
                        <p className="text-[10px] text-muted-foreground">
                          {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                    
                    <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-muted-foreground hover:text-destructive"
                            onClick={(e) => {
                                e.stopPropagation();
                                if (selectedIds.length > 1) {
                                  setIsBulkDeleteConfirmOpen(true);
                                } else {
                                  setSessionToDelete(session.id);
                                }
                            }}
                        >
                            <Trash2 className="h-3 w-3" />
                        </Button>
                    </div>
                  </div>
                </ContextMenuTrigger>
                <ContextMenuContent className="w-64 max-h-[300px] overflow-y-auto">
                    <ContextMenuItem onClick={() => copyToClipboard(session.topic)}>
                        <Search className="mr-2 h-4 w-4" />
                        Copy Topic
                    </ContextMenuItem>
                    <ContextMenuItem
                        className="text-destructive"
                        onClick={() => {
                          if (selectedIds.length > 1) {
                            setIsBulkDeleteConfirmOpen(true);
                          } else {
                            setSessionToDelete(session.id);
                          }
                        }}
                    >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Session
                    </ContextMenuItem>
                </ContextMenuContent>
              </ContextMenu>
            ))}
          </div>
        ) : (
            <div className="text-center p-4 text-sm text-muted-foreground">
                <p>No research sessions found.</p>
            </div>
        )}
      </ScrollArea>
      {/* Selection Box */}
      {selectionBox && selectionBox.isSelecting && (
        <div
          className="fixed border bg-primary/20 border-primary/50 pointer-events-none z-50"
          style={{
            left: Math.min(selectionBox.startX, selectionBox.currentX),
            top: Math.min(selectionBox.startY, selectionBox.currentY),
            width: Math.abs(selectionBox.currentX - selectionBox.startX),
            height: Math.abs(selectionBox.currentY - selectionBox.startY),
          }}
        />
      )}

      {/* Bulk Delete Toolbar */}
      {selectedIds.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 bg-foreground/5 backdrop-blur-md border border-border/50 rounded-full shadow-lg animate-in fade-in slide-in-from-bottom-4">
          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
            {selectedIds.length} selected
          </span>
          <div className="h-4 w-px bg-border/50" />
          <Button 
            variant="destructive" 
            size="sm" 
            className="h-7 px-3 rounded-full shadow-sm hover:shadow-md transition-all text-xs"
            onClick={(e) => {
                e.stopPropagation();
                setIsBulkDeleteConfirmOpen(true);
            }}
          >
            <Trash2 className="h-3 w-3 mr-1.5" />
            Delete
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-full ml-1 hover:bg-background/50"
            onClick={() => setSelectedIds([])}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Research Session</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this research session? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (sessionToDelete) {
                  onDeleteSession(sessionToDelete);
                  setSessionToDelete(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isBulkDeleteConfirmOpen} onOpenChange={setIsBulkDeleteConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This will permanently delete the {selectedIds.length} selected sessions. This action cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
                selectedIds.forEach(id => onDeleteSession(id));
                setSelectedIds([]);
                setIsBulkDeleteConfirmOpen(false);
            }}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
