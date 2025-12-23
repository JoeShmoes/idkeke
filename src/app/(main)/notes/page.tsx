
'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import NoteSidebar from '@/components/notes/note-sidebar';
import NoteEditor from '@/components/notes/note-editor';
import { useApp } from '@/components/layout/app-provider';
import type { Note } from '@/lib/types';


export default function NotesPage() {
  const { notes, setNotes } = useApp();
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const noteIdFromUrl = searchParams.get('noteId');
    if (noteIdFromUrl && notes.some(n => n.id === noteIdFromUrl)) {
        setActiveNoteId(noteIdFromUrl);
    } else if (Array.isArray(notes) && notes.length > 0 && !notes.some(n => n.id === activeNoteId)) {
        setActiveNoteId(notes[0].id);
    }
  }, [searchParams, notes, activeNoteId]);

  const handleNewNote = () => {
    const newNote: Note = {
      id: Date.now().toString(),
      title: 'Untitled Note',
      content: '# Untitled Note\n\nStart writing your thoughts here...',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tags: [],
    };
    setNotes(prev => (Array.isArray(prev) ? [newNote, ...prev] : [newNote]));
    setActiveNoteId(newNote.id);
  };

  const handleDeleteNote = (noteId: string) => {
    setNotes(prev => {
        const notesArray = Array.isArray(prev) ? prev : [];
        const noteIndex = notesArray.findIndex(n => n.id === noteId);
        const updatedNotes = notesArray.filter(n => n.id !== noteId);
        
        if (activeNoteId === noteId) {
            if (updatedNotes.length === 0) {
                setActiveNoteId(null);
            } else if (noteIndex >= updatedNotes.length) {
                // If last note was deleted, select the new last note
                setActiveNoteId(updatedNotes[updatedNotes.length - 1].id);
            } else {
                // Otherwise, select the note at the same index
                setActiveNoteId(updatedNotes[noteIndex].id);
            }
        }
        return updatedNotes;
    });
  };

  const handleNoteUpdate = (updatedNote: Partial<Note>) => {
    setNotes(prev => Array.isArray(prev) ? prev.map(note =>
        note.id === activeNoteId
            ? { ...note, ...updatedNote, updatedAt: new Date().toISOString() }
            : note
    ) : []);
  };
  
  const activeNote = Array.isArray(notes) ? notes.find(n => n.id === activeNoteId) : undefined;

  if (!isClient) {
    return null; // Or a loading skeleton
  }
  
  if (isFocusMode) {
    return (
        <div className="h-full">
            <NoteEditor
                key={activeNote?.id}
                note={activeNote}
                onNoteUpdate={handleNoteUpdate}
                isFocusMode={isFocusMode}
                onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
            />
        </div>
    )
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full w-full">
      <ResizablePanel defaultSize={25} minSize={20} maxSize={40}>
        <NoteSidebar
            notes={notes}
            activeNoteId={activeNoteId}
            onNewNote={handleNewNote}
            onDeleteNote={handleDeleteNote}
            onSetActiveNoteId={setActiveNoteId}
        />
      </ResizablePanel>
      <ResizableHandle withHandle />
      <ResizablePanel defaultSize={75} minSize={60}>
        <NoteEditor
            key={activeNote?.id}
            note={activeNote}
            onNoteUpdate={handleNoteUpdate}
            isFocusMode={isFocusMode}
            onToggleFocusMode={() => setIsFocusMode(!isFocusMode)}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
}
