'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Trash2, Pencil, Plus, Search, MessageSquare, MoreHorizontal, PanelLeftClose, X, ExternalLink, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, copyToClipboard } from '@/lib/utils';
import Logo from '@/components/logo';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Chat {
  id: string;
  name: string;
  messages: any[];
  createdAt: Date | string;
  lastActivity: Date | string;
}

import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
  ContextMenuSeparator
} from '@/components/ui/context-menu';

interface AiSidebarProps {
  chats: AIChat[];
  currentChatId: string | null;
  switchChat: (id: string) => void;
  deleteChat: (id: string) => void;
  deleteChats: (ids: string[]) => void;
  renameChat: (id: string, newName: string) => void;
  onNewChat: () => void;
}

export default function AiSidebar({ 
  chats, 
  currentChatId, 
  switchChat, 
  deleteChat,
  deleteChats,
  renameChat, 
  onNewChat 
}: AiSidebarProps) {
  const [chatToRename, setChatToRename] = useState<Chat | null>(null);
  const [newName, setNewName] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
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

  const filteredChats = useMemo(() => 
    chats.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase())),
  [chats, searchQuery]);

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
        setSelectedIds(filteredChats.map(c => c.id));
      }

      // Escape to clear selection
      if (e.key === 'Escape') {
        setSelectedIds([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedIds, filteredChats, deleteChat]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Ignore if clicking on interactive elements
    if ((e.target as HTMLElement).closest('button, a, input, [role="menuitem"]')) return;

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

  const handleToggleSelection = (chatId: string, e: React.MouseEvent) => {
    if (e.shiftKey && selectedIds.length > 0) {
        e.stopPropagation();
      const lastSelectedId = selectedIds[selectedIds.length - 1];
      const allIds = filteredChats.map(c => c.id);
      const startIdx = allIds.indexOf(lastSelectedId);
      const endIdx = allIds.indexOf(chatId);
      
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
        prev.includes(chatId) 
          ? prev.filter(id => id !== chatId)
          : [...prev, chatId]
      );
    } else {
      setSelectedIds([chatId]);
      switchChat(chatId);
    }
  };


  const handleRenameClick = (chat: Chat) => {
    setChatToRename(chat);
    setNewName(chat.name);
  };

  const handleRenameSubmit = () => {
    if (chatToRename && newName.trim()) {
      renameChat(chatToRename.id, newName.trim());
      setChatToRename(null);
    }
  };

  const renderChatName = (name: string) => {
    // Simple parser for bold and italic
    const parts = name.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    return parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
            return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
            return <em key={i}>{part.slice(1, -1)}</em>;
        }
        return part;
    });
  };

  const groupedChats = useMemo(() => {
    const filtered = chats.filter(c => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const groups: Record<string, Chat[]> = {
      'Today': [],
      'Yesterday': [],
      'Previous 7 Days': [],
      'Older': []
    };

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);

    filtered.forEach(chat => {
      const date = new Date(chat.lastActivity);
      if (date >= today) {
        groups['Today'].push(chat);
      } else if (date >= yesterday) {
        groups['Yesterday'].push(chat);
      } else if (date >= lastWeek) {
        groups['Previous 7 Days'].push(chat);
      } else {
        groups['Older'].push(chat);
      }
    });

    // Sort within groups
    Object.keys(groups).forEach(key => {
      groups[key].sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime());
    });

    return groups;
  }, [chats, searchQuery]);

  return (
    <div 
      className="flex flex-col h-full bg-gradient-to-b from-background to-muted/20 relative select-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold pl-2">Alfred AI</h2>
          </div>
        </div>

        <Button onClick={onNewChat} className="w-full justify-start gap-2 shadow-sm" variant="default">
          <Plus className="h-4 w-4" />
          New Chat
        </Button>

        <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
                placeholder="Search chats..." 
                value={searchQuery} 
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 h-9 bg-background/50"
            />
        </div>
      </div>

      <ScrollArea className="flex-1 px-2">
        <div className="pb-4 space-y-6">
          {Object.entries(groupedChats).map(([group, groupChats]) => {
            if (groupChats.length === 0) return null;
            return (
              <div key={group} className="px-2">
                <h3 className="text-xs font-medium text-muted-foreground mb-2 px-2">{group}</h3>
                <div className="space-y-1">
                  {groupChats.map((chat) => (
                    <ContextMenu key={chat.id}>
                        <ContextMenuTrigger>
                            <div
                                data-selectable="true"
                                data-id={chat.id}
                                className={cn(
                                "group flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all duration-200 text-sm",
                                currentChatId === chat.id 
                                    ? "bg-accent text-accent-foreground font-medium" 
                                    : "hover:bg-accent/50 text-muted-foreground hover:text-foreground",
                                selectedIds.includes(chat.id) && "ring-2 ring-primary bg-primary/10"
                                )}
                                onClick={(e) => handleToggleSelection(chat.id, e)}
                            >
                                <MessageSquare className="h-4 w-4 shrink-0 opacity-70" />
                                <div className="flex-1 truncate">
                                    {renderChatName(chat.name)}
                                </div>
                                
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button 
                                            variant="ghost" 
                                            size="icon" 
                                            className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity ml-auto shrink-0"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <MoreHorizontal className="h-3 w-3" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={(e) => {
                                            e.stopPropagation();
                                            handleRenameClick(chat);
                                        }}>
                                            <Pencil className="h-4 w-4 mr-2" />
                                            Rename
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem 
                                            className="text-destructive focus:text-destructive"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (selectedIds.length > 1) {
                                                  setIsBulkDeleteConfirmOpen(true);
                                                } else {
                                                  deleteChat(chat.id);
                                                }
                                            }}
                                        >
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </ContextMenuTrigger>
                        <ContextMenuContent className="w-56">
                            <ContextMenuItem onClick={() => handleRenameClick(chat)}>
                                <Pencil className="h-4 w-4 mr-2" />
                                Rename
                            </ContextMenuItem>
                            <ContextMenuSeparator />
                            <ContextMenuItem 
                                className="text-destructive focus:text-destructive"
                                onClick={() => {
                                  if (selectedIds.length > 1) {
                                    setIsBulkDeleteConfirmOpen(true);
                                  } else {
                                    deleteChat(chat.id);
                                  }
                                }}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </ContextMenuItem>
                        </ContextMenuContent>
                    </ContextMenu>
                  ))}
                </div>
              </div>
            );
          })}
          
          {chats.length === 0 && (
             <div className="text-center py-8 text-sm text-muted-foreground px-4">
               No chats found. <br/>Start a new conversation!
             </div>
          )}
        </div>
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
            onClick={(e) => {
                e.stopPropagation();
                setSelectedIds([]);
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      <AlertDialog open={isBulkDeleteConfirmOpen} onOpenChange={setIsBulkDeleteConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This will permanently delete the {selectedIds.length} selected chats. This action cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                deleteChats(selectedIds);
                setSelectedIds([]);
                setIsBulkDeleteConfirmOpen(false);
              }}
            >
              Delete
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={!!chatToRename} onOpenChange={(open) => !open && setChatToRename(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
            <DialogDescription>
              Enter a new name for your chat.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Name
              </Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="col-span-3"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenameSubmit();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" onClick={handleRenameSubmit}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
