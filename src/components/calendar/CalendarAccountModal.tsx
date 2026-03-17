'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, Loader2, X } from 'lucide-react';
import { loadGoogleApi, initGoogleClient, signInToGoogle, listUpcomingEvents } from '@/lib/google-calendar-sync';

interface CalendarAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEventsImported: (events: any[]) => void;
  onDisconnect?: () => void;
  existingCalendars: Array<{ id: string }>;
}

export default function CalendarAccountModal({ isOpen, onClose, onEventsImported, onDisconnect, existingCalendars = [] }: CalendarAccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showBetaNotice, setShowBetaNotice] = useState(false);

  useEffect(() => {
    const hasSeen = localStorage.getItem('calendar_beta_notice_seen');
    if (!hasSeen) {
      setShowBetaNotice(true);
    }
  }, []);

  const handleDismissNotice = () => {
    localStorage.setItem('calendar_beta_notice_seen', 'true');
    setShowBetaNotice(false);
  };

  const isGoogleConnected = existingCalendars.some(c => c.id === 'google-primary');

  const handleDisconnect = () => {
    if (onDisconnect) {
      onDisconnect();
      setConnected(null);
      onClose();
    }
  };

  const handleGoogleConnect = async () => {
    // We allow re-connecting to refresh the token or sync
    setLoading(true);
    setErrorMessage(null);
    try {
      loadGoogleApi(async (gapi) => {
        try {
          await initGoogleClient(gapi);
          await signInToGoogle(gapi, { prompt: 'consent' });
          // If signInToGoogle resolves, we have a valid token
          const events = await listUpcomingEvents(gapi);
          const formattedEvents = events.map((e: any) => ({
            id: e.id,
            title: e.summary,
            description: e.description,
            start_date: e.start.dateTime || e.start.date,
            end_date: e.end.dateTime || e.end.date,
            all_day: !e.start.dateTime,
            tag: 'Personal',
            calendar_id: 'google-primary',
          }));
          onEventsImported(formattedEvents);
          setConnected('google');
        } catch (error: any) {
          console.error('Google Sign-In Error:', error);
          let message = 'Unknown error';

          if (typeof error === 'string') {
            message = error;
          } else if (error?.message) {
            message = String(error.message);
          } else if (error?.error) {
            message =
              typeof error.error === 'object' ? JSON.stringify(error.error) : String(error.error);
          }

          if (message === 'popup_closed_by_user' || error?.error === 'popup_closed_by_user') {
            setErrorMessage('Sign-in cancelled by user.');
          } else if (message === 'access_denied' || error?.error === 'access_denied') {
            setErrorMessage('Access denied.');
          } else if (
            message.includes('invalid_request') ||
            message.includes('redirect_uri_mismatch') ||
            error?.error === 'invalid_request' ||
            error?.error === 'redirect_uri_mismatch'
          ) {
            setErrorMessage(
              'Google Auth Error: "invalid_request". Please add "http://localhost:3000" (or your current port) to "Authorized JavaScript origins" in Google Cloud Console.',
            );
          } else {
            setErrorMessage('Could not connect to Google Calendar. ' + message);
          }

          setTimeout(() => setErrorMessage(null), 10000);
        } finally {
          setLoading(false);
        }
      });
    } catch (error) {
      console.error('Loader Error:', error);
      setErrorMessage('Unable to load Google services. Please try again in a moment.');
      setTimeout(() => setErrorMessage(null), 3000);
      setLoading(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Calendar Account</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {showBetaNotice && (
            <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-md p-3 text-xs text-yellow-600 dark:text-yellow-400 flex justify-between items-start gap-2">
              <span>Note: For right now this is in beta and you will only be able to get the info from your calendar and not be in sync.</span>
              <button onClick={handleDismissNotice} className="shrink-0 text-yellow-600 dark:text-yellow-400 hover:opacity-70">
                <X className="h-3 w-3" />
              </button>
            </div>
          )}
          {errorMessage && (
            <div className="text-xs text-destructive bg-destructive/10 border border-destructive/30 rounded-md px-3 py-2">
              {errorMessage}
            </div>
          )}
          <div className="grid gap-2">
            <Button
              variant="outline"
              className="justify-between h-16"
              onClick={handleGoogleConnect}
              disabled={loading}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-10 flex items-center justify-center shrink-0">
                  <img
                    src="/logos/google.svg"
                    alt="Google"
                    width={28}
                    height={40}
                    className="w-full h-full object-contain"
                  />
                </div>
                <span>{isGoogleConnected ? 'Reconnect Google Calendar' : 'Google Calendar'}</span>
              </div>
              {loading && !connected ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : connected === 'google' ? (
                <Check className="w-4 h-4 text-green-500" />
              ) : isGoogleConnected ? (
                <span className="text-xs text-muted-foreground">Connected</span>
              ) : null}
            </Button>
            
            {isGoogleConnected && (
                <Button
                    variant="destructive"
                    className="w-full mt-2"
                    onClick={handleDisconnect}
                >
                    Disconnect Google Calendar
                </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
