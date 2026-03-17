
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ResearchSidebar from '@/components/research/research-sidebar';
import ResearchWorkspace from '@/components/research/research-workspace';
import { useApp } from '@/components/layout/app-provider';
import type { ResearchSession } from '@/lib/types';
import { Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

const SearchInput = ({ onSearch, isLoading }: { onSearch: (query: string) => void, isLoading: boolean }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch(query);
    }

    return (
        <form onSubmit={handleSubmit} className="flex w-full max-w-md items-center space-x-2">
            <Input
                type="text"
                placeholder="Enter a topic to research..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 text-base"
                disabled={isLoading}
            />
            <Button type="submit" size="lg" className="h-12" disabled={isLoading || !query.trim()}>
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Search className="h-5 w-5" />}
            </Button>
        </form>
    );
};


export default function ResearchPage() {
    const { researchSessions, setResearchSessions } = useApp();
    const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
    const searchParams = useSearchParams();
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const activeSession = isClient ? researchSessions.find(s => s.id === activeSessionId) : undefined;

    const handleNewSearch = useCallback(async (topic: string) => {
        if (!topic.trim()) return;
        setIsLoading(true);

        try {
            let searchData;
            let summaryData;

            // Step 1: Search for the best matching page title
            if (typeof window !== 'undefined' && (window as any).electron) {
                 // Electron: Use IPC
                 searchData = await (window as any).electron.ipcRenderer.invoke('wiki-search', topic);
            } else {
                 // Web: Use Fetch
                 const searchRes = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(topic)}&format=json&origin=*`);
                 searchData = await searchRes.json();
            }

            if (searchData.error) throw new Error(searchData.error);
            
            let bestTitle = topic;
            if (searchData.query?.search?.length > 0) {
                bestTitle = searchData.query.search[0].title;
            }

            // Step 2: Fetch summary for the best title
            if (typeof window !== 'undefined' && (window as any).electron) {
                 // Electron: Use IPC
                 summaryData = await (window as any).electron.ipcRenderer.invoke('wiki-summary', bestTitle);
            } else {
                 // Web: Use Fetch
                 const response = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle)}`);
                 if (!response.ok) throw new Error('Summary fetch failed');
                 summaryData = await response.json();
            }
            
            if (summaryData.error) throw new Error(summaryData.error);
            
            const data = summaryData;

            const newSession: ResearchSession = {
                id: `research-${Date.now()}`,
                topic: data.title || bestTitle,
                summary: data.extract || "No summary available from Wikipedia.",
                keyPoints: [],
                userNotes: '',
                articleUrl: data.content_urls?.desktop?.page || `https://en.wikipedia.org/wiki/${encodeURIComponent(bestTitle.replace(/ /g, '_'))}`,
                articleTitle: data.title || bestTitle,
                createdAt: new Date().toISOString(),
            };

            setResearchSessions(prev => [newSession, ...prev]);
            setActiveSessionId(newSession.id);
        } catch (error) {
            console.error("Wikipedia fetch error:", error);
             const newSession: ResearchSession = {
                id: `research-${Date.now()}`,
                topic: topic,
                summary: "Could not fetch summary from Wikipedia. Please check your connection or try a different topic.",
                keyPoints: [],
                userNotes: '',
                articleUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/ /g, '_'))}`,
                articleTitle: topic,
                createdAt: new Date().toISOString(),
            };
            setResearchSessions(prev => [newSession, ...prev]);
            setActiveSessionId(newSession.id);
        } finally {
            setIsLoading(false);
        }
        
    }, [setResearchSessions]);

    useEffect(() => {
        const queryFromUrl = searchParams.get('query');
        if (queryFromUrl && isClient) {
            const existingSession = researchSessions.find(s => s.topic.toLowerCase() === queryFromUrl.toLowerCase());
            if (existingSession) {
                setActiveSessionId(existingSession.id);
                router.replace('/research');
            } else {
                handleNewSearch(queryFromUrl);
                router.replace('/research');
            }
        } else if (isClient && researchSessions.length > 0 && !activeSessionId && !isLoading) {
            setActiveSessionId(researchSessions[0].id);
        }
    }, [searchParams, isClient, researchSessions, handleNewSearch, activeSessionId, isLoading, router]);
    
    
    const handleSelectSession = (sessionId: string) => {
        setActiveSessionId(sessionId);
    }
    
    const handleDeleteSession = (sessionId: string) => {
        setResearchSessions(prev => {
            const updatedSessions = prev.filter(s => s.id !== sessionId);
            if (activeSessionId === sessionId) {
                setActiveSessionId(updatedSessions.length > 0 ? updatedSessions[0].id : null);
            }
            return updatedSessions;
        });
    };
    
    const handleNotesUpdate = (sessionId: string, newNotes: string) => {
        setResearchSessions(prev => prev.map(s => s.id === sessionId ? { ...s, userNotes: newNotes } : s));
    }
    
    if (isLoading && researchSessions.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground gap-4">
                <Loader2 className="h-10 w-10 animate-spin" />
                <p className="text-lg">Performing research...</p>
                <p>This may take a moment.</p>
            </div>
        )
    }

    if (researchSessions.length === 0 && !isLoading) {
        return (
            <div className="flex h-full flex-col items-center justify-center text-muted-foreground gap-6 text-center">
                 <Search className="h-12 w-12" />
                 <h2 className="text-2xl font-semibold">Start Your Research</h2>
                 <p className="max-w-md">Enter a topic below to begin a new research session. The app will find a relevant article for you to read and take notes on.</p>
                 <SearchInput onSearch={handleNewSearch} isLoading={isLoading} />
                 <Button variant="link" onClick={() => handleNewSearch('Quantum Computing')} disabled={isLoading}>
                    Or try a sample search: Quantum Computing
                </Button>
            </div>
        );
    }

    return (
        <ResizablePanelGroup direction="horizontal" className="h-full w-full">
            <ResizablePanel defaultSize={25} minSize={20} maxSize={35}>
                 <ResearchSidebar 
                    sessions={researchSessions}
                    activeSessionId={activeSessionId}
                    onSelectSession={handleSelectSession}
                    onDeleteSession={handleDeleteSession}
                    onNewSearch={handleNewSearch}
                />
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={75}>
                <ResearchWorkspace 
                    session={activeSession} 
                    isLoading={isLoading} 
                    onNotesUpdate={handleNotesUpdate}
                />
            </ResizablePanel>
        </ResizablePanelGroup>
    );
}
