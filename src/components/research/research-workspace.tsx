
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { cn, copyToClipboard } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '../ui/skeleton';
import type { ResearchSession } from '@/lib/types';
import { ExternalLink, Search, Notebook, Image as ImageIcon, Copy, Trash2 } from 'lucide-react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from "@/components/ui/context-menu";
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

    const [iframeHeight, setIframeHeight] = useState(800);

    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (event.data && event.data.type === 'resize' && typeof event.data.height === 'number') {
                setIframeHeight(event.data.height + 40); // Add some padding
            }
            if (event.data && event.data.type === 'navigate' && typeof event.data.href === 'string') {
                const href: string = event.data.href;
                // internal wikipedia-style links should be re-fetched via our proxy so we keep the same styling and scripting
                if (href.includes('/api/rest_v1/page/html/')) {
                    const segments = href.split('/');
                    const maybeTitle = segments[segments.length - 1] || '';
                    const title = decodeURIComponent(maybeTitle);
                    setLoadingContent(true);
                    setError(null);
                    const fetchPromise = (typeof window !== 'undefined' && (window as any).electron)
                        ? (window as any).electron.ipcRenderer.invoke('fetch-wiki', title)
                        : fetch(`/api/wiki?title=${encodeURIComponent(title)}`).then(res => {
                              if (!res.ok) throw new Error('Failed to load Wikipedia content');
                              return res.json();
                          });
                    fetchPromise
                      .then((data: any) => {
                          if (data.error) throw new Error(data.error);
                          if (data.html) {
                              setHtmlContent(data.html);
                          } else {
                              throw new Error('No HTML content returned');
                          }
                      })
                      .catch((err: any) => {
                          console.error('Wiki fetch error', err);
                          setHtmlContent(`<div class="p-4 text-center text-muted-foreground"><p>Could not load full article preview.</p><p class="mt-2 text-sm">${err.message || 'Unknown error'}</p></div>`);
                      })
                      .finally(() => setLoadingContent(false));
                } else {
                    // non-wiki links open externally
                    window.open(href, '_blank');
                }
            }
        };
        window.addEventListener('message', handleMessage);
        return () => window.removeEventListener('message', handleMessage);
    }, []);

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
      setError(null);
      
      // If it's a Wikipedia URL, try to fetch the HTML content
      if (session.articleUrl.includes('wikipedia.org')) {
        const titleMatch = session.articleUrl.match(/\/wiki\/([^#?]+)/);
        if (titleMatch && titleMatch[1]) {
           const title = decodeURIComponent(titleMatch[1]);
           
           let fetchPromise;
           if (typeof window !== 'undefined' && (window as any).electron) {
               // Electron: Use IPC
               fetchPromise = (window as any).electron.ipcRenderer.invoke('fetch-wiki', title);
           } else {
               // Web: Use API Proxy
               fetchPromise = fetch(`/api/wiki?title=${encodeURIComponent(title)}`).then(res => {
                    if (!res.ok) throw new Error('Failed to load Wikipedia content');
                    return res.json();
               });
           }

           fetchPromise
             .then((data: any) => {
                 if (data.error) throw new Error(data.error);
                 if (data.html) {
                     setHtmlContent(data.html);
                 } else {
                     throw new Error('No HTML content returned');
                 }
             })
             .catch((err: any) => {
                 console.error("Wiki fetch error", err);
                 setHtmlContent(`<div class="p-4 text-center text-muted-foreground"><p>Could not load full article preview.</p><p class="mt-2 text-sm">${err.message || 'Unknown error'}</p><p class="mt-4 text-sm font-semibold">${session.summary}</p></div>`);
             })
             .finally(() => setLoadingContent(false));
           return;
        }
      }

      // Fallback for non-wiki or failed parse
      setHtmlContent(`<p>${session.summary || 'No preview available.'}</p>`);
      setLoadingContent(false);
    } else {
        setHtmlContent(null);
        setError(null);
        setLoadingContent(false);
    }
  }, [session?.articleUrl, session?.summary]);

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
                        <ContextMenu>
                  <ContextMenuTrigger asChild>
                    <article 
                      ref={articleRef}
                      onClick={handleArticleClick}
                      className="prose prose-sm dark:prose-invert max-w-none [&_img]:cursor-pointer [&_img]:rounded-md [&_img]:border select-text"
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
                                <iframe 
                                    srcDoc={`
                                        <!DOCTYPE html>
                                        <html>
                                        <head>
                                                    <meta name="color-scheme" content="light dark">
                                            <style>
                                                :root {
                                                    color-scheme: light dark;
                                                }
                                                body { 
                                                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                                                    line-height: 1.6;
                                                    margin: 0;
                                                    padding: 1rem;
                                                    background-color: transparent;
                                                }
                                                
                                                /* Dynamic text color based on theme */
                                                body, p, h1, h2, h3, h4, h5, h6, li, span, div {
                                                    color: light-dark(#000000, #ffffff);
                                                }

                                                /* Fix for white text on white background in tables */
                                                table, th, td, .infobox, .wikitable {
                                                    background-color: light-dark(#ffffff, #1f1f1f) !important;
                                                    color: light-dark(#000000, #ffffff) !important;
                                                    border-color: light-dark(#ddd, #333) !important;
                                                }

                                                /* Ensure links are distinct */
                                                a { color: light-dark(#2563eb, #60a5fa); }

                                                img { max-width: 100%; height: auto; border-radius: 6px; }
                                                table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
                                                th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                                                @media (prefers-color-scheme: dark) {
                                                    th, td { border-color: #333; }
                                                }
                                                .infobox { 
                                                    float: right; 
                                                    margin: 0 0 1rem 1rem; 
                                                }
                                            </style>
                                            <script>
                                                // any clicks inside the injected document get forwarded to the React component via postMessage.
                                                // the parent can then decide how to handle navigation (e.g. reload wiki content).
                                                document.addEventListener('click', function(e) {
                                                    const anchor = e.target.closest && e.target.closest('a');
                                                    if (anchor && anchor.href) {
                                                        e.preventDefault();
                                                        window.parent.postMessage({ type: 'navigate', href: anchor.href }, '*');
                                                    }
                                                });
                                            </script>
                                                    border: 1px solid #ddd; 
                                                    background: #f9f9f9; 
                                                    padding: 10px; 
                                                    max-width: 300px;
                                                    font-size: 0.9em;
                                                }
                                                @media (prefers-color-scheme: dark) {
                                                     .infobox {
                                                         background: #1f1f1f;
                                                         border-color: #333;
                                                     }
                                                 }
                                             </style>
                                             <script>
                                                function sendHeight() {
                                                    const height = document.body.scrollHeight;
                                                    window.parent.postMessage({ type: 'resize', height: height }, '*');
                                                }
                                                window.addEventListener('load', sendHeight);
                                                window.addEventListener('resize', sendHeight);
                                                // Check periodically for dynamic content
                                                setInterval(sendHeight, 1000);
                                             </script>
                                         </head>
                                         <body>
                                             ${htmlContent || ''}
                                         </body>
                                         </html>
                                     `}
                                     className="w-full border-none"
                                     style={{ height: iframeHeight }}
                                     title="Research Content"
                                 />
                            )}
                        </article>
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-56">
                    <ContextMenuItem onClick={() => {
                      copyToClipboard(session.articleTitle || '');
                    }}>
                      <Copy className="mr-2 h-4 w-4" /> Copy Title
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => {
                      if (session.summary) {
                        copyToClipboard(session.summary);
                      }
                    }}>
                      <Copy className="mr-2 h-4 w-4" /> Copy Summary
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
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
                    <div className="flex-1 p-0 relative">
                <ContextMenu>
                  <ContextMenuTrigger className="h-full w-full block">
                    <Textarea 
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Start typing your notes here..."
                      className="absolute inset-0 w-full h-full p-6 border-none resize-none shadow-none focus-visible:ring-0 !ring-offset-0 text-base bg-transparent leading-relaxed rounded-none"
                    />
                  </ContextMenuTrigger>
                  <ContextMenuContent className="w-64 max-h-[300px] overflow-y-auto">
                    <ContextMenuItem onClick={() => copyToClipboard(notes)}>
                      <Copy className="mr-2 h-4 w-4" /> Copy Notes
                    </ContextMenuItem>
                    <ContextMenuItem onClick={() => setNotes('')} className="text-destructive">
                      <Trash2 className="mr-2 h-4 w-4" /> Clear Notes
                    </ContextMenuItem>
                  </ContextMenuContent>
                </ContextMenu>
              </div>
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
