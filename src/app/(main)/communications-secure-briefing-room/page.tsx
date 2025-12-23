
'use client';

import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { ExternalLink, MessageSquareText } from "lucide-react";

export default function CommunicationsSecureBriefingRoomPage() {
  const telegramUrl = "https://web.telegram.org/a/";

  useEffect(() => {
    const openTelegram = () => {
        window.open(telegramUrl, '_blank', 'noopener,noreferrer');
    }
    // Open the link automatically when the page loads.
    // This might be blocked by some browsers' popup blockers.
    try {
        openTelegram();
    } catch(e) {
        console.error("Could not automatically open Telegram. User may need to click the button.", e);
    }
  }, []);

  const handleOpenLink = () => {
    window.open(telegramUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-4">
        <MessageSquareText className="h-16 w-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold">Opening Telegram</h1>
        <p className="text-muted-foreground mt-2 max-w-md">Your secure briefing room has opened in a new tab. If it didn't, you can open it manually.</p>
        <Button onClick={handleOpenLink} className="mt-6">
            <ExternalLink className="mr-2 h-4 w-4" />
            Open Telegram Manually
        </Button>
    </div>
  );
}
