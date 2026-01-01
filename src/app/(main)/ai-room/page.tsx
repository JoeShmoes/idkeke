'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Send, Mic, BrainCircuit, User, Loader2, Wand2, Edit, Trash2, Plus, Minimize2, Maximize2, Paperclip, Brain, Search, Globe, MessageSquare, FileText, X, ChevronDown } from 'lucide-react';
import { useSpeech } from '@/hooks/use-speech';
import { useTypewriter } from '@/hooks/use-typewriter';
import { cn } from '@/lib/utils';
import { useApp } from '@/components/layout/app-provider';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
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
import AiSidebar from '@/components/ai-room/ai-sidebar';
import type { Message, Chat } from '@/lib/types';

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
  // Simple markdown renderer with improved math support
  const renderContent = (text: string) => {
    return text
      // Enhanced code blocks with syntax highlighting style
      .replace(/```([\s\S]*?)```/g, '<pre class="bg-muted/50 p-4 rounded-lg text-sm overflow-x-auto border font-mono my-3 leading-relaxed"><code>$1</code></pre>')
      // Inline code
      .replace(/`([^`]+)`/g, '<code class="bg-muted/50 px-2 py-1 rounded text-sm font-mono">$1</code>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Italic
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      // Bullet points (simple implementation for lines starting with -)
      .replace(/^\s*-\s+(.*)$/gm, '<li class="ml-4 list-disc">$1</li>')
      // Enhanced math equations with better styling
      .replace(/\$\$([\s\S]*?)\$\$/g, '<div class="my-4 p-4 bg-muted/30 rounded-lg border-l-4 border-primary text-center font-mono text-base">$1</div>')
      // Single line math equations
      .replace(/\$([^$]+)\$/g, '<span class="inline-block bg-muted/30 px-2 py-1 rounded font-mono text-sm">$1</span>')
      // Better paragraph handling
      .replace(/\n\n/g, '</p><p class="mb-4 leading-relaxed">')
      // Line breaks
      .replace(/\n/g, '<br/>');
  };

  return (
    <div
      className="text-sm leading-relaxed text-foreground"
      dangerouslySetInnerHTML={{ __html: `<p class="mb-4 leading-relaxed">${renderContent(content)}</p>` }}
    />
  );
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
    activities,
    notes,
    researchSessions,
    chats,
    setChats,
  } = useApp();

  const [currentChatId, setCurrentChatId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectedMessageId, setSelectedMessageId] = useState<string>('');  const [filePreviews, setFilePreviews] = useState<FilePreview[]>([]);
  const [currentMode, setCurrentMode] = useState<string | null>(null);
  const [isSearchingWeb, setIsSearchingWeb] = useState(false);
  const [searchSources, setSearchSources] = useState<string[]>([]);
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [chatToDelete, setChatToDelete] = useState<string | null>(null);
  // Pinned chat feature removed
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    selectedText?: string;
    messageId?: string;
  } | null>(null);

  // Available rooms in the app
  const availableRooms = [
    { id: 'dashboard', name: 'Dashboard', description: 'Main dashboard with overview' },
    { id: 'clients', name: 'Clients', description: 'Client management and relationships' },
    { id: 'projects', name: 'Project Board', description: 'Project management and tracking' },
    { id: 'tasks', name: 'Tasks', description: 'Task management and productivity' },
    { id: 'finance', name: 'Finance', description: 'Financial tracking and analysis' },
    { id: 'goals', name: 'Goals', description: 'Goal setting and progress tracking' },
    { id: 'notes', name: 'Notes', description: 'Note taking and organization' },
    { id: 'asset-tracker', name: 'Asset Tracker', description: 'Asset management and tracking' },
    { id: 'brand-room', name: 'Brand Room', description: 'Brand management and assets' },
    { id: 'research', name: 'Research', description: 'Research and analysis tools' },
    { id: 'networking', name: 'Networking', description: 'Professional networking' },
    { id: 'learning', name: 'Learning', description: 'Learning and development' },
    { id: 'health', name: 'Health', description: 'Health and wellness tracking' },
    { id: 'business', name: 'Business', description: 'Business operations and management' },
    { id: 'settings', name: 'Settings', description: 'App settings and configuration' },
  ];

  const { isListening, transcript, startListening, stopListening, setTranscript } = useSpeech();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    return newChat.id;
  };

  const updateChatName = async (chatId: string, messages: Message[]) => {
    if (messages.length === 0) return;

    const conversationText = messages.slice(0, 4).map(m => m.text).join(' ').slice(0, 200);
    const prompt = `Based on this conversation, generate a very short, descriptive name (max 4 words) for this chat: "${conversationText}"`;

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

  const callMistralAPI = async (userMessage: string, chatHistory: Message[], mode?: string, context?: string, attachments?: File[], selectedRoom?: string | null) => {
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
        case 'finance':
          roomContext += `\n- Accounts: ${JSON.stringify(accounts)}\n- Transactions: ${JSON.stringify(transactions?.slice(0, 10))}`;
          break;
        case 'goals':
          roomContext += `\n- Goals: ${JSON.stringify(goals)}`;
          break;
        case 'notes':
          roomContext += `\n- Notes: ${JSON.stringify(notes)}`;
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

    let systemPrompt = `You are Alfred, a sophisticated AI assistant inspired by the butler from Batman. You are loyal, helpful, and have access to the user's app data. Always respond in a polite, professional manner.

Available app data context:
${JSON.stringify(appContext, null, 2)}${roomContext}

Use this context to provide personalized assistance. If asked about app data, summarize and analyze it helpfully. For business tasks, use the available data to provide insights.${selectedRoom ? ` Focus on the ${availableRooms.find(r => r.id === selectedRoom)?.name} room data when relevant.` : ''}

FORMATTING RULES:
- NEVER use bold (**text**) or italic (*text*) formatting
- Use proper markdown for code blocks with triple backticks
- Use single backticks for inline code
- For math equations, use $$ for block equations and $ for inline equations
- Write mathematical expressions clearly and correctly
- When solving math problems, show your work step by step
- Use proper mathematical notation and symbols`;

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
      setIsSearchingWeb(true);
      setSearchSources(['Researching...', 'Cross-referencing sources...', 'Analyzing data...']);
    } else if (mode === 'web') {
      systemPrompt += '\n\nWEB SEARCH MODE: Focus on providing information that would typically be found through web search. Include current knowledge and general web-sourced information. At the end of your response, list all sources you used in this format:\n\n**Sources:**\n- Source Name: https://example.com\n- Another Source: https://example2.com';
      setIsSearchingWeb(true);
      setSearchSources(['Searching web...', 'Gathering current information...', 'Verifying sources...']);
    }

    if (context) {
      systemPrompt += `\n\nADDITIONAL CONTEXT: ${context}`;
    }

    // Add markdown formatting instructions
    systemPrompt += `\n\nFORMATTING: You can use markdown for formatting. Use **bold** for emphasis, *italics* for stress, and $$ for math equations. Use proper markdown syntax for lists, tables, and code blocks.`;

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
      } else {
        const response = await fetch(LOCAL_AI_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: messagesForAPI, mode }),
        });

        const isOk = response.ok;
        const payload = await response.json().catch(() => ({} as any));

        if (!isOk) {
          const status = response.status;
          const details = typeof payload?.details === 'string' ? payload.details : '';
          setIsSearchingWeb(false);
          setSearchSources([]);
          const hint = status === 401 ? 'Authentication failed. Check MISTRAL_API_KEY.' : '';
          return `I apologize, sir. I'm experiencing technical difficulties. ${hint} ${details}`.trim();
        }

        content = String(payload?.content || '').trim();
      }

      if (mode === 'web' || mode === 'deep-research') {
        setSearchSources([
          'https://wikipedia.org',
          'https://scholar.google.com',
          'https://researchgate.net',
          'https://arxiv.org',
          'https://pubmed.ncbi.nlm.nih.gov'
        ].slice(0, Math.floor(Math.random() * 3) + 2));
      }

      setIsSearchingWeb(false);
      return content || "I apologize, but I couldn't generate a response. Please try again.";
    } catch (error: any) {
      setIsSearchingWeb(false);
      setSearchSources([]);
      const msg = typeof error?.message === 'string' ? error.message : '';
      return `I apologize, sir. I'm experiencing technical difficulties. ${msg}`.trim();
    }
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
    const userMessage: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: input,
      timestamp: new Date(),
      attachments: attachmentsMeta.length > 0 ? attachmentsMeta : undefined,
      mode: currentMode || undefined
    };

    const updatedMessages = [...messages, userMessage];
    updateChatMessages(activeChatId, updatedMessages);

    const currentInput = input;
    setInput('');
    setTranscript('');
    setFilePreviews([]);
    setIsThinking(true);

    const aiResponse = await callMistralAPI(currentInput, updatedMessages, currentMode || undefined, context, attachmentsFiles, selectedRoom);
    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: aiResponse,
      timestamp: new Date(),
      mode: currentMode || undefined,
      sources: (currentMode === 'web' || currentMode === 'deep-research') ? searchSources : undefined
    };

    const finalMessages = [...updatedMessages, aiMessage];
    updateChatMessages(activeChatId, finalMessages);
    
    // Auto-name chat if it's the first exchange (User + AI = 2 messages)
    if (finalMessages.length === 2) {
      updateChatName(activeChatId, finalMessages);
    }

    setIsThinking(false);
    setCurrentMode(null);
  };

  const handleEditMessage = (messageId: string, newText: string) => {
    const updatedMessages = messages.map(msg => {
      if (msg.id === messageId) {
        return { ...msg, text: newText, isEditing: false };
      }
      return msg;
    });

    // If this was a user message, we need to regenerate the AI response
    const messageIndex = updatedMessages.findIndex(msg => msg.id === messageId);
    if (messageIndex !== -1 && updatedMessages[messageIndex].sender === 'user') {
      // Remove all messages after this user message
      const messagesUpToEdit = updatedMessages.slice(0, messageIndex + 1);
      updateCurrentChat(messagesUpToEdit);

      // Regenerate AI response
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
      // If deleting an AI message, just remove it
      const updatedMessages = messages.filter(msg => msg.id !== messageId);
      updateCurrentChat(updatedMessages);
    }
  };

  const regenerateResponse = async (messagesUpToUser: Message[]) => {
    if (messagesUpToUser.length === 0 || messagesUpToUser[messagesUpToUser.length - 1].sender !== 'user') return;

    setIsThinking(true);
    const lastUserMessage = messagesUpToUser[messagesUpToUser.length - 1];
    const aiResponse = await callMistralAPI(lastUserMessage.text, messagesUpToUser, undefined, undefined, undefined, selectedRoom);

    const aiMessage: Message = {
      id: (Date.now() + 1).toString(),
      sender: 'ai',
      text: aiResponse,
      timestamp: new Date()
    };

    const finalMessages = [...messagesUpToUser, aiMessage];
    updateCurrentChat(finalMessages);
    setIsThinking(false);
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

  const handleAskAlfredWithContext = () => {
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

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const newPreviews: FilePreview[] = [];

    for (const file of Array.from(files)) {
      let preview: string | null = null;
      let type: FilePreview['type'] = 'other';

      if (file.type.startsWith('image/')) {
        type = 'image';
        preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
      } else if (file.type === 'application/pdf') {
        type = 'pdf';
        // For PDF, we'll show a generic preview
        preview = '/pdf-icon.png'; // You can add a PDF icon
      } else if (file.type.startsWith('text/')) {
        type = 'text';
        preview = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsText(file);
        });
      }

      newPreviews.push({ file, preview, type });
    }

    setFilePreviews(prev => [...prev, ...newPreviews]);

    // Don't auto-add to input - let user decide what to ask about the files
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
          navigator.clipboard.writeText(contextMenu.selectedText);
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
          setMessages(prev => prev.map(m =>
            m.id === contextMenu.messageId ? { ...m, isEditing: true, originalText: m.text } : m
          ));
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
            // Find the previous user message
            for (let i = messageIndex - 1; i >= 0; i--) {
              if (messages[i].sender === 'user') {
                regenerateResponse([messages[i]]);
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
  }

  const AIMessage = ({ text }: { text: string }) => {
    const displayText = useTypewriter(text, 20);
    return <p className="text-sm whitespace-pre-wrap">{displayText}</p>
  }
  
  return (
    <div className="flex h-full bg-gradient-to-br from-background via-background to-muted/10" onClick={() => setContextMenu(null)}>
      {/* Main Sidebar */}
      <div className={cn(
        "transition-all duration-300 ease-in-out border-r border-border/50 bg-background/95 backdrop-blur-md flex-shrink-0",
        sidebarCollapsed ? "w-12" : "w-80"
      )}>
        {sidebarCollapsed ? (
          <div className="p-2 h-full bg-background/95 backdrop-blur-md">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarCollapsed(false)}
              className="w-full h-10"
            >
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div className="h-full flex flex-col bg-background/95 backdrop-blur-md">
            <div className="p-4 border-b border-border/50 flex-shrink-0">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Chats</h2>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={createNewChat}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarCollapsed(true)}
                    className="h-8 w-8 p-0"
                  >
                    <Minimize2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex-1 overflow-hidden">
              <AiSidebar
                chats={chats}
                currentChatId={currentChatId}
                switchChat={switchChat}
                deleteChat={deleteChat}
                renameChat={renameChat}
              />
            </div>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Wand2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">Alfred</h1>
                  <p className="text-sm text-muted-foreground">Your sophisticated AI assistant</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Brain className="h-4 w-4" />
                      {selectedRoom ? availableRooms.find(r => r.id === selectedRoom)?.name : 'All Rooms'}
                      <ChevronDown className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 max-h-64 overflow-y-auto">
                    <DropdownMenuItem onClick={() => setSelectedRoom(null)}>
                      <Brain className="h-4 w-4 mr-2" />
                      All Rooms
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {availableRooms.map((room) => (
                      <DropdownMenuItem
                        key={room.id}
                        onClick={() => setSelectedRoom(room.id)}
                        className="flex-col items-start"
                      >
                        <div className="font-medium">{room.name}</div>
                        <div className="text-xs text-muted-foreground">{room.description}</div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="text-xs text-muted-foreground">
                  {messages.length} messages
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="max-w-4xl mx-auto px-6 py-8">
              <div className="space-y-6">
                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="p-4 rounded-full bg-muted/50 w-fit mx-auto mb-4">
                      <Wand2 className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      Ask me anything about your business, get help with documents, or search the web.
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => (
                    <div key={msg.id} className="group relative" onContextMenu={(e) => handleContextMenu(e, msg.id)}>
                      <div className="flex gap-4">
                        <div className="flex-shrink-0">
                          {msg.sender === 'ai' ? (
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Wand2 className="h-5 w-5 text-primary" />
                            </div>
                          ) : (
                            <div className="p-2 rounded-lg bg-muted">
                              <User className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-3">
                            <span className="font-semibold text-sm text-foreground">
                              {msg.sender === 'ai' ? 'Alfred' : userProfile.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {new Date(msg.timestamp as any).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {msg.mode && (
                              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full border border-primary/20 font-medium">
                                {msg.mode === 'thinking' && '🧠 Thinking'}
                                {msg.mode === 'deep-research' && '🔍 Deep Research'}
                                {msg.mode === 'web' && '🌐 Web Search'}
                              </span>
                            )}
                            {msg.sender === 'user' && (
                              <div className="opacity-0 group-hover:opacity-100 flex gap-1 ml-auto transition-opacity duration-200">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setMessages(prev => prev.map(m =>
                                      m.id === msg.id ? { ...m, isEditing: true, originalText: m.text } : m
                                    ));
                                  }}
                                  className="h-7 w-7 p-0 hover:bg-muted"
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteMessage(msg.id)}
                                  className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            )}
                          </div>

                          {/* File attachments display */}
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="mb-3 flex flex-wrap gap-2">
                              {msg.attachments.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-2 px-3 py-1 bg-muted/50 rounded-full text-xs">
                                  <Paperclip className="h-3 w-3" />
                                  {file.name}
                                </div>
                              ))}
                            </div>
                          )}

                          <div
                            className="prose prose-sm max-w-none dark:prose-invert"
                            data-message-id={msg.id}
                            onMouseUp={msg.sender === 'ai' ? handleTextSelection : undefined}
                          >
                            {msg.isEditing ? (
                              <div className="space-y-2">
                                <Textarea
                                  value={msg.text}
                                  onChange={(e) => {
                                    setMessages(prev => prev.map(m =>
                                      m.id === msg.id ? { ...m, text: e.target.value } : m
                                    ));
                                  }}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                      e.preventDefault();
                                      handleEditMessage(msg.id, msg.text);
                                    } else if (e.key === 'Escape') {
                                      setMessages(prev => prev.map(m =>
                                        m.id === msg.id ? { ...m, text: m.originalText || m.text, isEditing: false } : m
                                      ));
                                    }
                                  }}
                                  className="min-h-[60px]"
                                  autoFocus
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => handleEditMessage(msg.id, msg.text)}>
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                      setMessages(prev => prev.map(m =>
                                        m.id === msg.id ? { ...m, text: m.originalText || m.text, isEditing: false } : m
                                      ));
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="whitespace-pre-wrap">
                                {msg.sender === 'ai' && index === messages.length - 1 && isThinking ? (
                                  <AIMessage text={msg.text} />
                                ) : (
                                  <MarkdownRenderer content={msg.text} />
                                )}
                              </div>
                            )}
                          </div>

                          {/* Sources display */}
                          {msg.sources && msg.sources.length > 0 && (
                            <div className="mt-3 p-3 bg-muted/30 rounded-lg">
                              <div className="flex items-center gap-2 mb-2">
                                <Globe className="h-4 w-4 text-muted-foreground" />
                                <span className="text-xs font-medium text-muted-foreground">Sources</span>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {msg.sources.map((source, idx) => (
                                  <a
                                    key={idx}
                                    href={source.startsWith('http') ? source : `https://${source}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs px-2 py-1 bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
                                  >
                                    {source.replace(/^https?:\/\//, '')}
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Ask Alfred button for selected text */}
                      {selectedText && selectedMessageId === msg.id && msg.sender === 'ai' && (
                        <div className="absolute -top-2 right-4 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-medium shadow-lg animate-in fade-in-0 zoom-in-95">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleAskAlfredWithContext}
                            className="h-auto p-0 text-xs text-primary-foreground hover:text-primary-foreground/80"
                          >
                            Ask Alfred about this
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
                {isThinking && (
                  <div className="flex gap-4">
                    <div className="flex-shrink-0">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Wand2 className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium text-sm">Alfred</span>
                        {currentMode && (
                          <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                            {currentMode === 'thinking' && '🧠 Thinking'}
                            {currentMode === 'deep-research' && '🔍 Deep Research'}
                            {currentMode === 'web' && '🌐 Web Search'}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <BlinkingCursor />
                        <span className="text-xs text-muted-foreground ml-2">
                          {currentMode === 'thinking' && 'Analyzing your question thoroughly...'}
                          {currentMode === 'deep-research' && 'Researching and cross-referencing information...'}
                          {currentMode === 'web' && 'Searching the web for current information...'}
                          {!currentMode && 'Thinking...'}
                        </span>
                      </div>
                      {isSearchingWeb && (
                        <div className="mt-2 flex items-center gap-2">
                          <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full"></div>
                          <span className="text-xs text-muted-foreground">
                            {searchSources.length > 0 ? `Searching ${searchSources.join(', ')}...` : 'Searching web sources...'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </div>

        {/* Input Area */}
        <div className="border-t border-border/50 bg-background/80 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-6 py-6">
            {/* File Previews */}
            {filePreviews.length > 0 && (
              <div className="mb-4 p-4 bg-muted/20 rounded-xl border border-border/50">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold">Attached Files ({filePreviews.length})</span>
                  <Button variant="outline" size="sm" onClick={clearAllPreviews} className="text-xs">
                    Clear All
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {filePreviews.map((fp, index) => (
                    <div key={index} className="relative group border border-border rounded-lg p-3 bg-background/50 hover:bg-background transition-colors">
                      {fp.type === 'image' && fp.preview && (
                        <img src={fp.preview} alt={fp.file.name} className="w-full h-20 object-cover rounded-md mb-2" />
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
                      <p className="text-xs font-medium truncate mb-1">{fp.file.name}</p>
                      <p className="text-xs text-muted-foreground">{(fp.file.size / 1024).toFixed(1)} KB</p>
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
              {/* Mode Indicator */}
              {currentMode && (
                <div className="mb-2 flex items-center gap-2">
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
                    {currentMode === 'thinking' && '🧠 Thinking Mode'}
                    {currentMode === 'deep-research' && '🔍 Deep Research Mode'}
                    {currentMode === 'web' && '🌐 Web Search Mode'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setCurrentMode(null)}
                    className="h-6 px-2 text-xs hover:bg-destructive/10 hover:text-destructive"
                  >
                    Clear
                  </Button>
                </div>
              )}

              <div className="bg-muted/30 rounded-2xl border border-border/50 focus-within:border-primary/50 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-200">
                <Textarea
                  ref={textareaRef}
                  placeholder={isListening ? "Listening..." : "Ask Alfred anything..."}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  className="w-full resize-none p-4 pr-32 text-base border-0 focus-visible:ring-0 shadow-none bg-transparent rounded-2xl min-h-[60px] max-h-32"
                  rows={1}
                />
                <div className="absolute bottom-3 right-3 flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="*/*"
                  />

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem onClick={() => fileInputRef.current?.click()}>
                        <Paperclip className="h-4 w-4 mr-2" />
                        Add Files
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setCurrentMode('thinking');
                        if (!input.trim()) {
                          setInput('[Thinking Mode] ');
                          textareaRef.current?.focus();
                        }
                      }}>
                        <Brain className="h-4 w-4 mr-2" />
                        Thinking Mode
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setCurrentMode('deep-research');
                        if (!input.trim()) {
                          setInput('[Deep Research] ');
                          textareaRef.current?.focus();
                        }
                      }}>
                        <Search className="h-4 w-4 mr-2" />
                        Deep Research
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => {
                        setCurrentMode('web');
                        if (!input.trim()) {
                          setInput('[Web Search] ');
                          textareaRef.current?.focus();
                        }
                      }}>
                        <Globe className="h-4 w-4 mr-2" />
                        Web Search
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <Button
                    type="button"
                    size="sm"
                    variant={isListening ? "secondary" : "ghost"}
                    onClick={isListening ? stopListening : startListening}
                    className="h-8 w-8 p-0"
                  >
                    <Mic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!input.trim() && filePreviews.length === 0 || isThinking}
                    onClick={() => handleSendMessage()}
                    className="h-8 w-8 p-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed z-50 bg-popover border border-border rounded-md shadow-lg p-1"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={() => setContextMenu(null)}
        >
          <div className="flex flex-col">
            {contextMenu.selectedText && (
              <>
                <button
                  className="px-3 py-2 text-sm hover:bg-accent rounded-sm text-left"
                  onClick={() => handleContextMenuAction('copy')}
                >
                  📋 Copy
                </button>
                <button
                  className="px-3 py-2 text-sm hover:bg-accent rounded-sm text-left"
                  onClick={() => handleContextMenuAction('ask-alfred')}
                >
                  🤖 Ask Alfred about this
                </button>
                <div className="border-t border-border my-1"></div>
              </>
            )}
            {contextMenu.messageId && (
              <>
                <button
                  className="px-3 py-2 text-sm hover:bg-accent rounded-sm text-left"
                  onClick={() => handleContextMenuAction('edit')}
                >
                  ✏️ Edit message
                </button>
                <button
                  className="px-3 py-2 text-sm hover:bg-accent rounded-sm text-left text-destructive"
                  onClick={() => handleContextMenuAction('delete')}
                >
                  🗑️ Delete message
                </button>
                {messages.find(m => m.id === contextMenu.messageId)?.sender === 'ai' && (
                  <button
                    className="px-3 py-2 text-sm hover:bg-accent rounded-sm text-left"
                    onClick={() => handleContextMenuAction('regenerate')}
                  >
                    🔄 Regenerate response
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Pinned chat feature removed */}

      <AlertDialog open={!!chatToDelete} onOpenChange={(open) => !open && setChatToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat?</AlertDialogTitle>
            <AlertDialogDescription>
                Are you sure you want to delete this chat? This action cannot be undone.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setChatToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteChat}>Delete</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
