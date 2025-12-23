
'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FilePlus2, Trash2, Search } from 'lucide-react';
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
import type { Note } from '@/lib/types';
import { useHover } from '../layout/hover-context';

interface NoteSidebarProps {
  notes: Note[];
  activeNoteId: string | null;
  onNewNote: () => void;
  onDeleteNote: (noteId: string) => void;
  onSetActiveNoteId: (noteId: string) => void;
}

export default function NoteSidebar({
  notes,
  activeNoteId,
  onNewNote,
  onDeleteNote,
  onSetActiveNoteId,
}: NoteSidebarProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [noteToDelete, setNoteToDelete] = useState<string | null>(null);
  const { setHoveredItem } = useHover();

  const filteredNotes = Array.isArray(notes) ? notes.filter(note =>
    note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    note.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  ) : [];

  const confirmDeleteNote = () => {
    if (noteToDelete) {
      onDeleteNote(noteToDelete);
      setNoteToDelete(null);
    }
  };

  return (
    <div className="h-full flex flex-col bg-secondary/30 border-r">
        <div className="p-3 border-b">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-semibold px-2">All Notes</h2>
                <Button variant="ghost" size="icon" onClick={onNewNote} title="New Note">
                    <FilePlus2 className="h-5 w-5" />
                </Button>
            </div>
            <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                    placeholder="Search notes..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 h-9"
                />
            </div>
        </div>
      <ScrollArea className="flex-1">
        {filteredNotes.length > 0 ? (
          <div className="p-2 space-y-1">
            {filteredNotes.map(note => (
              <div
                key={note.id}
                onClick={() => onSetActiveNoteId(note.id)}
                onMouseEnter={() => setHoveredItem({ type: 'note', data: note })}
                onMouseLeave={() => setHoveredItem(null)}
                className={cn(
                  'w-full text-left p-3 rounded-md group transition-colors cursor-pointer',
                  activeNoteId === note.id
                    ? 'bg-background/80 shadow-sm'
                    : 'hover:bg-background/50'
                )}
              >
                <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2">
                        <h3 className="font-semibold text-sm truncate">{note.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
                        </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                                e.stopPropagation();
                                setNoteToDelete(note.id);
                            }}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
            <div className="text-center p-4 text-sm text-muted-foreground">
                <p>{notes.length > 0 ? 'No matching notes found.' : 'No notes yet. Create one!'}</p>
            </div>
        )}
      </ScrollArea>
      <AlertDialog open={!!noteToDelete} onOpenChange={(open) => !open && setNoteToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this note.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNoteToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteNote}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
