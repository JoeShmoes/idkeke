'use client';

import { useEffect, useState } from 'react';
import { useApp } from '@/components/layout/app-provider';
import { useSound } from '@/hooks/use-sound';
import { isSameMinute, parseISO, isAfter } from 'date-fns';

export default function CalendarNotifications() {
  const { events } = useApp();
  const { playSound } = useSound();
  const [notifiedEvents, setNotifiedEvents] = useState<Set<string>>(new Set());

  useEffect(() => {
    const checkEvents = () => {
      const now = new Date();
      
      events.forEach(event => {
        if (!event.start_date) return;
        
        const startDate = parseISO(event.start_date);
        
        // Check if event is starting now (within current minute) and hasn't been notified
        if (isSameMinute(now, startDate) && !notifiedEvents.has(event.id)) {
          // Play sound
          console.log('Playing reminder sound for event:', event.title);
          playSound('reminder');
          
          // Mark as notified
          setNotifiedEvents(prev => {
            const newSet = new Set(prev);
            newSet.add(event.id);
            return newSet;
          });

          // Optional: Show browser notification
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Event Starting: ${event.title || 'Untitled'}`, {
              body: `Starting at ${startDate.toLocaleTimeString()}`,
            });
          }
        }
      });
    };

    // Request notification permission on mount
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Check every 10 seconds
    const interval = setInterval(checkEvents, 10000);
    
    // Initial check
    checkEvents();

    return () => clearInterval(interval);
  }, [events, playSound, notifiedEvents]);

  return null; // This component doesn't render anything
}
