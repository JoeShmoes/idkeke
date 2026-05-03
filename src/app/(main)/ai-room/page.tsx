'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Mic, BrainCircuit, User, Loader2, Wand2, Edit, Trash2, Maximize2, Paperclip, Brain, Search, Globe, MessageSquare, FileText, X, ChevronDown, PieChart, BarChart as BarChartIcon, ClipboardCheck, RefreshCw, Plus, CheckSquare, Play } from 'lucide-react';
import { useSpeech } from '@/hooks/use-speech';
import { cn, copyToClipboard } from '@/lib/utils';
import { useApp } from '@/components/layout/app-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, PieChart as RechartsPieChart, Pie, Cell
} from 'recharts';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import AiSidebar from '@/components/ai-room/ai-sidebar';
import { ChartRenderer } from '@/components/ai-room/chart-renderer';
import type { Message, Chat, AIMemory } from '@/lib/types';
import { Download, FileSpreadsheet, File as FileIcon } from 'lucide-react';
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger, ContextMenuSeparator } from "@/components/ui/context-menu";
import Logo from '@/components/logo';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import pptxgen from 'pptxgenjs';

import { availableRooms } from '@/lib/constants';

// Use shared Message and Chat types from '@/lib/types'

interface FilePreview {
  file: File;
  preview: string | null;
  type: 'image' | 'pdf' | 'text' | 'other';
}

const BlinkingCursor = () => (
  <span className="animate-pulse text-muted-foreground text-sm">|</span>
);

const MarkdownRenderer = ({ content }: { content: string }) => {
  return (
    <div className="text-sm leading-relaxed text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ node, className, children, ...props }: any) {
            const match = /language-(\w+)/.exec(className || '');
            const isChart = (match && match[1] === 'chart') || (match && match[1] === 'json' && String(children).includes('"xAxisKey"') && String(children).includes('"data"'));
            const isBlock = !!match;

            if (isChart && isBlock) {
              try {
                const chartData = JSON.parse(String(children).replace(/\n$/, ''));
                if (chartData.type && chartData.data) {
                  return <ChartRenderer {...chartData} />;
                }
              } catch (e) {
                // If it fails to parse as a chart, just fall through to standard code block
              }
            }

            if (isBlock) {
              return (
                <div className="relative my-4 rounded-lg bg-muted/50 p-4 font-mono text-sm overflow-x-auto border">
                  <code className={className} {...props}>
                    {children}
                  </code>
                </div>
              );
            }

            return (
              <code
                className="bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono"
                {...props}
              >
                {children}
              </code>
            );
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">{children}</table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-muted/50">{children}</thead>;
          },
          th({ children }) {
            return (
              <th className="px-4 py-2 text-left font-medium border-b">
                {children}
              </th>
            );
          },
          td({ children }) {
            return (
              <td className="px-4 py-2 border-r last:border-0 border-b last:border-b-0">
                {children}
              </td>
            );
          },
          p({ children }) {
            return <p className="mb-1 first:mt-0 leading-snug last:mb-0">{children}</p>;
          },
          ul({ children }) {
            return (
              <ul className="list-disc ml-5 mb-1 space-y-0 text-sm">{children}</ul>
            );
          },
          ol({ children }) {
            return (
              <ol className="list-decimal ml-5 mb-1 space-y-0 text-sm">{children}</ol>
            );
          },
          li({ children }) {
            return <li className="pl-1 my-0.5 marker:text-muted-foreground">{children}</li>;
          },
          h1({ children }) {
            return (
              <h1 className="text-3xl font-bold mt-6 mb-3 first:mt-0">{children}</h1>
            );
          },
          h2({ children }) {
            return (
              <h2 className="text-2xl font-bold mt-5 mb-3 first:mt-0">{children}</h2>
            );
          },
          h3({ children }) {
            return (
              <h3 className="text-xl font-bold mt-4 mb-2 first:mt-0">{children}</h3>
            );
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-primary/20 pl-4 py-1 my-4 italic text-muted-foreground bg-muted/10 rounded-r">
                {children}
              </blockquote>
            );
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline underline-offset-4 hover:text-primary/80 transition-colors"
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
};

const generateFileFromJSON = (json: any) => {
  const { type, filename, data } = json;
  const name = filename || 'generated_file';
  
  if (type === 'pdf') {
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(data.title || 'Document', 10, 10);
      doc.setFontSize(12);
      const text = data.content || '';
      const lines = doc.splitTextToSize(text, 180);
      doc.text(lines, 10, 20);
      doc.save(`${name}.pdf`);
  } else if (type === 'excel') {
      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(data.rows || []);
      XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
      XLSX.writeFile(wb, `${name}.xlsx`);
  } else if (type === 'slides' || type === 'canvas') {
      const pres = new pptxgen();
      const slidesData = data.slides || data.sections || [];
      (slidesData || []).forEach((s: any, index: number) => {
          const slide = pres.addSlide();
          const title = s.title || (type === 'canvas' ? `Canvas Section ${index + 1}` : 'Slide');
          const content = s.content || '';
          slide.addText(title, { x: 1, y: 0.7, fontSize: 28, bold: true });
          if (content) {
            slide.addText(content, { x: 1, y: 1.6, fontSize: 16, color: '363636' });
          }
      });
      pres.writeFile({ fileName: `${name}.pptx` });
  } else if (type === 'graph') {
      const canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          
          const title = data.title || 'Chart';
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 24px sans-serif';
          ctx.textAlign = 'center';
          ctx.fillText(title, canvas.width / 2, 40);

          const chartType = data.type || 'bar';
          const items = data.data || [];
          const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#6366f1', '#8b5cf6', '#ec4899'];

          if (chartType === 'bar') {
              const padding = 60;
              const chartWidth = canvas.width - (padding * 2);
              const chartHeight = canvas.height - 100 - padding;
              const barWidth = (chartWidth / items.length) * 0.6;
              const spacing = (chartWidth / items.length) * 0.4;
              
              const maxValue = Math.max(...items.map((i: any) => i.value));
              
              items.forEach((item: any, i: number) => {
                  const height = (item.value / maxValue) * chartHeight;
                  const x = padding + (i * (barWidth + spacing)) + (spacing / 2);
                  const y = canvas.height - padding - height;
                  
                  ctx.fillStyle = colors[i % colors.length];
                  ctx.fillRect(x, y, barWidth, height);
                  
                  ctx.fillStyle = '#000000';
                  ctx.font = '12px sans-serif';
                  ctx.textAlign = 'center';
                  ctx.fillText(item.name, x + barWidth/2, canvas.height - padding + 20);
                  ctx.fillText(String(item.value), x + barWidth/2, y - 5);
              });
          } else if (chartType === 'line') {
              const padding = 60;
              const chartWidth = canvas.width - (padding * 2);
              const chartHeight = canvas.height - 100 - padding;
              const maxValue = Math.max(...items.map((i: any) => i.value));
              
              ctx.beginPath();
              ctx.strokeStyle = '#3b82f6';
              ctx.lineWidth = 3;
              
              items.forEach((item: any, i: number) => {
                  const x = padding + (i * (chartWidth / (items.length - 1)));
                  const y = canvas.height - padding - ((item.value / maxValue) * chartHeight);
                  
                  if (i === 0) ctx.moveTo(x, y);
                  else ctx.lineTo(x, y);
                  
                  ctx.fillStyle = '#3b82f6';
                  ctx.beginPath();
                  ctx.arc(x, y, 4, 0, Math.PI * 2);
                  ctx.fill();
                  
                  ctx.fillStyle = '#000000';
                  ctx.textAlign = 'center';
                  ctx.fillText(item.name, x, canvas.height - padding + 20);
                  ctx.fillText(String(item.value), x, y - 10);
              });
              ctx.stroke();
          } else if (chartType === 'pie') {
              const centerX = canvas.width / 2;
              const centerY = canvas.height / 2 + 20;
              const radius = Math.min(canvas.width, canvas.height) / 3;
              const total = items.reduce((acc: number, item: any) => acc + item.value, 0);
              
              let startAngle = 0;
              items.forEach((item: any, i: number) => {
                  const sliceAngle = (item.value / total) * 2 * Math.PI;
                  
                  ctx.beginPath();
                  ctx.moveTo(centerX, centerY);
                  ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
                  ctx.closePath();
                  
                  ctx.fillStyle = colors[i % colors.length];
                  ctx.fill();
                  
                  const legendX = canvas.width - 200;
                  const legendY = 100 + (i * 30);
                  ctx.fillStyle = colors[i % colors.length];
                  ctx.fillRect(legendX, legendY, 20, 20);
                  ctx.fillStyle = '#000000';
                  ctx.textAlign = 'left';
                  ctx.fillText(`${item.name} (${Math.round(item.value/total*100)}%)`, legendX + 30, legendY + 15);
                  
                  startAngle += sliceAngle;
              });
          }

          const link = document.createElement('a');
          link.download = `${name}.png`;
          link.href = canvas.toDataURL('image/png');
          link.click();
      }
  }
};

const LOCAL_AI_ENDPOINT = '/api/ai/chat';

export default function AiRoomPage() {
  const {
    userProfile,
    clients,
    projects,
    vaultFiles,
    accounts,
    appSettings,
    tasks,
    transactions,
    goals,
    notes,
    activities,
    researchSessions,
    chats,
    setChats,
    aiMemories,
    setAiMemories,
    selectedRoom,
    setSelectedRoom,
    setAiMessageCount,
  } = useApp();

  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string>('');
  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [currentMode, setCurrentMode] = useState<string | null>(null);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [searchSources, setSearchSources] = useState<string[]>([]);
  // selectedRoom moved to global state
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  // Pinned chat feature removed
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [previewDialog, setPreviewDialog] = useState<{
    open: boolean;
    file: FilePreview | null;
  }>({
    open: false,
    file: null,
  });
  const [isDragOverInput, setIsDragOverInput] = useState(false);

  // availableRooms imported from constants

  const { isListening, transcript, startListening, stopListening, setTranscript } = useSpeech();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    if (!scrollAreaRef.current) return;
    const viewport = scrollAreaRef.current.querySelector(
      '[data-radix-scroll-area-viewport]'
    ) as HTMLElement | null;
    if (viewport) {
      viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  };

useEffect(() => {
  if (currentChatId) return;
  if (chats.length === 0) {
    createNewChat();
    return;
  }
  const mostRecent = chats
    .slice()
    .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())[0];
  setCurrentChatId(mostRecent.id);
  setMessages(mostRecent.messages);
}, [chats]);

useEffect(() => {
  if (!currentChatId) return;
  const chat = chats.find(c => c.id === currentChatId);
  if (chat) {
    setMessages(chat.messages);
  }
}, [currentChatId]);

  useEffect(() => {
    // Handle chat query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const chatId = urlParams.get('chat');
    if (chatId && chats.length > 0 && chatId !== currentChatId) {
      const chat = chats.find(c => c.id === chatId);
      if (chat) {
        setCurrentChatId(chat.id);
        setMessages(chat.messages);
      }
    }
  }, [chats, currentChatId]);

  useEffect(() => {
    setInput(transcript);
  }, [transcript]);

  useEffect(() => {
    // Auto-resize textarea
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${scrollHeight}px`;
    }
  }, [input]);

  // Pinned chat is derived from global context; no local state update needed

  const createNewChat = (): string => {
    const newChat: Chat = {
      id: Date.now().toString(),
      name: 'New Chat',
      messages: [],
      createdAt: new Date(),
      lastActivity: new Date()
    };
    setChats(prev => [...prev, newChat]);
    setCurrentChatId(newChat.id);
    setMessages([]);
    setInput('');
    setTranscript('');
    setFilePreviews([]);
    setCurrentMode(null);
    setIsSearchingWeb(false);
    setSearchSources([]);
    scrollToBottom();
    return newChat.id;
  };

  const buildFileContext = (previews: FilePreview[]): string | null => {
    if (!previews.length) return null;
    const lines: string[] = [];
    lines.push(
      'The user attached the following files. Use them as context for your response:'
    );
    previews.forEach((fp, index) => {
      const sizeKb = (fp.file.size / 1024).toFixed(1);
      if (fp.type === 'text' && fp.preview) {
        const snippet = fp.preview.slice(0, 2000);
        lines.push(
          `File ${index + 1}: ${fp.file.name} (${fp.file.type || 'unknown'}, ${sizeKb} KB)\nContent snippet:\n${snippet}`
        );
      } else {
        lines.push(
          `File ${index + 1}: ${fp.file.name} (${fp.file.type || 'unknown'}, ${sizeKb} KB)`
        );
      }
    });
    return lines.join('\n\n');
  };

  const updateChatName = async (chatId: string, messages: Message[]) => {
    if (messages.length === 0) return;

    const conversationText = messages.slice(0, 4).map(m => m.text).join(' ').slice(0, 200);
    const prompt = `Based on this conversation, generate a very short, descriptive name (STRICTLY max 4 words) for this chat: "${conversationText}"`;

    try {
      const response = await fetch(LOCAL_AI_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [{ role: 'user', content: prompt }] }),
      });

      if (response.ok) {
        const data = await response.json();
        const generatedName = String(data.content || 'New Chat').trim().replace(/["']/g, '');
        setChats(prev => prev.map(chat =>
          chat.id === chatId ? { ...chat, name: generatedName } : chat
        ));
      } else {
        setChats(prev => prev.map(chat =>
          chat.id === chatId ? { ...chat, name: 'New Chat' } : chat
        ));
      }
    } catch (error) {
      setChats(prev => prev.map(chat =>
        chat.id === chatId ? { ...chat, name: 'New Chat' } : chat
      ));
    }
  };

  const switchChat = (chatId: string) => {
    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setMessages(chat.messages);
    }
  };

  // pinChat and unpinChat provided by context

  const renameChat = (chatId: string, newName: string) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId ? { ...chat, name: newName } : chat
    ));
  };

  const deleteChat = (chatId: string) => {
    setChatToDelete(chatId);
  };

  const deleteChats = (chatIds: string[]) => {
    if (!chatIds || chatIds.length === 0) return;
    const idsToDelete = new Set(chatIds);

    setChats(prev => {
      const next = prev.filter(chat => !idsToDelete.has(chat.id));

      if (currentChatId && idsToDelete.has(currentChatId)) {
        if (next.length > 0) {
          const mostRecent = next
            .slice()
            .sort(
              (a, b) =>
                new Date(b.lastActivity).getTime() -
                new Date(a.lastActivity).getTime(),
            )[0];

          setCurrentChatId(mostRecent.id);
          setMessages(mostRecent.messages);
        } else {
          createNewChat();
        }
      }

      return next;
    });
  };

  const confirmDeleteChat = () => {
    if (!chatToDelete) return;
    
    setChats(prev => {
      const next = prev.filter(chat => chat.id !== chatToDelete);
      if (currentChatId === chatToDelete) {
        if (next.length > 0) {
          const mostRecent = next
            .slice()
            .sort((a, b) => new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime())[0];
          setCurrentChatId(mostRecent.id);
          setMessages(mostRecent.messages);
        } else {
          createNewChat();
        }
      }
      return next;
    });
    setChatToDelete(null);
  };

  const updateChatMessages = (chatId: string, updatedMessages: Message[]) => {
    setChats(prev => prev.map(chat =>
      chat.id === chatId
        ? { ...chat, messages: updatedMessages, lastActivity: new Date() }
        : chat
    ));

    if (chatId === currentChatId) {
      setMessages(updatedMessages);
    }
  };

  const updateCurrentChat = (updatedMessages: Message[]) => {
    if (!currentChatId) return;
    updateChatMessages(currentChatId, updatedMessages);

    // Generate name if this is the first few messages
    if (updatedMessages.length === 2 && updatedMessages[0].sender === 'user') {
      updateChatName(currentChatId, updatedMessages);
    }
  };

  const callAiAPI = async (userMessage: string, chatHistory: Message[], onChunk?: (chunk: string) => void, mode?: string, context?: string, attachments?: File[], selectedRoom?: string | null) => {
    const appContext = {
      userProfile,
      clients: clients.slice(0, 5).map(c => ({ id: c.id, name: c.name, status: c.status })),
      projects: projects.slice(0, 5).map(p => ({ id: p.id, name: p.name, status: p.status })),
      tasks: tasks.slice(0, 5).map(t => ({ id: t.id, name: t.name, status: t.status })),
      goals: goals.slice(0, 3).map(g => ({ id: g.id, title: g.title, status: g.status })),
      notes: notes.slice(0, 3).map(n => ({ id: n.id, title: n.title, tags: n.tags })),
      accounts: accounts.slice(0, 5).map(a => ({ id: a.id, name: a.name, type: a.type, balance: a.balance })),
      transactions: transactions.slice(0, 5).map(t => ({ id: t.id, description: t.description, amount: t.amount, category: t.category })),
      vaultFiles: vaultFiles.slice(0, 5).map(f => ({ id: f.id, name: f.name, type: f.type, size: f.size })),
    };

    // Add room-specific context
    let roomContext = '';
    if (selectedRoom) {
      const roomData = availableRooms.find(r => r.id === selectedRoom);
      roomContext = `\n\nFOCUSED ROOM: ${roomData?.name}\n${roomData?.description}\n\nRoom-specific data:`;

      switch (selectedRoom) {
        case 'dashboard':
          roomContext += `\n- User Profile: ${JSON.stringify(userProfile)}\n- Recent Activity: ${JSON.stringify(activities?.slice(0, 5))}`;
          break;
        case 'clients':
          roomContext += `\n- Clients: ${JSON.stringify(clients)}`;
          break;
        case 'projects':
          roomContext += `\n- Projects: ${JSON.stringify(projects)}`;
          break;
        case 'tasks':
          roomContext += `\n- Tasks: ${JSON.stringify(tasks)}`;
          break;
        case 'budgeting':
          roomContext += `\n- Accounts: ${JSON.stringify(accounts)}\n- Transactions: ${JSON.stringify(transactions?.slice(0, 10))}`;
          break;
        case 'goals':
          roomContext += `\n- Goals: ${JSON.stringify(goals)}`;
          break;
        case 'asset-tracker':
          roomContext += `\n- Vault Files: ${JSON.stringify(vaultFiles)}`;
          break;
        case 'research':
          roomContext += `\n- Research Sessions: ${JSON.stringify(researchSessions)}`;
          break;
        default:
          roomContext += `\n- General app data available`;
      }
    }

    const recentMemories: AIMemory[] = (aiMemories || []).slice(-50);
    
    // Categorize memories for better context
    const preferenceMemories = recentMemories.filter(m => m.text.toLowerCase().includes('prefers') || m.text.toLowerCase().includes('likes') || m.text.toLowerCase().includes('favorite') || m.text.toLowerCase().includes('preference'));
    const factMemories = recentMemories.filter(m => !preferenceMemories.includes(m));
    
    let memoryContext = '';
    if (recentMemories.length > 0) {
      memoryContext = '\n\nYOUR LONG-TERM MEMORY (use these to personalize every response):';
      if (preferenceMemories.length > 0) {
        memoryContext += `\n\n## User Preferences & Style:\n${preferenceMemories.map(m => `- ${m.text}`).join('\n')}`;
      }
      if (factMemories.length > 0) {
        memoryContext += `\n\n## Key Facts & Past Interactions:\n${factMemories.slice(-30).map(m => `- ${m.text}`).join('\n')}`;
      }
    }

    const userName = userProfile.firstName || userProfile.name || 'sir';

    let systemPrompt = `You are Alfred AI, a sophisticated personal assistant inspired by Alfred from Batman. You are loyal, helpful, and deeply personal. You remember things about the user across conversations and use that knowledge to be more helpful every time.

The user's name is: ${userName}
${userProfile.email ? `Email: ${userProfile.email}` : ''}

PERSONALIZATION RULES (CRITICAL — follow these always):
- Address the user by their first name ("${userName}") naturally in conversation — not every sentence, but enough to feel personal.
- If you have memories about the user's preferences, interests, past projects, or communication style, ACTIVELY USE THEM in your responses.
- Reference past conversations when relevant (e.g., "As we discussed before...", "I remember you mentioned...").
- Adapt your tone based on what you know about the user. If they're casual, be casual. If they're business-focused, match that.
- When the user asks something you've helped with before, acknowledge it and build on the previous context.
- If you don't have relevant memories yet, that's fine — just be warm and attentive. You'll learn over time.
${memoryContext}

Available app data context:
${JSON.stringify(appContext, null, 2)}${roomContext}

Use this context to provide personalized assistance. If asked about app data, summarize and analyze it helpfully. For business tasks, use the available data to provide insights. For questions about news, current events, or latest developments, use your web search capabilities to provide accurate, up-to-date information.${selectedRoom ? ` Focus on the ${availableRooms.find(r => r.id === selectedRoom)?.name} room data when relevant.` : ''}

FORMATTING RULES:
- Use proper markdown for code blocks with triple backticks
- Use single backticks for inline code
- For math equations, use $$ for block equations and $ for inline equations
- Write mathematical expressions clearly and correctly
- When solving math problems, show your work step by step
- Always simplify obvious expressions (for example, 2/2 = 1, 4/8 = 1/2, 0.5 * 4 = 2)
- Use proper mathematical notation and symbols

IN-APP LINKS:
- When you mention parts of the app, use relative links in markdown so the user can click to open them.
- Use these exact paths:
  - Dashboard: [/dashboard](/dashboard)
  - Tasks: [/tasks](/tasks)
  - AI Room: [/ai-room](/ai-room)
  - Clients: [/clients](/clients)
  - Projects: [/project-board](/project-board)
  - Budgeting: [/budgeting](/budgeting)
  - Asset Tracker: [/asset-tracker](/asset-tracker)
  - File Vault: [/file-vault](/file-vault)
  - Docmost: [/docmost](/docmost)
  - Research: [/research](/research)
  - Health: [/health](/health)
  - Learning: [/learning](/learning)
  - Networking: [/networking](/networking)
- Only create links for locations that actually exist in this list.`;

    // Handle file attachments
    if (attachments && attachments.length > 0) {
      systemPrompt += `\n\nATTACHED FILES: The user has attached ${attachments.length} file(s). Analyze these files and incorporate their content into your response.`;
      for (const file of attachments) {
        systemPrompt += `\n- ${file.name} (${file.type || 'unknown type'}, ${(file.size / 1024).toFixed(1)} KB)`;
      }
    }

    if (mode === 'thinking') {
      systemPrompt += '\n\nTHINKING MODE: Take your time to think through this question thoroughly. Break down your reasoning step by step before providing your final answer. Show your thought process clearly.';
    } else if (mode === 'deep-research') {
      systemPrompt += '\n\nDEEP RESEARCH MODE: Use both the conversation history and web knowledge to provide comprehensive research. Cross-reference information and provide detailed analysis.';
    } else if (mode === 'web') {
      systemPrompt += '\n\nWEB SEARCH MODE: Focus on providing information that would typically be found through web search. Include current knowledge and general web-sourced information. At the end of your response, list all sources you used in this format:\n**Sources:**\n- Source Name: https://example.com\n- Another Source: https://example2.com';
    }

    if (context) {
      systemPrompt += `\n\nADDITIONAL CONTEXT: ${context}`;
    }

    // Add markdown formatting instructions
    systemPrompt += `\n\nCRITICAL RULE: NEVER say "I don't have live web browsing capabilities" or "I cannot access the internet". Our backend automatically runs web searches for you and provides the context. Answer as if you have full internet access!
    
    FORMATTING: You can use markdown for formatting. Use **bold** for emphasis, *italics* for stress, and $$ for math equations. Use proper markdown syntax for lists, tables, and code blocks.
    WHITESPACE RULE: NEVER use double newlines (\\n\\n) between bullet points or numbered list items. Keep lists tight. Do NOT add unnecessary empty lines between paragraphs unless separating major sections.
    IMPORTANT: ALWAYS use standard Markdown tables (using pipes | for columns). ALWAYS start every table row (including headers) with a pipe "|". NEVER use "manual" ASCII tables (using + and - to draw lines).
    
    IMAGES VS GRAPHS (CRITICAL!!): 
    - If the user asks for a picture, photo, or drawing, you must reply: "I am unable to make them right now but this feature is coming soon".
    - BUT IF THEY ASK FOR A GRAPH, CHART, PLOT, OR PIE CHART, YOU *CAN* DO IT! Do NOT say you can't. You must use the \`\`\`chart markdown block!
    
    CHARTS: You can generate charts by using a special code block with "chart" as the language. The content must be valid JSON with the following structure:
    \`\`\`chart
    {
      "type": "bar" | "line" | "pie",
      "title": "Chart Title",
      "data": [{"name": "A", "value": 10}, {"name": "B", "value": 20}],
      "xAxisKey": "name", // Key for X axis labels (for bar/line)
      "dataKeys": ["value"], // Keys for data series (for bar/line)
      "nameKey": "name", // Key for slice names (for pie)
      "dataKey": "value", // Key for slice values (for pie)
      "colors": ["#8884d8", "#82ca9d"] // Optional colors
    }
    \`\`\`
    Only use this format when a visual chart is helpful.
    
    FILE GENERATION: You can create files for the user. To create a file, output a JSON code block like this:
    \`\`\`json
    {
      "action": "generate_file",
      "type": "pdf" | "excel" | "slides" | "graph" | "canvas",
      "filename": "example_file",
      "data": {
        // For PDF:
        "title": "Document Title",
        "content": "Full text content..."
        // For Excel:
        "rows": [{"col1": "val1", "col2": "val2"}, ...]
        // For Slides:
        "slides": [{"title": "Slide 1", "content": "Text..."}, ...]
        // For Graph (downloadable image):
        "type": "bar" | "line" | "pie",
        "title": "Chart Title",
        "data": [{"name": "A", "value": 10}, ...],
        "xAxisKey": "name",
        "dataKeys": ["value"]
      }
    }
    \`\`\`
    Only output this JSON block when explicitly asked to create a file.`;

    const messagesForAPI = [
      { role: 'system', content: systemPrompt },
      ...chatHistory.slice(-10).map(msg => ({
        role: msg.sender === 'user' ? 'user' : 'assistant',
        content: msg.text
      })),
      { role: 'user', content: userMessage }
    ];

    try {
      let content = '';
      
      // @ts-ignore
      if (typeof window !== 'undefined' && window.electron) {
        // @ts-ignore
        const result = await window.electron.ipcRenderer.invoke('ai-chat', { messages: messagesForAPI, mode });
        if (result.error) {
           throw new Error(result.error + (result.details ? ': ' + result.details : ''));
        }
        content = String(result.content || '').trim();
        if (onChunk) onChunk(content);
      } else {
        const controller = new AbortController();
        // 60s timeout for initial connection/response start (accommodates slow searches)
        const timeoutId = setTimeout(() => controller.abort(), 60000);

        try {
          const response = await fetch(LOCAL_AI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ messages: messagesForAPI, mode, stream: true, max_tokens: 4000 }),
            signal: controller.signal
          });
          clearTimeout(timeoutId);

          if (!response.ok) {
            const status = response.status;
            let details = '';
            try {
               const payload = await response.json();
               details = typeof payload?.details === 'string' ? payload.details : 
                         (typeof payload?.error === 'string' ? payload.error : '');
            } catch (e) {}
            
            setIsSearchingWeb(false);
            setSearchSources([]);
            const hint = status === 401 ? 'Authentication failed. Check API configuration.' : '';
            return {
              content: `I apologize, sir. I'm experiencing technical difficulties. ${hint} ${details}`.trim(),
              isIncomplete: false
            };
          }

          const finishReason = response.headers.get('X-Finish-Reason');
          const isIncomplete = finishReason === 'length' || finishReason === 'model_length';

      if (response.body) {
              const reader = response.body.getReader();
              const decoder = new TextDecoder();
              
              try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    if (!value) continue;
                    
                    const chunk = decoder.decode(value, { stream: true });
                    if (chunk) {
                      content += chunk;
                      if (onChunk) onChunk(chunk);
                    }
                }
                // Flush any remaining bytes
                const remaining = decoder.decode();
                if (remaining) {
                   content += remaining;
                   if (onChunk) onChunk(remaining);
                }
              } catch (error) {
                console.error('Error reading stream:', error);
                // Don't append error message to content if we have some content already, just log it.
                // If content is empty, maybe the connection failed immediately.
                if (!content) {
                   content += '\n\n[Error: Connection interrupted]';
                   if (onChunk) onChunk('\n\n[Error: Connection interrupted]');
                }
              } finally {
                reader.releaseLock();
              }
          }
          
          setIsSearchingWeb(false);
          return { content, isIncomplete };
        } catch (fetchError: any) {
           clearTimeout(timeoutId);
           if (fetchError.name === 'AbortError') {
               throw new Error('Connection timed out. Please try again.');
           }
           throw fetchError;
        }
      }

      setIsSearchingWeb(false);
      return {
        content: content || "I apologize, but I couldn't generate a response. Please try again.",
        isIncomplete: false
      };
    } catch (error: any) {
      setIsSearchingWeb(false);
      setSearchSources([]);
      const msg = typeof error?.message === 'string' ? error.message : '';
      return {
        content: `I apologize, sir. I'm experiencing technical difficulties. ${msg}`.trim(),
        isIncomplete: false
      };
    }
  };

  const handleFileGeneration = async (content: string) => {
    // Look for any json or file block that might contain the generate_file action
    const codeBlockRegex = /```(?:json|file|)\s*\n([\s\S]*?)```/gi;
    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      try {
        const json = JSON.parse(match[1]);
        if (json.action === 'generate_file') {
          const { type, filename } = json;
          const name = filename || 'generated_file';
          
          generateFileFromJSON(json);
          
          const ext = type === 'slides' || type === 'canvas'
            ? 'pptx'
            : type === 'excel'
            ? 'xlsx'
            : 'pdf';

          const mime =
            type === 'pdf'
              ? 'application/pdf'
              : type === 'excel'
              ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
              : 'application/vnd.openxmlformats-officedocument.presentationml.presentation';

          return {
            name: `${name}.${ext}`,
            size: 0,
            type: mime,
            data: json
          };
        }
      } catch (e) {
        console.error('Failed to parse file generation JSON', e);
      }
    }
    return null;
  };

  const fetchWikipediaContext = async (topic: string): Promise<{ context: string; source: string }> => {
    try {
      const trimmed = topic.trim();
      if (!trimmed) {
        return { context: '', source: '' };
      }

      let searchData: any;
      if (typeof window !== 'undefined' && (window as any).electron?.ipcRenderer) {
        searchData = await (window as any).electron.ipcRenderer.invoke('wiki-search', trimmed);
      } else {
        const searchRes = await fetch(
          `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
            trimmed
          )}&format=json&origin=*`
        );
        searchData = await searchRes.json();
      }

      if (searchData?.error) {
        return { context: '', source: '' };
      }

      let bestTitle = trimmed;
      if (searchData?.query?.search?.length > 0) {
        bestTitle = searchData.query.search[0].title;
      }

      let summaryData: any;
      if (typeof window !== 'undefined' && (window as any).electron?.ipcRenderer) {
        summaryData = await (window as any).electron.ipcRenderer.invoke('wiki-summary', bestTitle);
      } else {
        const summaryRes = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(bestTitle)}`
        );
        summaryData = await summaryRes.json();
      }

      if (summaryData?.error) {
        return { context: '', source: '' };
      }

      const summary = summaryData.extract || summaryData.description || '';
      const url =
        summaryData.content_urls?.desktop?.page ||
        `https://en.wikipedia.org/wiki/${encodeURIComponent(bestTitle.replace(/ /g, '_'))}`;

      if (!summary) {
        return { context: '', source: '' };
      }

      const context = `Wikipedia: ${bestTitle}\n${summary}\nSource: ${url}`;
      return { context, source: url };
    } catch {
      return { context: '', source: '' };
    }
  };

  const fetchNewsContext = async (topic: string): Promise<{ context: string; sources: string[] }> => {
    try {
      const trimmed = topic.trim();
      if (typeof window === 'undefined' || !trimmed) {
        return { context: '', sources: [] };
      }

      const w = window as any;
      if (!w.electron?.ipcRenderer) {
        return { context: '', sources: [] };
      }

      const newsResult = await w.electron.ipcRenderer.invoke('fetch-news', {
        type: trimmed ? 'everything' : 'headlines',
        query: trimmed || '',
      });

      if (!newsResult || newsResult.error || !Array.isArray(newsResult.articles)) {
        return { context: '', sources: [] };
      }

      const articles = newsResult.articles.slice(0, 5);
      if (!articles.length) {
        return { context: '', sources: [] };
      }

      const lines = articles.map((article: any, index: number) => {
        const title = article.title || 'Untitled';
        const desc = article.description || '';
        const sourceName = article.source?.name || '';
        const url = article.url || '';
        const parts: string[] = [];
        parts.push(`${index + 1}. ${title}`);
        if (sourceName) {
          parts.push(`(${sourceName})`);
        }
        if (desc) {
          parts.push(`– ${desc}`);
        }
        if (url) {
          parts.push(`[${url}]`);
        }
        return parts.join(' ');
      });

      const context = `News articles about "${trimmed}":\n${lines.join('\n')}`;
      const sources = articles
        .map((article: any) => article.url)
        .filter((url: any) => typeof url === 'string' && url.length > 0);

      return { context, sources };
    } catch {
      return { context: '', sources: [] };
    }
  };

  const fetchWebSearch = async (query: string): Promise<{ results: any[]; error?: string }> => {
    try {
      if (typeof window !== 'undefined' && (window as any).electron?.ipcRenderer) {
        return await (window as any).electron.ipcRenderer.invoke('web-search', query);
      }
      return { results: [] };
    } catch (e: any) {
      return { results: [], error: e.message };
    }
  };

  const buildWebContext = async (topic: string): Promise<{ context: string; sources: string[] }> => {
    const trimmed = topic.trim();
    if (!trimmed) {
      return { context: '', sources: [] };
    }

    const [wiki, news, web] = await Promise.all([
      fetchWikipediaContext(trimmed),
      fetchNewsContext(trimmed),
      fetchWebSearch(trimmed)
    ]);

    const parts: string[] = [];
    if (wiki.context) {
      parts.push(wiki.context);
    }
    if (news.context) {
      parts.push(news.context);
    }
    if (web.results && web.results.length > 0) {
      const webContext = `Web Search Results for "${trimmed}":\n` + 
        web.results.map((r: any) => `- [${r.title}](${r.link}): ${r.snippet}`).join('\n');
      parts.push(webContext);
    }

    const sources: string[] = [];
    if (wiki.source) {
      sources.push(wiki.source);
    }
    if (news.sources.length) {
      sources.push(...news.sources);
    }
    if (web.results) {
      sources.push(...web.results.map((r: any) => r.link));
    }

    return {
      context: parts.join('\n\n'),
      sources,
    };
  };

  const handleSendMessage = async (e?: React.FormEvent, context?: string) => {
    if (e) e.preventDefault();
    if (!input.trim() && filePreviews.length === 0 || isThinking) return;

    // Auto-create new chat if none exists
    let activeChatId = currentChatId;
    if (chats.length === 0 || !activeChatId) {
      activeChatId = createNewChat();
    }

    const attachmentsMeta = filePreviews.map(fp => ({
      name: fp.file.name,
      size: fp.file.size,
      type: fp.file.type
    }));
    const attachmentsFiles = filePreviews.map(fp => fp.file);
    const fileContext = buildFileContext(filePreviews);
    const combinedContext = [context, fileContext].filter(Boolean).join('\n\n');

    let extendedContext = combinedContext;
    
    let shouldSearch = currentMode === 'web' || currentMode === 'deep-research';
    
    // Auto-detect search intent for real-time information
    if (!shouldSearch && /stats|score|price|weather|news|latest|current|vs|schedule|roster|ranking|standings|market|stock|value|today|now/i.test(input)) {
        shouldSearch = true;
    }

    if (shouldSearch) {
      setIsSearchingWeb(true);
      setSearchSources(['Searching live web data...']);
      const webResult = await buildWebContext(input);
      
      // If web search returned an error or no results, try to inform the user
      if (webResult.sources.length === 0) {
        setSearchSources([]);
        // We still continue, AI will answer "I don't know" or similar, but we could add a system note
        extendedContext += `\n\nSYSTEM NOTE: The user requested real-time info, but the web search returned no results. If this persists, please ask the user to restart the application to enable the new search features.`;
      } else {
        setSearchSources(webResult.sources);
      }

      if (webResult.context) {
        extendedContext = [combinedContext, webResult.context].filter(Boolean).join('\n\n');
      }
    }
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date(),
      attachments: attachmentsMeta.length > 0 ? attachmentsMeta : undefined,
      mode: currentMode || undefined
    };

    const updatedMessages = [...messages, userMessage];
    
    // Create placeholder AI message
    const placeholderAiMessage: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: '',
      timestamp: new Date(),
      mode: currentMode || undefined
    };

    updateChatMessages(activeChatId, [...updatedMessages, placeholderAiMessage]);

    const currentInput = input;
    setInput('');
    setTranscript('');
    setFilePreviews([]);
    setIsThinking(true);

    let accumulatedResponse = '';
    const onChunk = (chunk: string) => {
        accumulatedResponse += chunk;
        setMessages(prev => {
            const newMsgs = [...prev];
            const msgIndex = newMsgs.findIndex(m => m.id === placeholderAiMessage.id);
            if (msgIndex !== -1) {
                newMsgs[msgIndex] = { ...newMsgs[msgIndex], text: accumulatedResponse };
            }
            return newMsgs;
        });
        scrollToBottom();
    };

    const aiRes = await callAiAPI(
      currentInput,
      updatedMessages,
      onChunk,
      currentMode || undefined,
      extendedContext || undefined,
      attachmentsFiles,
      selectedRoom
    );
    // TypeScript check: ensure we handle both string (legacy) and object returns
    const aiResponse = typeof aiRes === 'string' ? aiRes : aiRes.content;
    const isIncomplete = typeof aiRes === 'object' ? aiRes.isIncomplete : false;

    // Check for file generation
    const generatedFile = await handleFileGeneration(aiResponse);

    const finalAiMessage: Message = {
      ...placeholderAiMessage,
      text: aiResponse,
      attachments: generatedFile ? [generatedFile] : undefined,
      sources: (currentMode === 'web' || currentMode === 'deep-research') ? searchSources : undefined,
      isIncomplete
    };

    const finalMessages = [...updatedMessages, finalAiMessage];
    updateChatMessages(activeChatId, finalMessages);

    // Extract key facts from the conversation using AI
    const trimmedUser = currentInput.trim().slice(0, 300);
    const trimmedAi = aiResponse.trim().slice(0, 400);
    if (trimmedUser && trimmedAi) {
      try {
        const extractRes = await fetch(LOCAL_AI_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [
              {
                role: 'system',
                content: `You are a memory extraction system. Given a user message and an AI response, extract ONLY the key personal facts, preferences, or important information about the user that would be useful to remember for future conversations. Output each fact on a new line starting with "- ". If there are no meaningful facts to extract (e.g., the user just said "hello" or asked a generic question), respond with exactly "NONE". Be concise — each fact should be under 15 words. Focus on: user preferences, personal details, project names, goals, opinions, communication style, and recurring topics.`
              },
              {
                role: 'user',
                content: `User said: "${trimmedUser}"\nAlfred replied: "${trimmedAi}"\n\nExtract key facts about the user:`
              }
            ],
            max_tokens: 150
          }),
        });

        if (extractRes.ok) {
          let extractedText = '';
          if (extractRes.body) {
            const reader = extractRes.body.getReader();
            const decoder = new TextDecoder();
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              extractedText += decoder.decode(value, { stream: true });
            }
            extractedText += decoder.decode();
          } else {
            const data = await extractRes.json();
            extractedText = data.content || '';
          }

          const facts = extractedText.trim();
          if (facts && facts !== 'NONE' && !facts.toLowerCase().startsWith('none')) {
            const factLines = facts.split('\n').filter((line: string) => line.trim().startsWith('-')).map((line: string) => line.trim().replace(/^-\s*/, ''));
            
            if (factLines.length > 0) {
              setAiMemories((prev) => {
                const base = Array.isArray(prev) ? prev.slice(-48) : [];
                const newMemories: AIMemory[] = factLines.slice(0, 3).map((fact: string) => ({
                  id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                  text: fact,
                  source: 'chat' as const,
                  createdAt: new Date().toISOString(),
                }));
                return [...base, ...newMemories];
              });
            }
          }
        }
      } catch (memError) {
        // Silently fail memory extraction — don't break the chat
        console.error('Memory extraction failed:', memError);
        // Fallback: store a simple summary
        setAiMemories((prev) => {
          const base = Array.isArray(prev) ? prev.slice(-49) : [];
          const memory: AIMemory = {
            id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
            text: `User asked about: ${trimmedUser.slice(0, 80)}`,
            source: 'chat',
            createdAt: new Date().toISOString(),
          };
          return [...base, memory];
        });
      }
    }
    
    // Auto-name chat if it's the first exchange (User + AI = 2 messages)
    if (finalMessages.length === 2) {
      updateChatName(activeChatId, finalMessages);
    }

    setIsThinking(false);
    setCurrentMode(null);
  };

  const handleContinue = async (messageId: string) => {
    const targetMsgIndex = messages.findIndex(msg => msg.id === messageId);
    if (targetMsgIndex === -1 || !currentChatId || isThinking) return;
    
    // We only continue AI messages
    const targetMsg = messages[targetMsgIndex];
    if (targetMsg.sender !== 'ai') return;

    setIsThinking(true);
    
    // Create a temporary "continue" user message to append to the context, 
    // but don't show it in the UI
    const messagesUpToTarget = messages.slice(0, targetMsgIndex + 1);
    
    let accumulatedResponse = targetMsg.text;
    const onChunk = (chunk: string) => {
        accumulatedResponse += chunk;
        setMessages(prev => {
            const newMsgs = [...prev];
            const msgIndex = newMsgs.findIndex(m => m.id === messageId);
            if (msgIndex !== -1) {
                // Keep the old attachments and sources, just append text
                newMsgs[msgIndex] = { ...newMsgs[msgIndex], text: accumulatedResponse };
            }
            return newMsgs;
        });
        scrollToBottom();
    };

    try {
      // Call the API with a special continue prompt
      const aiRes = await callAiAPI(
        "Please continue your previous response EXACTLY where you left off. Do not repeat what you already wrote.",
        messagesUpToTarget,
        onChunk,
        undefined,
        undefined,
        undefined,
        selectedRoom
      );

      const aiResponseContent = typeof aiRes === 'string' ? aiRes : aiRes.content;
      const isIncomplete = typeof aiRes === 'object' ? aiRes.isIncomplete : false;

      setMessages(prev => {
        const newMsgs = [...prev];
        const msgIndex = newMsgs.findIndex(m => m.id === messageId);
        if (msgIndex !== -1) {
            newMsgs[msgIndex] = { 
              ...newMsgs[msgIndex], 
              text: accumulatedResponse,
              isIncomplete 
            };
        }
        updateChatMessages(currentChatId, newMsgs);
        return newMsgs;
      });
    } catch (error) {
      console.error("Continue failed:", error);
    } finally {
      setIsThinking(false);
    }
  };

  const handleEditMessage = (messageId: string, newText: string) => {
    const target = messages.find(msg => msg.id === messageId);
    if (!target || target.sender !== 'user') return;

    const updatedMessages = messages.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, text: newText, isEditing: false };
      }
      return msg;
    });

    const messageIndex = updatedMessages.findIndex(msg => msg.id === messageId);
    if (messageIndex !== -1 && updatedMessages[messageIndex].sender === 'user') {
      const messagesUpToEdit = updatedMessages.slice(0, messageIndex + 1);
      updateCurrentChat(messagesUpToEdit);
      regenerateResponse(messagesUpToEdit);
    } else {
      updateCurrentChat(updatedMessages);
    }
  };

  const handleDeleteMessage = (messageId: string) => {
    const messageIndex = messages.findIndex(msg => msg.id === messageId);
    if (messageIndex === -1) return;

    const message = messages[messageIndex];

    if (message.sender === 'user') {
      // If deleting a user message, also delete the following AI response
      const updatedMessages = messages.slice(0, messageIndex);
      updateCurrentChat(updatedMessages);
    } else {
      // If deleting an AI message, check if there's a preceding user message
      if (messageIndex > 0 && messages[messageIndex - 1].sender === 'user') {
        // Delete both the AI message and the preceding user message (question)
        const updatedMessages = messages.slice(0, messageIndex - 1);
        updateCurrentChat(updatedMessages);
      } else {
        // If deleting an orphaned AI message, just remove it
        const updatedMessages = messages.filter(msg => msg.id !== messageId);
        updateCurrentChat(updatedMessages);
      }
    }
  };

  const regenerateResponse = async (messagesUpToUser: Message[]) => {
    if (
      messagesUpToUser.length === 0 ||
      messagesUpToUser[messagesUpToUser.length - 1].sender !== 'user' ||
      !currentChatId ||
      isThinking
    ) {
      return;
    }

    setIsThinking(true);
    const lastUserMessage = messagesUpToUser[messagesUpToUser.length - 1];
    
    const placeholderAiMessage: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: '',
      timestamp: new Date(),
      mode: lastUserMessage.mode
    };

    const baseMessages = [...messagesUpToUser, placeholderAiMessage];
    updateChatMessages(currentChatId, baseMessages);

    let accumulatedResponse = '';
    const onChunk = (chunk: string) => {
        accumulatedResponse += chunk;
        setMessages(prev => {
            const newMsgs = [...prev];
            const msgIndex = newMsgs.findIndex(m => m.id === placeholderAiMessage.id);
            if (msgIndex !== -1) {
                newMsgs[msgIndex] = { ...newMsgs[msgIndex], text: accumulatedResponse };
            }
            return newMsgs;
        });
        scrollToBottom();
    };

    try {
      let context: string | undefined;
      let currentSources: string[] | undefined = undefined;

      if (lastUserMessage.mode === 'web' || lastUserMessage.mode === 'deep-research') {
        setIsSearchingWeb(true);
        setSearchSources(['Searching live web data...']);
        const webResult = await buildWebContext(lastUserMessage.text);
        if (webResult.sources.length > 0) {
          setSearchSources(webResult.sources);
          currentSources = webResult.sources;
        } else {
          setSearchSources([]);
          currentSources = [];
        }
        context = webResult.context || undefined;
      }

      const aiRes = await callAiAPI(
        lastUserMessage.text,
        messagesUpToUser,
        onChunk,
        lastUserMessage.mode,
        context,
        undefined,
        selectedRoom
      );
      // TypeScript check: ensure we handle both string (legacy) and object returns
      const aiResponse = typeof aiRes === 'string' ? aiRes : aiRes.content;
      const isIncomplete = typeof aiRes === 'object' ? aiRes.isIncomplete : false;

      const generatedFile = await handleFileGeneration(aiResponse);

      const aiMessage: Message = {
        ...placeholderAiMessage,
        text: aiResponse,
        attachments: generatedFile ? [generatedFile] : undefined,
        sources: currentSources,
        isIncomplete
      };

      const finalMessages = [...messagesUpToUser, aiMessage];
      updateChatMessages(currentChatId, finalMessages);

      // Extract key facts from regenerated response
      const lastUser = messagesUpToUser[messagesUpToUser.length - 1];
      const trimmedUser = lastUser.text.trim().slice(0, 300);
      const trimmedAi = aiResponse.trim().slice(0, 400);
      if (trimmedUser && trimmedAi) {
        try {
          const extractRes = await fetch(LOCAL_AI_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content: `You are a memory extraction system. Given a user message and an AI response, extract ONLY the key personal facts, preferences, or important information about the user that would be useful to remember for future conversations. Output each fact on a new line starting with "- ". If there are no meaningful facts to extract, respond with exactly "NONE". Be concise — each fact should be under 15 words.`
                },
                {
                  role: 'user',
                  content: `User said: "${trimmedUser}"\nAlfred replied: "${trimmedAi}"\n\nExtract key facts about the user:`
                }
              ],
              max_tokens: 150
            }),
          });

          if (extractRes.ok) {
            let extractedText = '';
            if (extractRes.body) {
              const reader = extractRes.body.getReader();
              const decoder = new TextDecoder();
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                extractedText += decoder.decode(value, { stream: true });
              }
              extractedText += decoder.decode();
            } else {
              const data = await extractRes.json();
              extractedText = data.content || '';
            }

            const facts = extractedText.trim();
            if (facts && facts !== 'NONE' && !facts.toLowerCase().startsWith('none')) {
              const factLines = facts.split('\n').filter((line: string) => line.trim().startsWith('-')).map((line: string) => line.trim().replace(/^-\s*/, ''));
              
              if (factLines.length > 0) {
                setAiMemories((prev) => {
                  const base = Array.isArray(prev) ? prev.slice(-48) : [];
                  const newMemories: AIMemory[] = factLines.slice(0, 3).map((fact: string) => ({
                    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                    text: fact,
                    source: 'chat' as const,
                    createdAt: new Date().toISOString(),
                  }));
                  return [...base, ...newMemories];
                });
              }
            }
          }
        } catch (memError) {
          console.error('Memory extraction failed:', memError);
        }
      }
    } catch (error) {
      console.error("Regeneration failed:", error);
    } finally {
      setIsThinking(false);
      setIsSearchingWeb(false);
    }
  };

  const handleTextSelection = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const selectedText = selection.toString().trim();
      if (selectedText.length > 10) { // Only show for meaningful selections
        setSelectedText(selectedText);
        // Find which message contains this selection
      const range = selection.getRangeAt(0);
      let el = (range.commonAncestorContainer as HTMLElement | null);
      while (el && el !== document.body) {
        const hasAttr = (el as HTMLElement).hasAttribute?.('data-message-id');
        if (hasAttr) {
          const id = el.getAttribute('data-message-id') || '';
          setSelectedMessageId(id);
          break;
        }
        el = el.parentElement;
      }
      }
    }
  };

  const handleAskNexarisWithContext = () => {
    if (selectedText) {
      const contextMessage = `Regarding this text: "${selectedText}"`;
      setInput(contextMessage);
      setSelectedText('');
      setSelectedMessageId('');
      // Focus the textarea
      if (textareaRef.current) {
        textareaRef.current.focus();
      }
    }
  };

  const handleInputDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.items && event.dataTransfer.items.length > 0) {
      setIsDragOverInput(true);
    }
  };

  const handleInputDragLeave = (event: React.DragEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).contains(event.relatedTarget as Node)) return;
    setIsDragOverInput(false);
  };

  const handleInputDrop = async (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOverInput(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      await addFilesToPreviews(files);
    }
  };

  const handleTextareaPaste = async (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const imageFiles = Array.from(event.clipboardData.files || []).filter(f =>
      f.type.startsWith('image/')
    );
    if (imageFiles.length > 0) {
      event.preventDefault();
      await addFilesToPreviews(imageFiles);
      return;
    }
  };

  const buildFilePreviews = async (files: File[]): Promise<FilePreview[]> => {
    const previewPromises = files.map(file => {
        return new Promise<FilePreview>((resolve) => {
            let type: FilePreview['type'] = 'other';
            
            if (file.type.startsWith('image/')) {
                type = 'image';
                const reader = new FileReader();
                reader.onload = (e) => resolve({ file, preview: e.target?.result as string, type });
                reader.onerror = () => resolve({ file, preview: null, type });
                reader.readAsDataURL(file);
            } else if (file.type === 'application/pdf') {
                type = 'pdf';
                resolve({ file, preview: URL.createObjectURL(file), type });
            } else if (file.type.startsWith('text/')) {
                type = 'text';
                const reader = new FileReader();
                reader.onload = (e) => resolve({ file, preview: e.target?.result as string, type });
                reader.onerror = () => resolve({ file, preview: null, type });
                reader.readAsText(file);
            } else {
                type = 'other';
                resolve({ file, preview: URL.createObjectURL(file), type });
            }
        });
    });

    return await Promise.all(previewPromises);
  };

  const addFilesToPreviews = async (files: FileList | File[]) => {
    const fileArray = Array.from(files as any) as File[];
    const newPreviews = await buildFilePreviews(fileArray);
    setFilePreviews(prev => [...prev, ...newPreviews]);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    await addFilesToPreviews(files);

    // Reset input to allow re-uploading the same file if needed
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const removeFilePreview = (index: number) => {
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllPreviews = () => {
    setFilePreviews([]);
  };

  const handleContextMenu = (e: React.MouseEvent, messageId?: string) => {
    e.preventDefault();
    const selection = window.getSelection();
    const selectedText = selection?.toString().trim() || '';

    // If there's selected text, position the menu above the input area
    let x = e.clientX;
    let y = e.clientY;

    if (selectedText && textareaRef.current) {
      const rect = textareaRef.current.getBoundingClientRect();
      x = rect.left + rect.width / 2 - 100; // Center above input
      y = rect.top - 10; // Just above the input
    }

    setContextMenu({
      x,
      y,
      messageId,
      selectedText
    });
  };

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return;

    switch (action) {
      case 'copy':
        if (contextMenu.selectedText) {
          copyToClipboard(contextMenu.selectedText);
        }
        break;
      case 'ask-alfred':
        if (contextMenu.selectedText) {
          setInput(`Regarding "${contextMenu.selectedText}": `);
          if (textareaRef.current) {
            textareaRef.current.focus();
          }
        }
        break;
      case 'edit':
        if (contextMenu.messageId) {
          const target = messages.find(m => m.id === contextMenu.messageId);
          if (target && target.sender === 'user') {
            setMessages(prev => prev.map(m =>
              m.id === contextMenu.messageId ? { ...m, isEditing: true, originalText: m.text } : m
            ));
          }
        }
        break;
      case 'delete':
        if (contextMenu.messageId) {
          handleDeleteMessage(contextMenu.messageId);
        }
        break;
      case 'regenerate':
        if (contextMenu.messageId) {
          const messageIndex = messages.findIndex(msg => msg.id === contextMenu.messageId);
          if (messageIndex !== -1 && messages[messageIndex].sender === 'ai') {
            for (let i = messageIndex - 1; i >= 0; i--) {
              if (messages[i].sender === 'user') {
                const messagesUpToUser = messages.slice(0, i + 1);
                regenerateResponse(messagesUpToUser);
                break;
              }
            }
          }
        }
        break;
    }

    setContextMenu(null);
  };

  const handleSidebarAction = (action: string) => {
    let prompt = '';
    switch (action) {
      case 'search-web':
        prompt = 'Please help me search the web for information. What would you like me to search for?';
        break;
      case 'create-document':
        prompt = 'I need help creating a business document. What type of document would you like me to help with?';
        break;
      case 'business-analysis':
        prompt = 'I can help analyze your business data. What specific analysis would you like me to perform?';
        break;
      case 'view-app-data':
        prompt = 'I have access to your app data. What information would you like me to summarize or analyze?';
        break;
      case 'chat-history':
        prompt = 'Would you like me to summarize our previous conversations or help you find something specific from our chat history?';
        break;
      case 'settings':
        prompt = 'What AI settings would you like to adjust? I can help with response style, memory management, or other preferences.';
        break;
      default:
        prompt = `How can I help you with ${action}?`;
    }

    const aiMessage: Message = {
      id: Date.now().toString(),
      sender: 'ai',
      text: prompt,
      timestamp: new Date()
    };
    const updatedMessages = [...messages, aiMessage];
    updateCurrentChat(updatedMessages);
  };
  
  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const renderPreviewDialogContent = (fp: FilePreview | null) => {
    if (!fp) {
      return null;
    }
    if (fp.type === 'image' && fp.preview) {
      return (
        <img
          src={fp.preview}
          alt={fp.file.name}
          className="max-w-full max-h-[70vh] object-contain"
        />
      );
    }
    if (fp.type === 'pdf' && fp.preview) {
      return (
        <iframe
          src={fp.preview}
          className="w-full h-[70vh]"
          title={fp.file.name}
        />
      );
    }
    if (fp.type === 'text' && fp.preview) {
      return (
        <pre className="whitespace-pre-wrap text-sm max-h-[70vh] overflow-auto">
          {fp.preview}
        </pre>
      );
    }
    if (fp.file.type.startsWith('audio/') && fp.preview) {
      return <audio controls src={fp.preview} className="w-full" />;
    }
    if (fp.file.type.startsWith('video/') && fp.preview) {
      return (
        <video
          controls
          src={fp.preview}
          className="max-w-full max-h-[70vh]"
        />
      );
    }
    return (
      <div className="text-sm text-muted-foreground">
        Preview not available for this file type.
      </div>
    );
  };
  
  return (
    <>
      <div className="flex h-full bg-gradient-to-br from-background via-background to-muted/10 relative overflow-hidden font-sans">
        <div className={cn(
          "border-r border-border/50 bg-background/95 backdrop-blur-md flex-shrink-0 h-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out",
          isSidebarCollapsed ? "w-16" : "w-80"
        )}>
            <AiSidebar
              chats={chats}
              currentChatId={currentChatId}
              switchChat={switchChat}
              deleteChat={deleteChat}
              deleteChats={deleteChats}
              renameChat={renameChat}
              onNewChat={createNewChat}
              isCollapsed={isSidebarCollapsed}
              setIsCollapsed={setIsSidebarCollapsed}
            />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex-1 overflow-hidden">
            <ScrollArea className="h-full" ref={scrollAreaRef}>
              <div className="max-w-4xl mx-auto px-6 py-8">
                <div className="space-y-6">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4">
                      <div className="p-4 rounded-full bg-primary/10 mb-6 animate-in zoom-in-50 duration-500">
                        <Logo className="h-12 w-12 text-primary" />
                      </div>
                      <h3 className="text-2xl font-bold mb-2">How can I help you today?</h3>
                      <p className="text-muted-foreground max-w-md text-center mb-8">
                        I can help you analyze data, draft documents, research topics, or manage your daily tasks.
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl">
                        <Card
                          className="hover:bg-muted/50 transition-colors cursor-pointer border-muted-foreground/20"
                          onClick={() => setInput('Analyze my recent expenses and suggest budget improvements.')}
                        >
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500">
                              <PieChart className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium">Analyze Finances</div>
                              <div className="text-xs text-muted-foreground">Review expenses & budget</div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card
                          className="hover:bg-muted/50 transition-colors cursor-pointer border-muted-foreground/20"
                          onClick={() => setInput('Help me draft a proposal for a new client project.')}
                        >
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500">
                              <FileText className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium">Draft Document</div>
                              <div className="text-xs text-muted-foreground">Proposals, emails, reports</div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card
                          className="hover:bg-muted/50 transition-colors cursor-pointer border-muted-foreground/20"
                          onClick={() => {
                            setCurrentMode('web');
                            setInput('What are the latest trends in AI technology?');
                          }}
                        >
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-green-500/10 text-green-500">
                              <Globe className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium">Web Research</div>
                              <div className="text-xs text-muted-foreground">Search latest trends & news</div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        <Card
                          className="hover:bg-muted/50 transition-colors cursor-pointer border-muted-foreground/20"
                          onClick={() => {
                            setCurrentMode('thinking');
                            setInput('Help me brainstorm ideas for increasing productivity.');
                          }}
                        >
                          <CardContent className="p-4 flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-orange-500/10 text-orange-500">
                              <BrainCircuit className="h-5 w-5" />
                            </div>
                            <div className="text-left">
                              <div className="font-medium">Brainstorming</div>
                              <div className="text-xs text-muted-foreground">Creative problem solving</div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <div
                        key={msg.id}
                        className="group relative"
                        onContextMenu={(e) => handleContextMenu(e, msg.id)}
                      >
                        <div
                          className={cn(
                            "flex gap-4 max-w-3xl",
                            msg.sender === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
                          )}
                        >
                          <div className="flex-shrink-0 mt-1">
                            {msg.sender === 'ai' ? (
                              <Avatar className="h-9 w-9 border border-primary/40 bg-gradient-to-br from-primary/90 to-primary/60 text-background shadow-sm">
                                <div className="flex h-full w-full items-center justify-center">
                                  <Logo className="h-5 w-5" />
                                </div>
                              </Avatar>
                            ) : (
                              <Avatar className="h-8 w-8 border border-border">
                                <AvatarFallback className="bg-muted text-muted-foreground">
                                  {getInitials(userProfile.name)}
                                </AvatarFallback>
                              </Avatar>
                            )}
                          </div>
                          <div className={cn("flex-1 min-w-0", msg.sender === 'user' && "text-right")}>
                            <div
                              className={cn(
                                "flex items-center gap-2 mb-1",
                                msg.sender === 'user' && "flex-row-reverse justify-start"
                              )}
                            >
                              <span className="font-semibold text-sm text-foreground">
                                {msg.sender === 'ai' ? 'Alfred AI' : userProfile.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(msg.timestamp as any).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {msg.mode && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-full border border-primary/20 font-medium uppercase tracking-wider">
                                  {msg.mode === 'thinking' && 'Thinking'}
                                  {msg.mode === 'deep-research' && 'Deep Research'}
                                  {msg.mode === 'web' && 'Web Search'}
                                </span>
                              )}
                            </div>

                            {msg.attachments && msg.attachments.length > 0 && (
                              <div
                                className={cn(
                                  "mb-2 flex flex-wrap gap-2",
                                  msg.sender === 'user' && "justify-end"
                                )}
                              >
                                {msg.attachments.map((file, idx) => (
                                  <div
                                    key={idx}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-background border border-border rounded-lg text-xs shadow-sm cursor-pointer hover:bg-muted"
                                    onDoubleClick={() => {
                                      if ((file as any).data) {
                                        generateFileFromJSON((file as any).data);
                                      }
                                    }}
                                  >
                                    <Paperclip className="h-3 w-3 text-muted-foreground" />
                                    <span className="font-medium">{file.name}</span>
                                  </div>
                                ))}
                              </div>
                            )}

                            <div
                              className={cn(
                                "flex items-start gap-2 group/bubble",
                                msg.sender === 'user' && "justify-end"
                              )}
                            >
                              <div
                                className={cn(
                                  "prose prose-sm max-w-none rounded-2xl px-5 py-3 shadow-sm relative overflow-hidden transition-all duration-500",
                                  msg.sender === 'user'
                                    ? "bg-blue-600 text-white [&_*]:!text-white prose-headings:!text-white prose-p:!text-white prose-strong:!text-white prose-code:!text-white prose-a:!text-white/90 prose-pre:bg-black/10 prose-pre:!text-white"
                                    : "bg-card border border-border/50 dark:prose-invert"
                                )}
                                data-message-id={msg.id}
                                onMouseUp={msg.sender === 'ai' ? handleTextSelection : undefined}
                              >
                                {msg.isEditing ? (
                                  <div className="space-y-2 min-w-[300px]">
                                    <textarea
                                      value={msg.text}
                                      onChange={(e) => {
                                        setMessages((prev) =>
                                          prev.map((m) =>
                                            m.id === msg.id ? { ...m, text: e.target.value } : m
                                          )
                                        );
                                      }}
                                      style={{ outline: 'none', boxShadow: 'none' }}
                                      className="min-h-[100px] w-full resize-none rounded-md bg-background text-foreground border border-border/50 px-3 py-2 text-sm focus:border-border"
                                      autoFocus
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => {
                                          setMessages((prev) =>
                                            prev.map((m) =>
                                              m.id === msg.id
                                                ? {
                                                    ...m,
                                                    text: m.originalText || m.text,
                                                    isEditing: false,
                                                  }
                                                : m
                                            )
                                          );
                                        }}
                                      >
                                        Cancel
                                      </Button>
                                      <Button
                                        size="sm"
                                        onClick={() => handleEditMessage(msg.id, msg.text)}
                                      >
                                        Save Changes
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="whitespace-normal break-words min-h-[24px]">
                                    {msg.text ? (
                                      <>
                                        <MarkdownRenderer content={msg.text} />
                                        {msg.isIncomplete && (
                                          <div className="mt-4 pt-3 border-t border-border/20 flex justify-end">
                                            <Button
                                              variant="secondary"
                                              size="sm"
                                              className="gap-2 text-xs h-8 bg-blue-700 hover:bg-blue-800 text-white border-none"
                                              onClick={() => handleContinue(msg.id)}
                                              disabled={isThinking}
                                            >
                                              <Play className="h-3 w-3" />
                                              Continue generating
                                            </Button>
                                          </div>
                                        )}
                                      </>
                                    ) : (
                                      <div className="flex items-center gap-2 h-6 text-muted-foreground">
                                        <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                        <span className="text-sm font-medium animate-pulse">Thinking...</span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>

                            {!msg.isEditing && (
                              <div
                                className={cn(
                                  "mt-1 flex items-center gap-1 text-[11px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity",
                                  msg.sender === 'user' ? "justify-end" : "justify-start"
                                )}
                              >
                                {msg.sender === 'ai' && index === messages.length - 1 && !isThinking && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 px-2 text-xs gap-1"
                                        onClick={() => regenerateResponse(messages.slice(0, -1))}
                                    >
                                        <RefreshCw className="h-3 w-3" />
                                        Regenerate
                                    </Button>
                                )}
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-6 w-6"
                                  onClick={() => {
                                    copyToClipboard(msg.text);
                                    setCopiedMessageId(msg.id);
                                    setTimeout(() => {
                                      setCopiedMessageId(prev =>
                                        prev === msg.id ? null : prev
                                      );
                                    }, 2000);
                                  }}
                                >
                                  {copiedMessageId === msg.id ? (
                                    <span className="text-[10px] font-medium">
                                      Copied
                                    </span>
                                  ) : (
                                    <ClipboardCheck className="h-3 w-3" />
                                  )}
                                </Button>
                                {msg.sender === 'user' && (
                                  <>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6"
                                      onClick={() =>
                                        setMessages((prev) =>
                                          prev.map((m) =>
                                            m.id === msg.id
                                              ? {
                                                  ...m,
                                                  isEditing: true,
                                                  originalText: m.text,
                                                }
                                              : m
                                          )
                                        )
                                      }
                                    >
                                      <Edit className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      className="h-6 w-6"
                                      onClick={() => handleDeleteMessage(msg.id)}
                                    >
                                      <Trash2 className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                                {msg.sender === 'ai' && (
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-6 w-6"
                                    onClick={() => handleDeleteMessage(msg.id)}
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </Button>
                                )}
                              </div>
                            )}

                            {msg.sources && msg.sources.length > 0 && (
                              <div className="mt-2 p-3 bg-muted/30 rounded-lg border border-border/50">
                                <div className="flex items-center gap-2 mb-2">
                                  <Globe className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs font-medium text-muted-foreground">
                                    Sources Cited
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {msg.sources.map((source, idx) => (
                                    <a
                                      key={idx}
                                      href={
                                        source.startsWith('http')
                                          ? source
                                          : `https://${source}`
                                      }
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs px-2 py-1 bg-background border border-border/50 text-primary rounded-md hover:bg-primary/5 transition-colors flex items-center gap-1"
                                    >
                                      <span className="truncate max-w-[150px]">
                                        {source
                                          .replace(/^https?:\/\/(www\.)?/, '')
                                          .split('/')[0]}
                                      </span>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedText &&
                          selectedMessageId === msg.id &&
                          msg.sender === 'ai' && (
                            <div className="absolute -top-8 right-0 z-10 animate-in fade-in slide-in-from-bottom-2">
                              <Button
                                size="sm"
                                onClick={handleAskNexarisWithContext}
                                className="shadow-lg gap-2"
                              >
                                <MessageSquare className="h-3 w-3" />
                                Ask about selection
                              </Button>
                            </div>
                          )}
                      </div>
                    ))
                  )}

                </div>
              </div>
            </ScrollArea>
          </div>

          <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
            <div className="max-w-4xl mx-auto px-6 py-6">
              {filePreviews.length > 0 && (
                <div className="mb-4 p-4 bg-muted/20 rounded-xl border border-border/50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold">
                      Attached Files ({filePreviews.length})
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearAllPreviews}
                      className="text-xs"
                    >
                      Clear All
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {filePreviews.map((fp, index) => (
                      <div
                        key={index}
                        className="relative group border border-border rounded-lg p-3 bg-background/50 hover:bg-background transition-colors cursor-pointer"
                        onDoubleClick={() =>
                          setPreviewDialog({
                            open: true,
                            file: fp,
                          })
                        }
                      >
                        {fp.type === 'image' && fp.preview && (
                          <img
                            src={fp.preview}
                            alt={fp.file.name}
                            className="w-full h-20 object-cover rounded-md mb-2"
                          />
                        )}
                        {fp.type === 'pdf' && (
                          <div className="w-full h-20 bg-red-50 dark:bg-red-950/20 rounded-md flex items-center justify-center mb-2 border">
                            <FileText className="h-8 w-8 text-red-600" />
                          </div>
                        )}
                        {fp.type === 'text' && (
                          <div className="w-full h-20 bg-blue-50 dark:bg-blue-950/20 rounded-md flex items-center justify-center mb-2 border">
                            <FileText className="h-8 w-8 text-blue-600" />
                          </div>
                        )}
                        <p className="text-xs font-medium truncate mb-1">
                          {fp.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(fp.file.size / 1024).toFixed(1)} KB
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute -top-2 -right-2 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 bg-destructive text-destructive-foreground hover:bg-destructive/80 transition-all duration-200 rounded-full shadow-sm"
                          onClick={() => removeFilePreview(index)}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="relative">
                <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
                  <Button
                    variant={currentMode === 'web' ? "secondary" : "outline"}
                    size="sm"
                    className={cn(
                      "h-8 rounded-full text-xs gap-2 transition-all",
                      currentMode === 'web' &&
                        "bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20"
                    )}
                    onClick={() => setCurrentMode(currentMode === 'web' ? null : 'web')}
                  >
                    <Globe className="h-3.5 w-3.5" />
                    Web Search
                  </Button>
                  <Button
                    variant={currentMode === 'thinking' ? "secondary" : "outline"}
                    size="sm"
                    className={cn(
                      "h-8 rounded-full text-xs gap-2 transition-all",
                      currentMode === 'thinking' &&
                        "bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20"
                    )}
                    onClick={() =>
                      setCurrentMode(currentMode === 'thinking' ? null : 'thinking')
                    }
                  >
                    <BrainCircuit className="h-3.5 w-3.5" />
                    Reasoning
                  </Button>
                  <Button
                    variant={currentMode === 'deep-research' ? "secondary" : "outline"}
                    size="sm"
                    className={cn(
                      "h-8 rounded-full text-xs gap-2 transition-all",
                      currentMode === 'deep-research' &&
                        "bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/20"
                    )}
                    onClick={() =>
                      setCurrentMode(
                        currentMode === 'deep-research' ? null : 'deep-research'
                      )
                    }
                  >
                    <Search className="h-3.5 w-3.5" />
                    Deep Research
                  </Button>
                </div>

                <div
                  className={cn(
                    "bg-background/40 hover:bg-background/60 rounded-3xl transition-all duration-200 outline-none ring-0 border-0 focus-within:ring-0 focus-within:outline-none focus-within:bg-background/80 shadow-[0_0_15px_rgba(0,0,0,0.05)]",
                    isDragOverInput ? "border-dashed border-2 border-primary/60 bg-primary/5" : "border border-border/10"
                  )}
                  onDragOver={handleInputDragOver}
                  onDragLeave={handleInputDragLeave}
                  onDrop={handleInputDrop}
                >
                  <textarea
                    ref={textareaRef}
                    placeholder={
                      isListening
                        ? "Listening..."
                        : currentMode === 'web'
                        ? "Ask a question to search the web..."
                        : currentMode === 'thinking'
                        ? "Ask a complex question requiring reasoning..."
                : "Ask Alfred AI anything..."
                    }
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onPaste={handleTextareaPaste}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                    style={{ outline: 'none', boxShadow: 'none' }}
                    className="w-full resize-none p-4 pr-32 text-base border-0 ring-0 bg-transparent rounded-2xl min-h-[60px] max-h-64"
                    rows={1}
                  />
                  <div className="flex items-center justify-between px-3 pb-3">
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground rounded-full"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                        accept="*/*"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant={isListening ? "secondary" : "ghost"}
                        className={cn(
                          "h-8 w-8 p-0 rounded-full",
                          isListening
                            ? "bg-red-500/10 text-red-500 animate-pulse"
                            : "text-muted-foreground hover:text-foreground"
                        )}
                        onClick={isListening ? stopListening : startListening}
                      >
                        <Mic className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground hidden sm:inline-block mr-2">
                        {input.length > 0
                          ? `${input.length} chars`
                          : 'Enter to send, Shift+Enter for new line'}
                      </span>
                      <Button
                        size="sm"
                        onClick={() => handleSendMessage()}
                        disabled={
                          (!input.trim() && filePreviews.length === 0) || isThinking
                        }
                        className={cn(
                          "rounded-full px-4 transition-all bg-primary/10 hover:bg-primary/20 text-primary border-none",
                          input.trim() ? "w-auto" : "w-10 px-0"
                        )}
                      >
                        {isThinking ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Send className="h-4 w-4" />
                        )}
                        {input.trim() && !isThinking && (
                          <span className="ml-2">Send</span>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog
        open={previewDialog.open}
        onOpenChange={(open) =>
          setPreviewDialog(prev => ({
            ...prev,
            open,
            file: open ? prev.file : null,
          }))
        }
      >
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {previewDialog.file?.file.name || 'File Preview'}
            </DialogTitle>
          </DialogHeader>
          {renderPreviewDialogContent(previewDialog.file)}
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!chatToDelete}
        onOpenChange={(open) => !open && setChatToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setChatToDelete(null)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteChat}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
