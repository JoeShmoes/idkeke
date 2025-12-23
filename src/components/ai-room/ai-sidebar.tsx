'use client';

import { ScrollArea } from '@/components/ui/scroll-area';
import { Sparkles, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Chat {
  id: string;
  name: string;
  messages: any[];
  createdAt: Date;
  lastActivity: Date;
}

interface AiSidebarProps {
  chats: Chat[];
  currentChatId: string;
  switchChat: (id: string) => void;
  deleteChat: (id: string) => void;
}

export default function AiSidebar({ chats, currentChatId, switchChat, deleteChat }: AiSidebarProps) {
  return (
    <div className="w-80 h-full border-r border-border/50 bg-gradient-to-b from-background to-muted/20 backdrop-blur-sm">
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 rounded-lg bg-primary/10">
            <Sparkles className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-semibold">Alfred Assistant</h2>
            <p className="text-sm text-muted-foreground">Your AI companion</p>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-16rem)]">
          <div className="space-y-2">
            {chats.length === 0 && (
              <div className="text-center py-4 text-sm text-muted-foreground">
                No chats yet. Start a new conversation.
              </div>
            )}
            {chats.map((chat) => (
              <div
                key={chat.id}
                className={cn(
                  "group p-3 rounded-lg cursor-pointer transition-all duration-200 hover:bg-accent/50 border border-transparent hover:border-border/50",
                  currentChatId === chat.id ? "bg-accent border-border" : ""
                )}
                onClick={() => switchChat(chat.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{chat.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {chat.messages.length} messages
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteChat(chat.id);
                      }}
                      className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
