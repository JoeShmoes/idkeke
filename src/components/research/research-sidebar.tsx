
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
          <div className="p-2 space-y-2">
            {filteredSessions.map(session => (
              <div
                key={session.id}
                onClick={() => onSelectSession(session.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all cursor-pointer relative group',
                  activeSessionId === session.id
                    ? 'bg-primary/10 border-primary/20 shadow-sm'
                    : 'bg-card hover:bg-accent/50 border-transparent hover:border-border'
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
                            setSessionToDelete(session.id);
                        }}
                    >
                        <Trash2 className="h-3 w-3" />
                    </Button>
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
