
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
  const [error, setError] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  
  useEffect(() => {
    if (url) {
      setLoading(true);
      // Allow loading attempts
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
              summary: "Summary generated from " + url,
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
    <DialogContent className="max-w-[95vw] w-[900px] max-h-[calc(100dvh-50px)] rounded-[48px] border border-white/10 bg-[#0F0F0F] text-white shadow-2xl flex flex-col gap-0 overflow-hidden z-[300]">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 rounded-full bg-white/10 z-[310]" />
        
        <DialogHeader className="px-6 sm:px-10 pt-10 sm:pt-14 pb-6 sm:pb-8 border-b border-white/5 space-y-2">
            <div className="flex items-center justify-between gap-6">
                <div className="flex-1 min-w-0">
                    <DialogTitle className="text-xl sm:text-3xl font-black italic uppercase tracking-tighter text-white truncate">
                        {loading ? "Decrypting Article..." : error ? "Node Offline" : articleTitle || "Article Intelligence"}
                    </DialogTitle>
                    <DialogDescription className="text-[10px] font-bold opacity-40 uppercase tracking-[0.2em] text-white/60 truncate">
                        {url || "Resource Stream"}
                    </DialogDescription>
                </div>
                {url && (
                    <Button variant="ghost" size="icon" className="h-10 w-10 sm:h-14 sm:w-14 rounded-xl sm:rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white" asChild>
                        <a href={url} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-5 w-5" />
                        </a>
                    </Button>
                )}
            </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 relative">
            <div className="absolute inset-0 bg-white/[0.01] pointer-events-none" />
            <div className="flex flex-col h-full overflow-hidden">
                {loading ? (
                    <div className="p-10 space-y-6">
                        <Skeleton className="h-12 w-3/4 bg-white/5 rounded-2xl" />
                        <Skeleton className="h-6 w-1/2 bg-white/5 rounded-xl" />
                        <div className="space-y-4 pt-4">
                            <Skeleton className="h-4 w-full bg-white/5 rounded-lg" />
                            <Skeleton className="h-4 w-full bg-white/5 rounded-lg" />
                            <Skeleton className="h-4 w-5/6 bg-white/5 rounded-lg" />
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-10 text-center gap-4">
                        <div className="h-20 w-20 rounded-[32px] bg-destructive/10 flex items-center justify-center mb-4">
                            <X className="h-10 w-10 text-destructive" />
                        </div>
                        <h3 className="text-2xl font-black uppercase tracking-tight">Signal Lost</h3>
                        <p className="text-white/40 max-w-sm font-medium">{error}</p>
                    </div>
                ) : (
                    <ScrollArea className="h-full">
                        <div className="p-6 sm:p-10">
                            {htmlContent ? (
                                <div 
                                    className="prose prose-invert prose-indigo max-w-none prose-p:text-lg prose-p:leading-relaxed prose-headings:font-black prose-headings:italic prose-headings:uppercase prose-headings:tracking-tighter" 
                                    dangerouslySetInnerHTML={{ __html: htmlContent }} 
                                />
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
                                    <div className="h-24 w-24 rounded-[40px] bg-indigo-500/10 flex items-center justify-center">
                                        <Sparkles className="h-10 w-10 text-indigo-400" />
                                    </div>
                                    <div className="space-y-2">
                                        <h3 className="text-2xl font-black uppercase italic tracking-tighter">Remote Access Restricted</h3>
                                        <p className="text-white/40 max-w-md font-medium">Direct fetching is limited by CORS policies. Initialize a session to synthesize data or view source externally.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                )}
            </div>
        </div>

        <DialogFooter className="px-6 sm:px-10 py-6 sm:py-8 border-t border-white/5 bg-black/40 backdrop-blur-xl gap-4">
            <Button variant="ghost" onClick={onClose} className="h-14 sm:h-16 flex-1 rounded-[28px] font-bold text-white/40 hover:text-white hover:bg-white/5">
                Close
            </Button>
            <Button 
                onClick={handleStartSession} 
                disabled={!url || isSummarizing || isLoading}
                className="h-14 sm:h-16 flex-[2] rounded-[28px] font-black uppercase tracking-[0.2em] bg-indigo-500 hover:bg-indigo-600 text-white shadow-2xl shadow-indigo-500/30 gap-3 active:scale-95 transition-transform"
            >
                {isSummarizing ? "Synthesizing..." : "Initialize Session"}
            </Button>
        </DialogFooter>
    </DialogContent>
  );
}
