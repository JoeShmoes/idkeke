
'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Trash2 } from 'lucide-react';
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

  const filteredSessions = sessions.filter(session =>
    session.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    session.articleTitle.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
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
    <div className="h-full flex flex-col bg-secondary/30 border-r">
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
          <div className="p-2 space-y-1">
            {filteredSessions.map(session => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  'w-full text-left p-3 rounded-md group transition-colors cursor-pointer',
                  activeSessionId === session.id
                    ? 'bg-background shadow-sm'
                    : 'hover:bg-background/50'
                )}
              >
                <div className="flex items-start justify-between">
                    <div className="flex-1 pr-2">
                        <h3 className="font-semibold text-sm truncate">{session.topic}</h3>
                        <p className="text-xs text-muted-foreground mt-1 truncate">
                          {formatDistanceToNow(new Date(session.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={(e) => {
                                e.stopPropagation();
                                setSessionToDelete(session.id);
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
                <p>No research sessions found.</p>
            </div>
        )}
      </ScrollArea>
      <AlertDialog open={!!sessionToDelete} onOpenChange={(open) => !open && setSessionToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
                This action cannot be undone. This will permanently delete this research session and all its associated data.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setSessionToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
