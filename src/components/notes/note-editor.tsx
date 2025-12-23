
'use client';

import { useState, useEffect } from 'react';
import type { Note } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NotebookPen, Expand, Minimize } from 'lucide-react';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '../ui/button';
import { cn } from '@/lib/utils';

interface NoteEditorProps {
  note: Note | undefined;
  onNoteUpdate: (updatedNote: Partial<Note>) => void;
  isFocusMode?: boolean;
  onToggleFocusMode?: () => void;
}

export default function NoteEditor({ note, onNoteUpdate, isFocusMode, onToggleFocusMode }: NoteEditorProps) {
  const [title, setTitle] = useState(note?.title || '');
  const [content, setContent] = useState(note?.content || '');
  

  const debouncedTitle = useDebounce(title, 500);
  const debouncedContent = useDebounce(content, 500);

  useEffect(() => {
    setTitle(note?.title || '');
    setContent(note?.content || '');
  }, [note]);

  useEffect(() => {
    if (note && debouncedTitle !== note.title) {
        onNoteUpdate({ title: debouncedTitle });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTitle, note?.id]);

  useEffect(() => {
    if (note && debouncedContent !== note.content) {
        onNoteUpdate({ content: debouncedContent });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedContent, note?.id]);

  // Simple editor: no slash menu, no contentEditable formatting

  if (!note) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-muted-foreground p-4 text-center">
        <NotebookPen className="h-16 w-16 mb-4" />
        <p className="text-lg font-medium">No note selected</p>
        <p className="text-sm">Choose a note from the sidebar or create a new one to get started.</p>
      </div>
    );
  }
  
  return (
    <div className={cn("h-full flex flex-col bg-background", isFocusMode && "p-4")}>
        <div className="flex-shrink-0 flex items-center justify-end h-14 px-4">
            {onToggleFocusMode && (
              <Button variant="ghost" size="icon" onClick={onToggleFocusMode} title={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}>
                {isFocusMode ? <Minimize className="h-5 w-5" /> : <Expand className="h-5 w-5" />}
              </Button>
            )}
        </div>
        <ScrollArea className="flex-1">
            <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
                <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Note Title"
                className="text-4xl font-bold border-none shadow-none focus-visible:ring-0 !ring-offset-0 px-0 h-auto py-4 bg-transparent tracking-tight"
                />
                <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Start writing..."
                className="w-full p-0 border-none resize-none shadow-none focus-visible:ring-0 !ring-offset-0 text-base min-h-[calc(100vh-200px)] bg-transparent leading-relaxed"
                />
            </div>
        </ScrollArea>
    </div>
  );
}
