'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Loader2, ChevronDown, ListTodo, Languages, Search,
  Settings2, Mic, ArrowUp, Minus, FileText, Plus, Check,
  ExternalLink, Globe, Brain, Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { useApp } from '@/components/layout/app-provider';
import { useRouter } from 'next/navigation';
import type { Chat, Message as AppMessage } from '@/lib/types';
import { useSound } from '@/hooks/use-sound';
import { useToast } from '@/hooks/use-toast';
import { ChartRenderer } from '@/components/ai-room/chart-renderer';

// ─── Types ────────────────────────────────────────────────────────────────────
interface FloatingMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

type Mode = 'normal' | 'web' | 'think';

// ─── Rich Markdown Renderer (same capability as AI Room) ──────────────────────
const MessageRenderer = ({ content, router }: { content: string; router: ReturnType<typeof useRouter> }) => (
  <div className="prose prose-invert prose-sm max-w-none leading-relaxed">
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        code({ node, className, children, ...props }: any) {
          const match = /language-(\w+)/.exec(className || '');
          const lang = match?.[1];
          const raw = String(children).replace(/\n$/, '');

          // ── Render chart blocks ──
          const isChart =
            lang === 'chart' ||
            (lang === 'json' && raw.includes('"xAxisKey"') && raw.includes('"data"'));
          if (isChart && match) {
            try {
              const chartData = JSON.parse(raw);
              if (chartData.type && chartData.data) {
                return <ChartRenderer {...chartData} />;
              }
            } catch { /* fall through */ }
          }

          // ── Block code ──
          if (match) {
            return (
              <div className="relative my-3 rounded-lg bg-zinc-900 border border-white/[0.08] p-4 font-mono text-sm overflow-x-auto">
                {lang && (
                  <span className="absolute top-2 right-3 text-[10px] text-zinc-500 uppercase tracking-wider">{lang}</span>
                )}
                <code className={className} {...props}>{children}</code>
              </div>
            );
          }

          // ── Inline code ──
          return (
            <code className="bg-white/[0.08] px-1.5 py-0.5 rounded text-[13px] font-mono text-zinc-200" {...props}>
              {children}
            </code>
          );
        },
        table({ children }) {
          return (
            <div className="my-3 overflow-x-auto rounded-lg border border-white/[0.08]">
              <table className="w-full text-sm">{children}</table>
            </div>
          );
        },
        thead({ children }) { return <thead className="bg-white/[0.05]">{children}</thead>; },
        th({ children }) { return <th className="px-3 py-2 text-left text-xs font-semibold text-zinc-300 border-b border-white/[0.08] uppercase tracking-wider">{children}</th>; },
        td({ children }) { return <td className="px-3 py-2 text-[13px] text-zinc-200 border-b border-white/[0.04] last:border-b-0">{children}</td>; },
        tr({ children }) { return <tr className="hover:bg-white/[0.03] transition-colors">{children}</tr>; },
        p({ children }) { return <p className="mb-1.5 last:mb-0 leading-relaxed text-[14px]">{children}</p>; },
        ul({ children }) { return <ul className="list-disc ml-5 mb-2 space-y-0.5 text-[14px]">{children}</ul>; },
        ol({ children }) { return <ol className="list-decimal ml-5 mb-2 space-y-0.5 text-[14px]">{children}</ol>; },
        li({ children }) { return <li className="pl-0.5 leading-relaxed">{children}</li>; },
        h1({ children }) { return <h1 className="text-xl font-bold mt-4 mb-2 first:mt-0 text-white">{children}</h1>; },
        h2({ children }) { return <h2 className="text-lg font-semibold mt-3 mb-1.5 first:mt-0 text-white">{children}</h2>; },
        h3({ children }) { return <h3 className="text-base font-semibold mt-2 mb-1 first:mt-0 text-zinc-100">{children}</h3>; },
        blockquote({ children }) {
          return (
            <blockquote className="border-l-[3px] border-blue-500/50 pl-3 py-0.5 my-2 italic text-zinc-400 bg-blue-500/[0.05] rounded-r-lg">
              {children}
            </blockquote>
          );
        },
        a({ href, children }) {
          const isRelative = href && (href.startsWith('/') || href.startsWith('#'));
          return (
            <a
              href={href}
              onClick={isRelative ? (e) => { e.preventDefault(); router.push(href!); } : undefined}
              target={isRelative ? undefined : '_blank'}
              rel={isRelative ? undefined : 'noopener noreferrer'}
              className="text-blue-400 underline underline-offset-2 hover:text-blue-300 transition-colors cursor-pointer"
            >
              {children}
            </a>
          );
        },
      }}
    >
      {content}
    </ReactMarkdown>
  </div>
);

// ─── System prompt (full Alfred capabilities) ─────────────────────────────────
function buildSystemPrompt(
  userName: string,
  appContext: object,
  mode: Mode,
  memoryContext: string
): string {
  let prompt = `You are Alfred AI, a sophisticated personal assistant. You are loyal, helpful, and deeply personal.

The user's name is: ${userName}

PERSONALIZATION RULES:
- Address the user by first name naturally.
- Use memories to personalize responses.
${memoryContext}

Available app data:
${JSON.stringify(appContext, null, 2)}

CRITICAL RULE: NEVER say you don't have web browsing capabilities. Our backend automatically runs web searches. Answer as if you have full internet access!

IN-APP LINKS: When mentioning app sections, use relative markdown links:
- Dashboard: [/dashboard](/dashboard)
- Tasks: [/tasks](/tasks)
- AI Room: [/ai-room](/ai-room)
- Clients: [/clients](/clients)
- Notes: [/notes](/notes)
- Projects: [/project-board](/project-board)
- Budgeting: [/budgeting](/budgeting)
- File Vault: [/file-vault](/file-vault)
- Research: [/research](/research)

FORMATTING RULES:
- Use markdown for all formatting. Bold, italics, headers, lists.
- For math: use $$ for block equations, $ for inline.
- ALWAYS use pipe-based markdown tables (| col | col |). NEVER ASCII art tables.
- Keep lists tight — no double blank lines between list items.

IMAGES VS GRAPHS:
- If the user asks for a picture/photo/drawing: say "I am unable to make them right now but this feature is coming soon".
- If they ask for a graph, chart, plot, or pie chart: USE the \`\`\`chart block below — you CAN do this!

CHARTS — use this exact format:
\`\`\`chart
{
  "type": "bar" | "line" | "pie",
  "title": "Chart Title",
  "data": [{"name": "A", "value": 10}, {"name": "B", "value": 20}],
  "xAxisKey": "name",
  "dataKeys": ["value"],
  "nameKey": "name",
  "dataKey": "value",
  "colors": ["#8884d8", "#82ca9d"]
}
\`\`\``;

  if (mode === 'web') {
    prompt += `\n\nWEB SEARCH MODE: Focus on providing information from web sources. Be comprehensive. At the end, list sources:\n**Sources:**\n- Source Name: https://example.com`;
  } else if (mode === 'think') {
    prompt += `\n\nTHINKING MODE: Think step by step before answering. Show your reasoning clearly.`;
  }

  return prompt;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FloatingAI({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const {
    chats, setChats,
    userProfile, tasks, notes, clients, projects,
    accounts, transactions, aiMemories,
  } = useApp();
  const router = useRouter();
  const { playSound } = useSound();
  const { toast } = useToast();

  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<FloatingMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showChatPicker, setShowChatPicker] = useState(false);
  const [mode, setMode] = useState<Mode>('normal');

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const pickerRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // ── Block clipboard events from reaching Yoopta's window-level listener ──
  // Yoopta registers at window capture phase, so we must intercept at window too,
  // BEFORE Yoopta sees the event. We only block if the selection lives inside our panel.
  useEffect(() => {
    if (!isOpen) return;
    const panel = panelRef.current;
    if (!panel) return;

    const blockIfInsidePanel = (e: Event) => {
      const selection = window.getSelection();
      // Block if: selection anchor is inside our panel, OR the event target is inside our panel
      const targetInPanel = panel.contains(e.target as Node);
      const selectionInPanel = selection && selection.rangeCount > 0 &&
        panel.contains(selection.getRangeAt(0).commonAncestorContainer);

      if (targetInPanel || selectionInPanel) {
        e.stopImmediatePropagation(); // stops ALL other listeners at this level too
        // Let the browser handle the copy natively — don't preventDefault
      }
    };

    window.addEventListener('copy', blockIfInsidePanel, true);
    window.addEventListener('cut', blockIfInsidePanel, true);
    window.addEventListener('keydown', (e: KeyboardEvent) => {
      // Also block Ctrl+C / Ctrl+X keydowns so Yoopta can't intercept the shortcut
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'x' || e.key === 'a')) {
        const selection = window.getSelection();
        const targetInPanel = panel.contains(e.target as Node);
        const selectionInPanel = selection && selection.rangeCount > 0 &&
          panel.contains(selection.getRangeAt(0).commonAncestorContainer);
        if (targetInPanel || selectionInPanel) {
          e.stopImmediatePropagation();
        }
      }
    }, true);

    return () => {
      window.removeEventListener('copy', blockIfInsidePanel, true);
      window.removeEventListener('cut', blockIfInsidePanel, true);
    };
  }, [isOpen]);

  // Close chat picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowChatPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    const el = scrollContainerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const createNewChat = useCallback(() => {
    const id = crypto.randomUUID();
    const newChat: Chat = { id, name: 'New AI Chat', messages: [], createdAt: new Date(), lastActivity: new Date() };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(id);
    setMessages([]);
    setInput('');
    setShowChatPicker(false);
  }, [setChats]);

  // Init
  useEffect(() => {
    if (!isOpen) return;
    if (!activeChatId) {
      if (chats.length > 0) {
        const recent = [...chats].sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())[0];
        setActiveChatId(recent.id);
        setMessages((recent.messages || []).map((m: AppMessage) => ({
          id: m.id || crypto.randomUUID(),
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.text,
          timestamp: new Date(m.timestamp || Date.now()),
        })));
      } else {
        createNewChat();
      }
    }
  }, [isOpen, activeChatId, chats, createNewChat]);

  const switchToChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (!chat) return;
    setActiveChatId(chatId);
    setMessages((chat.messages || []).map((m: AppMessage) => ({
      id: m.id || crypto.randomUUID(),
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.text,
      timestamp: new Date(m.timestamp || Date.now()),
    })));
    setShowChatPicker(false);
  };

  const persistMessages = (chatId: string, msgs: FloatingMessage[]) => {
    const appMessages: AppMessage[] = msgs.map(m => ({
      id: m.id, sender: m.role === 'user' ? 'user' : 'alfred', text: m.content, timestamp: m.timestamp,
    }));
    setChats(prev => prev.map(c =>
      c.id === chatId
        ? { ...c, messages: appMessages, lastActivity: new Date(), name: msgs.length <= 2 ? (msgs.find(m => m.role === 'user')?.content.slice(0, 40) || 'New AI Chat') : c.name }
        : c
    ));
  };

  const handleSubmit = async () => {
    if (!input.trim() || isLoading) return;
    let chatId = activeChatId;
    if (!chatId) { createNewChat(); return; }

    const userMsg: FloatingMessage = { id: crypto.randomUUID(), role: 'user', content: input.trim(), timestamp: new Date() };
    const updatedMsgs = [...messages, userMsg];
    setMessages(updatedMsgs);
    setInput('');
    setIsLoading(true);

    try {
      const userName = userProfile?.firstName || userProfile?.name || 'there';
      const appContext = {
        userProfile,
        tasks: (tasks || []).slice(0, 10).map((t: any) => ({ id: t.id, name: t.name, status: t.status })),
        notes: (notes || []).slice(0, 5).map((n: any) => ({ id: n.id, title: n.title })),
        clients: (clients || []).slice(0, 5).map((c: any) => ({ id: c.id, name: c.name })),
        projects: (projects || []).slice(0, 5).map((p: any) => ({ id: p.id, name: p.name, status: p.status })),
        accounts: (accounts || []).slice(0, 5).map((a: any) => ({ id: a.id, name: a.name, balance: a.balance })),
        transactions: (transactions || []).slice(0, 5).map((t: any) => ({ description: t.description, amount: t.amount })),
      };

      // Build memory context
      const recentMemories = (aiMemories || []).slice(-30);
      let memoryContext = '';
      if (recentMemories.length > 0) {
        memoryContext = '\n\nMEMORY:\n' + recentMemories.map((m: any) => `- ${m.text}`).join('\n');
      }

      const systemPrompt = buildSystemPrompt(userName, appContext, mode, memoryContext);

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...updatedMsgs.slice(-10).map(m => ({ role: m.role, content: m.content })),
          ]
        })
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.details || errData.error || 'API error');
      }

      const data = await res.json();
      const aiMsg: FloatingMessage = {
        id: crypto.randomUUID(),
        role: 'assistant',
        content: data.content || data.response || "Sorry, I couldn't generate a response.",
        timestamp: new Date()
      };
      const finalMsgs = [...updatedMsgs, aiMsg];
      setMessages(finalMsgs);
      persistMessages(chatId, finalMsgs);
      playSound('notification');
      toast({ title: 'Alfred replied', description: aiMsg.content.slice(0, 80) + (aiMsg.content.length > 80 ? '…' : '') });

    } catch (error: any) {
      const errMsg: FloatingMessage = {
        id: crypto.randomUUID(), role: 'assistant',
        content: error.message && error.message !== 'API error'
          ? `I encountered an issue: ${error.message}`
          : "Something went wrong. Please check your connection and try again.",
        timestamp: new Date()
      };
      const finalMsgs = [...updatedMsgs, errMsg];
      setMessages(finalMsgs);
      persistMessages(chatId, finalMsgs);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const activeChat = chats.find(c => c.id === activeChatId);
  const chatName = activeChat?.name || 'New AI Chat';

  const modeConfig = {
    normal: { icon: <Sparkles className="w-3.5 h-3.5" />, label: 'Auto', color: 'text-zinc-400' },
    web:    { icon: <Globe    className="w-3.5 h-3.5" />, label: 'Web',  color: 'text-blue-400' },
    think:  { icon: <Brain   className="w-3.5 h-3.5" />, label: 'Think', color: 'text-purple-400' },
  };
  const nextMode: Record<Mode, Mode> = { normal: 'web', web: 'think', think: 'normal' };

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;

    const handleSelectStart = (e: Event) => e.stopPropagation();
    panel.addEventListener('selectstart', handleSelectStart, true);
    
    return () => {
      panel.removeEventListener('selectstart', handleSelectStart, true);
    };
  }, []);

  return (
    <div className="fixed right-4 bottom-4 md:right-6 md:bottom-6 z-[1000] pointer-events-none">
      <div
        ref={panelRef}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        className="w-[440px] bg-[#1a1a1c] border border-white/[0.08] rounded-2xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.7)] flex flex-col overflow-hidden max-h-[85vh] animate-in slide-in-from-bottom-5 fade-in duration-200 pointer-events-auto"
      >
        {/* ── Header ── */}
        <div className="relative flex items-center justify-between px-4 py-3 flex-shrink-0">
          <div ref={pickerRef} className="relative">
            <button
              onClick={() => setShowChatPicker(v => !v)}
              className="flex items-center gap-1.5 text-zinc-300 hover:text-white transition-colors text-sm font-medium hover:bg-white/5 px-2 py-1 -ml-2 rounded-lg max-w-[240px]"
            >
              <span className="truncate">{chatName}</span>
              <ChevronDown className={cn("w-4 h-4 opacity-70 flex-shrink-0 transition-transform", showChatPicker && "rotate-180")} />
            </button>

            {showChatPicker && (
              <div className="absolute top-full left-0 mt-1 w-[260px] bg-[#232325] border border-white/[0.1] rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                <div className="px-3 py-2 flex items-center justify-between border-b border-white/[0.06]">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Your Chats</span>
                  <button onClick={createNewChat} className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white hover:bg-white/10 py-1 px-2 rounded-md transition-colors">
                    <Plus className="w-3.5 h-3.5" /> New chat
                  </button>
                </div>
                <div className="max-h-[200px] overflow-y-auto py-1">
                  {chats.length === 0 ? (
                    <p className="px-4 py-3 text-xs text-zinc-500 text-center">No chats yet</p>
                  ) : (
                    [...chats].sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()).map(chat => (
                      <button
                        key={chat.id}
                        onClick={() => switchToChat(chat.id)}
                        className={cn(
                          "w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors",
                          chat.id === activeChatId ? "bg-white/[0.07] text-white" : "text-zinc-400 hover:bg-white/[0.05] hover:text-zinc-200"
                        )}
                      >
                        {chat.id === activeChatId && <Check className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />}
                        <span className={cn("truncate", chat.id !== activeChatId && "ml-[19px]")}>{chat.name}</span>
                      </button>
                    ))
                  )}
                </div>
                <div className="border-t border-white/[0.06] px-3 py-2">
                  <button onClick={() => { router.push('/ai-room'); onClose(); }} className="w-full flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-200 hover:bg-white/5 px-2 py-1.5 rounded-md transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" /> Open AI Room
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={createNewChat} className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10" title="New chat">
              <Plus className="w-[16px] h-[16px]" />
            </Button>
            <Button variant="ghost" size="icon" onClick={onClose} className="w-8 h-8 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10" aria-label="Close AI">
              <Minus className="w-[18px] h-[18px]" />
            </Button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div
          ref={scrollContainerRef}
          className="flex-1 min-h-0 overflow-y-auto px-4 scroll-smooth"
          style={{ overscrollBehavior: 'contain' }}
        >
          <div className="pb-4">
            {messages.length === 0 && !isLoading ? (
              <div className="space-y-6 pt-4 px-2">
                <div className="space-y-3">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center overflow-hidden bg-[#e6e2da] shadow-sm">
                    <img src="/Nexaris meida bg trans.png" alt="Alfred" className="w-10 h-10 object-contain mix-blend-multiply" />
                  </div>
                  <h2 className="text-[20px] font-semibold text-white tracking-tight">What's our quest today?</h2>
                  <p className="text-xs text-zinc-500">Supports web search · charts · tables · math</p>
                </div>
                <div className="space-y-1">
                  {[
                    { icon: '🦆', label: 'Personalize your AI', prompt: 'Personalize my AI preferences' },
                    { icon: <Globe className="w-4 h-4 text-zinc-400" />, label: 'Search the web', prompt: 'Search the web for ' },
                    { icon: <Search className="w-4 h-4 text-zinc-400" />, label: 'Analyze for insights', prompt: 'Analyze this page for key insights' },
                    { icon: <ListTodo className="w-4 h-4 text-zinc-400" />, label: 'Create a task tracker table', prompt: 'Create a task tracker table' },
                    { icon: <Languages className="w-4 h-4 text-zinc-400" />, label: 'Translate this page', prompt: 'Translate this page to ' },
                  ].map(({ icon, label, prompt }) => (
                    <button key={label} onClick={() => setInput(prompt)} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-zinc-300 hover:bg-white/5 rounded-lg transition-colors group">
                      <span>{icon}</span>
                      <span className="group-hover:text-white transition-colors">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {messages.map((msg) => (
                  <div key={msg.id} className={cn("flex flex-col gap-1", msg.role === 'user' ? "items-end" : "items-start")}>
                    {msg.role === 'user' ? (
                      <div className="max-w-[88%] bg-[#2b2b2f] text-white rounded-2xl rounded-tr-sm px-4 py-3 text-[14px] leading-relaxed">
                        {msg.content}
                      </div>
                    ) : (
                      <div className="w-full text-zinc-200">
                        <MessageRenderer content={msg.content} router={router} />
                      </div>
                    )}
                  </div>
                ))}
                {isLoading && (
                  <div className="flex items-center gap-2 text-zinc-500 text-sm pt-1">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    <span className="text-[13px]">
                      {mode === 'web' ? 'Searching the web…' : mode === 'think' ? 'Thinking…' : 'Generating…'}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Input Bar ── */}
        <div className="p-4 pt-2 flex-shrink-0">
          <div className="relative flex flex-col rounded-2xl bg-[#1e1e20] border border-[#3f8efc]/60 focus-within:border-[#3f8efc] focus-within:shadow-[0_0_0_1px_rgba(63,142,252,0.35),0_0_18px_rgba(63,142,252,0.10)] transition-all duration-200 overflow-hidden">

            {/* Context pills */}
            <div className="flex items-center gap-1.5 px-3 pt-2.5 overflow-x-auto scrollbar-none">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.07] text-zinc-300 text-[11px] font-medium whitespace-nowrap cursor-pointer hover:bg-white/[0.12] transition-colors">
                <FileText className="w-3 h-3 opacity-70" />
                <span>Page Context</span>
              </div>
              {/* Mode toggle pill */}
              <button
                onClick={() => setMode(m => nextMode[m])}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors",
                  mode === 'normal' ? 'bg-white/[0.07] text-zinc-300 hover:bg-white/[0.12]' :
                  mode === 'web'    ? 'bg-blue-500/20 text-blue-400 hover:bg-blue-500/30' :
                                     'bg-purple-500/20 text-purple-400 hover:bg-purple-500/30'
                )}
                title="Toggle mode: Auto → Web Search → Think"
              >
                {modeConfig[mode].icon}
                <span>{modeConfig[mode].label}</span>
              </button>
            </div>

            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
              }}
              placeholder={
                mode === 'web'   ? 'Search the web for anything…' :
                mode === 'think' ? 'Ask a complex question…' :
                                   'Do anything with AI…'
              }
              rows={2}
              style={{ outline: 'none', boxShadow: 'none' }}
              className="min-h-[56px] max-h-[180px] w-full bg-transparent border-0 ring-0 px-3.5 py-2.5 text-[14px] resize-none text-zinc-200 placeholder:text-zinc-500/80 focus:outline-none focus:ring-0"
            />

            <div className="flex items-center justify-end px-3 pb-2.5">
              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSubmit}
                  disabled={!input.trim() || isLoading}
                  className={cn(
                    "w-7 h-7 rounded-full p-0 flex items-center justify-center transition-all border-0",
                    input.trim() ? "bg-[#3f8efc] text-white hover:bg-[#5b9dfd] shadow-lg shadow-blue-500/20" : "bg-white/[0.08] text-zinc-600 cursor-not-allowed"
                  )}
                >
                  <ArrowUp className="w-[14px] h-[14px] stroke-[2.5]" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
