
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ExternalLink, Newspaper, Loader2, Calendar, Globe } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export default function NewsPage() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [articles, setArticles] = useState<SearchResult[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [selectedArticle, setSelectedArticle] = useState<SearchResult | null>(null);

    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        setIsClient(true);
        // Fetch top headlines on load
        fetchTopHeadlines();
    }, []);

    const fetchTopHeadlines = async () => {
        setLoading(true);
        setError(null);
        try {
            let data;
            // Check if running in Electron
            if (typeof window !== 'undefined' && (window as any).electron) {
                 data = await (window as any).electron.ipcRenderer.invoke('fetch-news', { type: 'headlines' });
            } else {
                 // Web fallback
                 const response = await fetch(`/api/news?type=headlines`);
                 data = await response.json();
            }
            
            if (data.error) {
                throw new Error(data.error);
            }

            if (data.articles) {
                setArticles(data.articles.map((item: any) => ({
                    title: item.title,
                    url: item.url,
                    source: { name: item.source.name },
                    publishedAt: item.publishedAt,
                    snippet: item.description || item.content || ''
                })));
            } else {
                 setArticles([]);
            }
        } catch (error: any) {
            console.error("Top headlines error:", error);
            setError(error.message || "Failed to load top headlines. Please check your connection or try again later.");
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!query.trim()) {
            // If search is cleared, go back to headlines
            fetchTopHeadlines();
            return;
        }
        setLoading(true);
        setError(null);
        try {
            let data;
            // Check if running in Electron
            if (typeof window !== 'undefined' && (window as any).electron) {
                 data = await (window as any).electron.ipcRenderer.invoke('fetch-news', { query });
            } else {
                 // Web fallback
                 const response = await fetch(`/api/news?q=${encodeURIComponent(query)}`);
                 data = await response.json();
            }

            if (data.error) {
                 throw new Error(data.error);
            }

            if (data.articles) {
                setArticles(data.articles.map((item: any) => ({
                    title: item.title,
                    url: item.url,
                    source: { name: item.source.name },
                    publishedAt: item.publishedAt,
                    snippet: item.description || item.content || ''
                })));
            } else {
                 setArticles([]);
            }
        } catch (error: any) {
            console.error("Search error:", error);
            setError(error.message || "Failed to search news. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    if (!isClient) {
        return null;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex flex-col items-center text-center mb-8">
                 <div className="flex items-center gap-4">
                    <Newspaper className="h-12 w-12 text-muted-foreground" />
                    <div>
                        <h1 className="text-3xl font-bold mt-2 text-left">News Room</h1>
                        <p className="text-muted-foreground text-left">Your daily briefing and research hub.</p>
                    </div>
                </div>

                <form onSubmit={handleSearch} className="flex items-center gap-2 mt-8 w-full max-w-2xl mx-auto">
                    <Input
                        placeholder="Search topics..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="text-base h-12 flex-1"
                        disabled={loading}
                    />
                    <Button type="submit" size="lg" className="h-12" disabled={loading}>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
                        Search
                    </Button>
                </form>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4 space-y-4 py-4">
                    {error ? (
                         <div className="flex flex-col items-center justify-center p-8 text-center">
                            <div className="p-4 rounded-full bg-destructive/10 mb-4">
                                <Newspaper className="h-8 w-8 text-destructive" />
                            </div>
                            <h3 className="text-lg font-semibold text-destructive mb-2">Something went wrong</h3>
                            <p className="text-muted-foreground max-w-sm">{error}</p>
                            <Button variant="outline" className="mt-4" onClick={() => fetchTopHeadlines()}>
                                Try Again
                            </Button>
                        </div>
                    ) : articles.length > 0 ? (
                        articles.map((article, index) => (
                            <Card 
                                key={index} 
                                className="hover:bg-secondary/50 transition-colors cursor-pointer"
                                onClick={() => setSelectedArticle(article)}
                            >
                                <CardContent className="p-4">
                                    <div className="block">
                                        <h3 className="font-semibold text-lg mb-2 text-primary">{article.title}</h3>
                                        <p className="text-muted-foreground text-sm line-clamp-2">{article.snippet}...</p>
                                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                                            <Badge variant="outline">{article.source.name}</Badge>
                                            {article.publishedAt && (
                                                <span>{(() => {
                                                    try {
                                                        return formatDistanceToNow(new Date(article.publishedAt), { addSuffix: true });
                                                    } catch (e) {
                                                        return '';
                                                    }
                                                })()}</span>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))
                    ) : (
                        !loading && (
                            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                                <Search className="h-12 w-12 mb-4 opacity-20" />
                                <p>No news articles found.</p>
                                <p className="text-sm">Try adjusting your search terms.</p>
                            </div>
                        )
                    )}
                </div>
            </div>

            <Dialog open={!!selectedArticle} onOpenChange={(open) => !open && setSelectedArticle(null)}>
                <DialogContent className="max-w-2xl">
                    {selectedArticle && (
                        <>
                            <DialogHeader>
                                <DialogTitle className="text-xl leading-snug">{selectedArticle.title}</DialogTitle>
                                <div className="text-sm text-muted-foreground flex items-center gap-2 mt-2">
                                    <Badge variant="secondary" className="flex items-center gap-1">
                                        <Globe className="h-3 w-3" />
                                        {selectedArticle.source.name}
                                    </Badge>
                                    {selectedArticle.publishedAt && (
                                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Calendar className="h-3 w-3" />
                                            {(() => {
                                                try {
                                                    return formatDistanceToNow(new Date(selectedArticle.publishedAt), { addSuffix: true });
                                                } catch (e) {
                                                    return '';
                                                }
                                            })()}
                                        </span>
                                    )}
                                </div>
                            </DialogHeader>
                            <div className="py-4 space-y-6">
                                {selectedArticle.urlToImage && (
                                    <div className="relative w-full h-48 rounded-lg overflow-hidden border bg-muted">
                                        <img 
                                            src={selectedArticle.urlToImage} 
                                            alt={selectedArticle.title}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                                <div className="space-y-4">
                                    <div className="prose prose-sm dark:prose-invert">
                                        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Summary</h4>
                                        <p className="text-base leading-relaxed">
                                            {selectedArticle.description || selectedArticle.content || "No summary available for this article."}
                                        </p>
                                    </div>
                                    
                                    <div className="bg-muted/50 p-4 rounded-lg border">
                                        <div className="flex items-center justify-between gap-4">
                                            <div className="text-sm text-muted-foreground">
                                                <p className="font-medium text-foreground mb-0.5">Full Article</p>
                                                Read the complete story on the source website.
                                            </div>
                                            <Button onClick={() => window.open(selectedArticle.url, '_blank')}>
                                                Read Full Article <ExternalLink className="ml-2 h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setSelectedArticle(null)}>Close</Button>
                            </DialogFooter>
                        </>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
