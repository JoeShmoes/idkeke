
'use client';

import { useState, useEffect } from 'react';
import { Skeleton } from '../ui/skeleton';
import { ExternalLink } from 'lucide-react';
import { ScrollArea } from '../ui/scroll-area';

interface NewsArticle {
    title: string;
    description: string;
    url: string;
    source: { name: string };
    publishedAt: string;
}

const sampleNews: NewsArticle[] = [
    {
        title: "Global Markets Rally on Positive Economic Outlook",
        description: "Stock markets worldwide saw significant gains as new data points to a stronger-than-expected economic recovery.",
        url: "#",
        source: { name: "Global Financial Times" },
        publishedAt: new Date().toISOString(),
    },
    {
        title: "Tech Giants Announce Major AI Collaboration",
        description: "In a landmark move, leading technology firms are joining forces to accelerate advancements in artificial intelligence.",
        url: "#",
        source: { name: "Tech Chronicle" },
        publishedAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
        title: "Central Bank Holds Interest Rates Steady Amid Inflation Concerns",
        description: "The central bank has decided to maintain current interest rates, adopting a wait-and-see approach to recent inflation data.",
        url: "#",
        source: { name: "Economy Today" },
        publishedAt: new Date(Date.now() - 7200000).toISOString(),
    },
    {
        title: "The Rise of Sustainable Investing: A New Paradigm",
        description: "ESG (Environmental, Social, and Governance) investing is no longer a niche strategy, as mainstream funds pour billions into sustainable assets.",
        url: "#",
        source: { name: "Sustainable Biz" },
        publishedAt: new Date(Date.now() - 10800000).toISOString(),
    },
    {
        title: "Venture Capital Funding Reaches Record High in Q2",
        description: "Startups are raising capital at an unprecedented rate, with venture capitalists deploying record amounts of cash into new ventures.",
        url: "#",
        source: { name: "Startup Weekly" },
        publishedAt: new Date(Date.now() - 14400000).toISOString(),
    }
];


export default function LatestNews() {
    const [news, setNews] = useState<NewsArticle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        async function fetchNews() {
            try {
                // Fetch real news from open API (Saurav.tech NewsAPI proxy)
                // Using 'business' category as it fits the app theme
                const response = await fetch('https://saurav.tech/NewsAPI/top-headlines/category/business/us.json');
                const data = await response.json();
                
                if (data.articles) {
                     setNews(data.articles.slice(0, 10).map((item: any) => ({
                        title: item.title,
                        description: item.description,
                        url: item.url,
                        source: item.source,
                        publishedAt: item.publishedAt
                     })));
                } else {
                    setNews(sampleNews); // Fallback
                }
            } catch (err: any) {
                // setError(err.message); // Don't show error, just fallback
                console.error("News fetch error:", err);
                setNews(sampleNews);
            } finally {
                setLoading(false);
            }
        }
        fetchNews();
        const interval = setInterval(fetchNews, 300000); // Refresh every 5 mins
        return () => clearInterval(interval);
    }, []);

    if (loading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </div>
        )
    }

    if (error) {
        return <p className="text-sm text-destructive">Could not load news feed.</p>
    }

    return (
        <ScrollArea className="h-80">
            <div className="space-y-4">
                {news.map((article, index) => (
                    <a 
                        key={index} 
                        href={article.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="block p-3 rounded-md hover:bg-secondary group"
                    >
                        <p className="text-sm font-medium leading-tight truncate group-hover:underline">{article.title}</p>
                        <div className="flex items-center justify-between mt-1">
                             <p className="text-xs text-muted-foreground">{article.source.name}</p>
                             <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100" />
                        </div>
                    </a>
                ))}
            </div>
        </ScrollArea>
    )
}
