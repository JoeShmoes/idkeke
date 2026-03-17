'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/components/layout/app-provider';
import { 
  Bot, 
  Send, 
  X, 
  Loader2,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface CollabAIPanelProps {
  isOpen: boolean;
  onClose: () => void;
  getCanvasContext: () => { elements: any[], files: any[] };
}

export default function CollabAIPanel({ isOpen, onClose, getCanvasContext }: CollabAIPanelProps) {
  const { appSettings } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'greeting',
      role: 'assistant',
      content: "Hi! I'm Alfred. I can see your canvas — ask me to analyse it, suggest ideas, or write up notes based on what you've drawn.",
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Get the current Excalidraw state
      const ctx = getCanvasContext();
      
      // We only send text elements and basic shape counts to avoid enormous payloads
      // (Full image analysis would require generating a Blob and passing it to GPT-4o)
      const textElements = ctx.elements
        .filter(el => el.type === 'text')
        .map(el => el.text)
        .join('\n');
      
      const elementCounts = ctx.elements.reduce((acc, el) => {
        acc[el.type] = (acc[el.type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const canvasDescription = `
### Current Canvas Context (Excalidraw)
Shapes: ${JSON.stringify(elementCounts)}
Visible Text:
${textElements || '(No text on canvas yet)'}
`;

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg.content }
          ],
          context: canvasDescription
        })
      });

      if (!res.ok) throw new Error('Failed to fetch AI response');

      const data = await res.json();
      
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.response || "Sorry, I couldn't generate a response.",
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: "I encountered an error trying to process your request. Please try again.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="absolute top-4 right-4 bottom-4 w-[380px] bg-background border border-border rounded-xl shadow-2xl flex flex-col overflow-hidden z-[100] animate-in slide-in-from-right-8 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex flex-col items-center justify-center text-primary">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">Alfred AI</h3>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Canvas Assistant</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full hover:bg-muted">
          <X className="w-4 h-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scroll-smooth"
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              "flex flex-col max-w-[85%]",
              msg.role === 'user' ? "self-end items-end" : "self-start items-start"
            )}
          >
            <div
              className={cn(
                "px-4 py-2.5 rounded-2xl text-sm leading-relaxed",
                msg.role === 'user' 
                  ? "bg-primary text-primary-foreground rounded-br-sm" 
                  : "bg-muted text-foreground rounded-bl-sm border border-border/50"
              )}
            >
              <ReactMarkdown 
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-pre:my-2 prose-pre:bg-zinc-950 prose-pre:p-2 prose-pre:rounded-lg prose-code:text-xs prose-a:text-blue-500"
              >
                {msg.content}
              </ReactMarkdown>
            </div>
            <span className="text-[10px] text-muted-foreground mt-1 px-1">
              {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
        
        {isLoading && (
          <div className="self-start flex flex-col items-start gap-1 max-w-[85%]">
            <div className="px-4 py-3 rounded-2xl bg-muted rounded-bl-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">Alfred is thinking...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t bg-muted/10">
        <div className="relative flex items-end gap-2 bg-background border rounded-xl p-2 shadow-sm focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about this canvas..."
            className="min-h-[40px] max-h-[120px] resize-none border-0 focus-visible:ring-0 shadow-none p-2 text-sm bg-transparent"
            rows={1}
          />
          <Button 
            size="icon" 
            className={cn(
              "h-8 w-8 rounded-lg shrink-0 mb-1 transition-all duration-200",
              input.trim() ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted"
            )}
            disabled={!input.trim() || isLoading}
            onClick={handleSubmit}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex items-center justify-between px-2 pt-2">
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> Alfred can read your canvas text
          </span>
          <span className="text-[10px] text-muted-foreground">Press Enter to send</span>
        </div>
      </div>
    </div>
  );
}
