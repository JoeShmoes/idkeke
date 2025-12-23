
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
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
    const [isClient, setIsClient] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    const activeSession = isClient ? researchSessions.find(s => s.id === activeSessionId) : undefined;

    const handleNewSearch = useCallback(async (topic: string) => {
        if (!topic.trim()) return;
        setIsLoading(true);

        const newSession: ResearchSession = {
            id: `research-${Date.now()}`,
            topic: topic,
            summary: "AI summary is unavailable in the desktop app.",
            keyPoints: [],
            userNotes: `# ${topic}\n\n`,
            articleUrl: `https://en.wikipedia.org/wiki/${encodeURIComponent(topic.replace(/ /g, '_'))}`,
            articleTitle: topic,
            createdAt: new Date().toISOString(),
        };

        setResearchSessions(prev => [newSession, ...prev]);
        setActiveSessionId(newSession.id);
        setIsLoading(false);
        
    }, [setResearchSessions]);

    useEffect(() => {
        const queryFromUrl = searchParams.get('query');
        if (queryFromUrl && isClient) {
            const existingSession = researchSessions.find(s => s.topic.toLowerCase() === queryFromUrl.toLowerCase());
            if (existingSession) {
                setActiveSessionId(existingSession.id);
            } else {
                handleNewSearch(queryFromUrl);
            }
        } else if (isClient && researchSessions.length > 0 && !activeSessionId) {
            setActiveSessionId(researchSessions[0].id);
        }
    }, [searchParams, isClient, researchSessions, handleNewSearch, activeSessionId]);
    
    
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
