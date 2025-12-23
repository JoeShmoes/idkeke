
'use client';

import { useState, useEffect } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import { ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';
import { DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';
import type { ResearchSession } from '@/lib/types';


interface ArticleViewerProps {
  url: string | null;
  onClose: () => void;
  onSaveSession: (session: Omit<ResearchSession, 'id' | 'createdAt' | 'userNotes'>) => void;
  isLoading: boolean;
}

export default function ArticleViewer({ url, onClose, onSaveSession, isLoading }: ArticleViewerProps) {
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [articleTitle, setArticleTitle] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>("Live article fetching is not available in the desktop app.");
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  useEffect(() => {
    if (url) {
      setLoading(true);
      // In desktop app, we can't fetch live content.
      setLoading(false);
    } else {
        setHtmlContent(null);
        setArticleTitle('');
        setError(null);
        setLoading(false);
    }
  }, [url]);

  const handleStartSession = async () => {
      if (!url) return;
      setIsSummarizing(true);
      try {
          onSaveSession({
              topic: articleTitle || "New Session",
              summary: "AI summary is unavailable in the desktop app.",
              keyPoints: [],
              articleUrl: url,
              articleTitle: articleTitle || "New Session",
          });
          onClose();
      } catch (error) {
          console.error("Failed to save article session:", error);
      } finally {
          setIsSummarizing(false);
      }
  }

  return (
    <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b flex-row items-center justify-between space-y-0">
            <div className="flex flex-col gap-1.5">
                <DialogTitle className="truncate max-w-lg">
                    {loading ? "Loading Article..." : error ? "Error" : articleTitle || "Article Viewer"}
                </DialogTitle>
                <DialogDescription className="truncate max-w-lg">
                    {url}
                </DialogDescription>
            </div>
            <div className="flex items-center gap-1">
                {url && (
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </Button>
                )}
            </div>
        </DialogHeader>

        <div className="flex-grow min-h-0">
            <div className="flex flex-col h-full">
                {loading ? (
                    <div className="p-6 space-y-4">
                        <Skeleton className="h-8 w-3/4" />
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-5/6" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-4 w-full" />
                    </div>
                ) : error ? (
                    <div className="p-6 text-destructive text-center">
                        <p>Could not load article.</p>
                        <p className="text-xs">{error}</p>
                    </div>
                ) : htmlContent ? (
                    <ScrollArea className="h-full">
                        <div 
                            className="prose prose-sm dark:prose-invert max-w-none p-6" 
                            dangerouslySetInnerHTML={{ __html: htmlContent }} 
                        />
                    </ScrollArea>
                ) : (
                     <div className="p-6 text-center text-muted-foreground">
                        <p>Live article fetching is not available in the desktop app.</p>
                        <p className="text-xs mt-2">You can still start a session to take notes, and view the original article in your browser.</p>
                    </div>
                )}
            </div>
        </div>
         <DialogFooter className="p-4 border-t">
            <Button variant="outline" onClick={onClose}>Close</Button>
            <Button onClick={handleStartSession} disabled={!url || isSummarizing || isLoading}>
                {isSummarizing ? "Analyzing..." : "Start Research Session"}
            </Button>
        </DialogFooter>
    </DialogContent>
  );
}
