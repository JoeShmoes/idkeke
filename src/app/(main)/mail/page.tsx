'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Mail, Loader2, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function MailPage() {
    const [status, setStatus] = useState<'connecting' | 'ready' | 'error'>('connecting');
    const [retryCount, setRetryCount] = useState(0);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    
    // Inbox Zero runs on port 3002
    const MAIL_APP_URL = 'http://localhost:3002'; 
    const MAX_RETRIES = 10; // Max 5 seconds total (10 * 500ms)

    const checkServer = useCallback(async () => {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 500);

            await fetch(MAIL_APP_URL, { 
                mode: 'no-cors',
                signal: controller.signal,
                cache: 'no-store'
            });
            
            clearTimeout(timeoutId);
            setStatus('ready');
            return true;
        } catch (err) {
            return false;
        }
    }, [MAIL_APP_URL]);

    useEffect(() => {
        if (status !== 'connecting') return;

        let isMounted = true;
        let timer: NodeJS.Timeout;

        const poll = async () => {
            const isReady = await checkServer();
            if (!isMounted) return;
            
            if (!isReady) {
                setRetryCount(prev => {
                    if (prev >= MAX_RETRIES) {
                        // After 5 seconds, just show the iframe anyway!
                        setStatus('ready');
                        return prev;
                    }
                    return prev + 1;
                });
                timer = setTimeout(poll, 500);
            }
        };

        poll();

        return () => {
            isMounted = false;
            if (timer) clearTimeout(timer);
        };
    }, [checkServer, status]);

    const handleRetry = () => {
        setStatus('connecting');
        setRetryCount(0);
    };

    // Fast progress bar that fills up in 5 seconds
    const progress = Math.min((retryCount / MAX_RETRIES) * 100, 99);

    return (
        <div className="flex flex-col h-full w-full bg-background relative overflow-hidden">
            <div className="flex-1 relative w-full h-full">
                {status === 'connecting' && (
                    <div className="absolute inset-0 flex items-center justify-center bg-background z-20">
                        <div className="flex flex-col items-center gap-4">
                            <div className="relative">
                                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                                <Mail className="w-12 h-12 text-primary relative z-10 animate-bounce" />
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <h3 className="font-semibold text-lg">Warming up your Inbox...</h3>
                                <p className="text-sm text-muted-foreground">This should only take a few seconds</p>
                            </div>
                            <div className="w-48 h-1 bg-muted rounded-full overflow-hidden mt-2">
                                <div 
                                    className="h-full bg-primary transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    </div>
                )}

                <iframe 
                    ref={iframeRef}
                    src={MAIL_APP_URL} 
                    className="w-full h-full border-none"
                    title="Nexaris Mail"
                    allow="clipboard-write; microphone; camera"
                />
            </div>
        </div>
    );
}
