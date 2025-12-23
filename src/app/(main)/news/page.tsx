
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, ExternalLink, Newspaper, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SearchResult } from '@/lib/types';


export default function NewsPage() {
    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [articles, setArticles] = useState<SearchResult[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [headerText, setHeaderText] = useState("Today's Briefing");

    useEffect(() => {
        setIsClient(true);
    }, []);


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

                <form className="flex items-center gap-2 mt-8 w-full max-w-2xl mx-auto">
                    <Input
                        placeholder="Search global news..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="text-base h-12 flex-1"
                        disabled={true}
                    />
                    <Button type="submit" size="lg" className="h-12" disabled={true}>
                        <Search className="mr-2 h-4 w-4" />
                        Search
                    </Button>
                </form>
            </div>
            
            <div className="flex-1 overflow-y-auto">
                <div className="max-w-4xl mx-auto px-4">
                    <h2 className="text-xl font-semibold mb-6 pl-2">News search is unavailable in desktop app</h2>
                </div>
            </div>
        </div>
    );
}
