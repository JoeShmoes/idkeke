
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import type { ResearchSession } from '@/lib/types';
import { ExternalLink, Search, Notebook, Image as ImageIcon } from 'lucide-react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { useDebounce } from '@/hooks/use-debounce';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import ImagePreviewDialog from './image-preview-dialog';

interface ResearchWorkspaceProps {
  session: ResearchSession | undefined;
  isLoading: boolean;
  onNotesUpdate: (sessionId: string, newNotes: string) => void;
}

export default function ResearchWorkspace({ session, isLoading, onNotesUpdate }: ResearchWorkspaceProps) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [loadingContent, setLoadingContent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notes, setNotes] = useState(session?.userNotes || '');
  const debouncedNotes = useDebounce(notes, 500);
  const [imageToPreview, setImageToPreview] = useState<string | null>(null);
  const articleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (session) {
        setNotes(session.userNotes || '');
    }
  }, [session]);

  useEffect(() => {
    if (session && debouncedNotes !== session.userNotes) {
        onNotesUpdate(session.id, debouncedNotes);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedNotes]);
  
  useEffect(() => {
    if (session?.articleUrl) {
      setLoadingContent(true);
      setHtmlContent(null);
      setError("Live article fetching is not available in the desktop app.");
      setLoadingContent(false);
    } else {
        setHtmlContent(null);
        setError(null);
        setLoadingContent(false);
    }
  }, [session?.articleUrl]);

  const handleArticleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName === 'IMG' && target.hasAttribute('src')) {
      e.preventDefault(); // This is the fix.
      setImageToPreview(target.getAttribute('src'));
    }
  }, []);

  if (!session && !isLoading) {
    return (
        <div className="h-full flex flex-col items-center justify-center text-muted-foreground text-center p-4">
            <Search className="h-16 w-16 mb-4" />
            <h2 className="text-xl font-semibold">Research Workspace</h2>
            <p>Select a session from the sidebar or start a new search.</p>
        </div>
    );
  }

  if (isLoading) {
    return (
        <div className="p-8 space-y-4 animate-pulse">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <div className="h-px bg-border my-6" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
        </div>
    )
  }

  if (!session) return null;


  return (
    <>
    <div className="h-full flex flex-col bg-background">
        <header className="flex-shrink-0 p-4 border-b flex items-center justify-between min-h-[69px]">
            <h1 className="text-2xl font-bold truncate pr-4">{session.topic}</h1>
            {session.articleUrl && (
                <Button variant="ghost" size="sm" asChild>
                    <a href={session.articleUrl} target="_blank" rel="noopener noreferrer">
                        View Original <ExternalLink className="h-4 w-4 ml-2"/>
                    </a>
                </Button>
            )}
        </header>
        
        <ResizablePanelGroup direction="horizontal" className="flex-1">
            <ResizablePanel defaultSize={60}>
                <ScrollArea className="h-full">
                     <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                        <article 
                            ref={articleRef}
                            onClick={handleArticleClick}
                            className="prose prose-sm dark:prose-invert max-w-none [&_img]:cursor-pointer [&_img]:rounded-md [&_img]:border"
                        >
                            <h2 className="text-xl font-semibold border-b pb-2 mb-4">{session.articleTitle}</h2>
                            {loadingContent ? (
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-4 w-full" />
                                    <Skeleton className="h-20 w-full" />
                                    <Skeleton className="h-4 w-5/6" />
                                </div>
                            ) : error ? (
                                <p className="text-destructive text-center p-4">{error}</p>
                            ) : (
                                <div dangerouslySetInnerHTML={{ __html: htmlContent || '' }}/>
                            )}
                        </article>
                    </div>
                </ScrollArea>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={40} minSize={25}>
                 <div className="h-full flex flex-col">
                    <div className="flex-shrink-0 p-4 border-b flex items-center gap-2">
                        <Notebook className="h-5 w-5"/>
                        <h2 className="text-lg font-semibold">My Notes</h2>
                    </div>
                    <ScrollArea className="flex-1">
                        <Textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Start typing your notes here..."
                            className="w-full h-full p-6 border-none resize-none shadow-none focus-visible:ring-0 !ring-offset-0 text-base bg-transparent leading-relaxed"
                        />
                    </ScrollArea>
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
    </div>
    <ImagePreviewDialog
        isOpen={!!imageToPreview}
        onOpenChange={(open) => !open && setImageToPreview(null)}
        imageUrl={imageToPreview}
    />
    </>
  );
}
