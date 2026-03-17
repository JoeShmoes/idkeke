'use client';

import { useEffect, useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { addDays, addWeeks, addMonths, setHours, isToday, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, getDay, isAfter, isBefore, startOfDay, endOfDay, differenceInCalendarWeeks } from 'date-fns';
import { loadGoogleApi, initGoogleClient, createGoogleEvent, updateGoogleEvent, deleteGoogleEvent } from '@/lib/google-calendar-sync';
import { v4 as uuidv4 } from 'uuid';
import Sidebar from '@/components/calendar/Sidebar';
import CalendarHeader from '@/components/calendar/CalendarHeader';
import MonthView from '@/components/calendar/MonthView';
import WeekView from '@/components/calendar/WeekView';
import DayView from '@/components/calendar/DayView';
import EventPanel from '@/components/calendar/EventPanel';
import NewEventModal from '@/components/calendar/NewEventModal';
import KeyboardShortcuts from '@/components/calendar/KeyboardShortcuts';
import CalendarAccountModal from '@/components/calendar/CalendarAccountModal';
import { useSafeLocalStorage } from '@/hooks/use-safe-local-storage';
import { useApp } from '@/components/layout/app-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useSound } from '@/hooks/use-sound';
import { useToast } from '@/hooks/use-toast';
import { CalendarEvent, CalendarDefinition } from '@/lib/types';

const DEFAULT_CALENDARS: CalendarDefinition[] = [];

const getGapi = () => {
  return new Promise<any>((resolve, reject) => {
    loadGoogleApi(async (gapi) => {
      if (gapi) {
        try {
          if (!gapi.client || !gapi.client.calendar) {
            await initGoogleClient(gapi);
          }
          resolve(gapi);
        } catch (e) {
          reject(e);
        }
      } else {
        reject('Failed to load GAPI');
      }
    });
  });
};

export default function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useSafeLocalStorage<'day' | 'week' | 'month'>('calendar-last-view', 'month');
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [newEventDate, setNewEventDate] = useState<Date | null>(null);
  const [newEventEndDate, setNewEventEndDate] = useState<Date | null>(null);
  const [selectedCalendars, setSelectedCalendars] = useSafeLocalStorage<string[]>('calendar-selected-calendars', []);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showNewCalendarModal, setShowNewCalendarModal] = useState(false);
  const [newCalendarName, setNewCalendarName] = useState('');
  const [showShortcutsHint, setShowShortcutsHint] = useState(false);

  const { 
    appSettings,
    events,
    setEvents,
    calendars,
    setCalendars,
    isDataLoaded
  } = useApp();

  const calendarsLoaded = isDataLoaded;

  const [shortcutsSeen, setShortcutsSeen, shortcutsLoaded] = useSafeLocalStorage<boolean>('calendar-shortcuts-seen', false);
  const { playSound } = useSound();
  const { toast } = useToast();
  const notifiedEventsRef = useRef<Set<string>>(new Set());

  // Google Calendar Sync Logic
  useEffect(() => {
    const syncGoogleCalendar = async () => {
      const googleCal = calendars.find(c => c.id === 'google-primary');
      if (!googleCal) return;

      try {
        const gapi = await getGapi();
        // Try silent sign-in
        await signInToGoogle(gapi, { prompt: 'none' });
        
        if (gapi.client.getToken()) {
            console.log('Google Calendar silently signed in, fetching events...');
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
            
            setEvents(prev => {
                const nonGoogleEvents = prev.filter(e => e.calendar_id !== 'google-primary');
                return [...nonGoogleEvents, ...formattedEvents];
            });
          }
      } catch (error: any) {
        // Silent sign-in failed, expected if session expired or not authorized
        console.warn('Google Calendar silent sync failed:', error);
        // We don't show a toast here to avoid annoying the user on every reload
        // But we could update a status indicator if we had one
      }
    };

    // Delay slightly to ensure GAPI is loaded
    const timeout = setTimeout(syncGoogleCalendar, 1000);
    return () => clearTimeout(timeout);
  }, [calendarsLoaded]); // Run once when calendars are loaded

  // Helper to expand recurring events
  const expandEvents = (events: CalendarEvent[], start: Date, end: Date) => {
    const expanded: CalendarEvent[] = [];
    const rangeStart = startOfDay(start);
    const rangeEnd = endOfDay(end);

    events.forEach((event) => {
      // If not recurring, check if it falls in range
      if (!event.recurrence || event.recurrence.enabled === false) {
        const eventStart = new Date(event.start_date);
        const eventEnd = event.end_date ? new Date(event.end_date) : eventStart;
        if (
          (isAfter(eventStart, rangeStart) || isSameDay(eventStart, rangeStart)) &&
          (isBefore(eventStart, rangeEnd) || isSameDay(eventStart, rangeEnd))
        ) {
          expanded.push(event);
        } else if (
             // Handle events spanning across the view window
             isBefore(eventStart, rangeEnd) && isAfter(eventEnd, rangeStart)
        ) {
            expanded.push(event);
        }
        return;
      }

      // Handle recurrence
      const { frequency, interval, weekDays, endDate: recurrenceEndDateStr } = event.recurrence;
      const eventStart = new Date(event.start_date);
      const recurrenceEndDate = recurrenceEndDateStr ? new Date(recurrenceEndDateStr) : null;
      
      // Safety break for infinite loops
      let current = new Date(eventStart);
      let count = 0;
      const maxCount = 365; // limit expansion for performance

      while (count < maxCount) {
        // Stop if passed recurrence end date
        if (recurrenceEndDate && isAfter(current, recurrenceEndDate)) break;
        
        // Stop if passed view range end (optimization)
        if (isAfter(current, rangeEnd)) break;

        // Check if current instance is within view range
        // We only add if it's visible in the current view
        const instanceEnd = event.end_date 
            ? new Date(current.getTime() + (new Date(event.end_date).getTime() - eventStart.getTime()))
            : new Date(current.getTime() + 60 * 60 * 1000);

        if (
          (isAfter(current, rangeStart) || isSameDay(current, rangeStart) || isBefore(current, rangeEnd)) &&
          (isBefore(current, rangeEnd) || isSameDay(current, rangeEnd)) &&
          (isAfter(instanceEnd, rangeStart))
        ) {
             // For weekly, check if day matches
             if (frequency === 'weekly' && weekDays && weekDays.length > 0) {
                 if (weekDays.includes(getDay(current))) {
                     expanded.push({
                         ...event,
                         id: `${event.id}_${current.toISOString()}`, // unique id for instance
                         start_date: current.toISOString(),
                         end_date: instanceEnd.toISOString(),
                         // Link back to original?
                     });
                 }
             } else {
                 expanded.push({
                     ...event,
                     id: `${event.id}_${current.toISOString()}`,
                     start_date: current.toISOString(),
                     end_date: instanceEnd.toISOString(),
                 });
             }
        }

        // Advance date
        switch (frequency) {
          case 'daily':
            current = addDays(current, interval);
            break;
          case 'weekly':
             // If we have specific weekDays, we still advance by weeks (interval) 
             // but we need to handle "every Mon, Wed" within that week logic.
             // Easier approach: iterate days and check.
             // But simpler implementation for now:
             // If weekDays is present, we advance day by day? No, that's slow.
             // Standard: "Repeat every 1 week on Mon, Wed"
             // Implementation: Advance 1 day at a time? No.
             // Better: Advance to next day, check if matches weekDays.
             // If we finish the week, skip (interval - 1) weeks.
             
             // Simplification: Just increment by 1 day and check match, 
             // BUT we need to respect interval.
             // "Every 2 weeks on Mon"
             // This is complex. 
             // Alternative: "Daily" expansion check.
             // Let's stick to standard simple logic:
             // If weekDays provided:
             //   Iterate through the week's days.
             //   If match, add.
             //   Then jump 'interval' weeks.
             // BUT current loop is single cursor.
             
             // Re-write loop for 'weekly' with weekDays:
             // Use a different strategy?
             // Let's just increment by 1 day and check "is this in a valid week?".
             // Valid week = (weekNumber - startWeekNumber) % interval === 0.
             
             // Actually, simplest is:
             current = addDays(current, 1);
             // But we need to skip weeks if interval > 1
             // For now, let's support basic "Weekly" (same day) OR "Weekly on specific days" (every week)
             // If interval > 1 and weekDays used, it gets tricky.
             // Let's assume interval=1 for weekDays usage for now or handle it properly later.
             break;
          case 'monthly':
            current = addMonths(current, interval);
            break;
          case 'yearly':
            current = addMonths(current, interval * 12);
            break;
        }
        count++;
      }
    });
    
    return expanded;
  };

  // Improved expandEvents that handles Weekly + Days correctly
  const getExpandedEvents = (events: CalendarEvent[], start: Date, end: Date) => {
    const expanded: CalendarEvent[] = [];
    const rangeStart = startOfDay(start);
    const rangeEnd = endOfDay(end);

    events.forEach((event) => {
        if (!event.recurrence) {
            // Normal event logic...
             const eventStart = new Date(event.start_date);
             const eventEnd = event.end_date ? new Date(event.end_date) : new Date(eventStart.getTime() + 3600000);
             if (
               (isBefore(eventStart, rangeEnd) && isAfter(eventEnd, rangeStart)) ||
               (isSameDay(eventStart, rangeStart) || isSameDay(eventStart, rangeEnd))
             ) {
               expanded.push(event);
             }
             return;
        }

        const { frequency, interval, weekDays, endDate: recurrenceEndDateStr } = event.recurrence;
        const eventStart = new Date(event.start_date);
        const recurrenceEndDate = recurrenceEndDateStr ? new Date(recurrenceEndDateStr) : null;
        const duration = event.end_date 
            ? new Date(event.end_date).getTime() - eventStart.getTime()
            : 3600000;

        let current = new Date(eventStart);
        
        while (true) {
             if (recurrenceEndDate && isAfter(current, recurrenceEndDate)) break;
             if (isAfter(current, rangeEnd)) break;

             const instanceEnd = new Date(current.getTime() + duration);

             // Check validity and overlap
             let isValidInstance = true;
             
             if (frequency === 'weekly' && weekDays && weekDays.length > 0) {
                 // Check if current week aligns with interval
                 const weeksDiff = differenceInCalendarWeeks(current, eventStart, { weekStartsOn: 0 });
                 if (weeksDiff % interval !== 0) {
                    isValidInstance = false;
                 } else {
                    const day = getDay(current);
                    if (!weekDays.includes(day)) {
                        isValidInstance = false;
                    }
                 }
             }

             if (isValidInstance && isBefore(current, rangeEnd) && isAfter(instanceEnd, rangeStart)) {
                  expanded.push({
                      ...event,
                      id: `${event.id}_${current.toISOString()}`,
                      start_date: current.toISOString(),
                      end_date: instanceEnd.toISOString(),
                  });
             }

             // Advance
             if (frequency === 'daily') {
                 current = addDays(current, interval);
             } else if (frequency === 'weekly') {
                 if (weekDays && weekDays.length > 0) {
                     current = addDays(current, 1);
                 } else {
                     current = addWeeks(current, interval);
                 }
             } else if (frequency === 'monthly') {
                 current = addMonths(current, interval);
             } else if (frequency === 'yearly') {
                 current = addMonths(current, interval * 12);
             }
        }
    });
    return expanded;
  };

  // Migration for new calendar structure
  useEffect(() => {
    if (!calendarsLoaded) return;

    setCalendars((prev) => {
      let changed = false;
      const newCalendars = prev.map(c => ({ ...c }));
      
      // Ensure categories exist
      newCalendars.forEach(cal => {
        if (!cal.category) {
          cal.category = 'my';
          changed = true;
        }
      });

      return changed ? newCalendars : prev;
    });
  }, [calendarsLoaded, setCalendars]);

  useEffect(() => {
    if (calendarsLoaded) {
      setCalendars((prev) => {
        const unwanted = ['holidays in united states', 'birthdays', 'other calendars'];
        const filtered = prev.filter(c => {
          const name = c.name.toLowerCase().trim();
          return !unwanted.includes(name) && c.category !== 'other';
        });
        
        if (filtered.length !== prev.length) {
          return filtered;
        }
        return prev;
      });
    }
  }, [calendarsLoaded, setCalendars]);

  useEffect(() => {
    if (calendars.length > 0 && selectedCalendars.length === 0) {
      // Default select the first 'my' calendar if nothing selected
      const defaultCal = calendars.find(c => c.category === 'my' || !c.category) || calendars[0];
      if (defaultCal) {
        setSelectedCalendars([defaultCal.id]);
      }
    }
  }, [calendars, selectedCalendars]);

  useEffect(() => {
    const tags = Array.from(new Set(events.filter((e) => e.tag).map((e) => e.tag as string)));
    setAllTags(tags);
    if (activeFilters.length === 0 && tags.length > 0) {
      setActiveFilters(tags);
    }
  }, [events, activeFilters.length]);

  useEffect(() => {
    if (shortcutsLoaded && !shortcutsSeen) {
      setShowShortcutsHint(true);
      // We will no longer automatically hide it after 3 seconds.
      // Instead we rely on the Dialog close action to setShortcutsSeen(true).
    }
  }, [shortcutsSeen, shortcutsLoaded]);

  useEffect(() => {
    notifiedEventsRef.current = new Set(
      Array.from(notifiedEventsRef.current).filter((id) => events.some((e) => e.id === id)),
    );
  }, [events]);

  useEffect(() => {
    if (!appSettings.notificationsEnabled) return;

    const interval = setInterval(() => {
      const now = new Date();
      // Expand events for today to check recurring instances
      const todayStart = startOfDay(now);
      const todayEnd = endOfDay(now);
      const todayEvents = getExpandedEvents(events, todayStart, todayEnd);

      todayEvents.forEach((event) => {
        if (!event.start_date) return;

        const start = new Date(event.start_date);
        // isToday check is redundant if we expanded for today, but safe to keep or rely on expansion
        if (!isSameDay(start, now)) return;

        const minutesBefore = event.reminderMinutesBefore ?? 5;
        const reminderTime = new Date(start.getTime() - minutesBefore * 60000);
        const diff = reminderTime.getTime() - now.getTime();

        // Check if within 1 minute window (positive diff means in future, small diff means soon)
        // actually diff = reminderTime - now.
        // If diff is between 0 and 60000, it means reminderTime is in the future by < 1 min?
        // No, we want to notify when now >= reminderTime.
        // Usually: notify when (now >= reminderTime) AND (now < reminderTime + window).
        // Let's say window is 1 minute.
        
        // Correct logic:
        // We want to trigger when 'now' reaches 'reminderTime'.
        // So (now.getTime() >= reminderTime.getTime())
        // AND we haven't notified yet.
        // To avoid notifying for old events, maybe check (now.getTime() - reminderTime.getTime() < 60000)
        
        const timeSinceReminder = now.getTime() - reminderTime.getTime();
        
        if (timeSinceReminder >= 0 && timeSinceReminder < 60000 && !notifiedEventsRef.current.has(event.id)) {
          playSound('reminder');
          notifiedEventsRef.current.add(event.id);
          
          // Optional: Browser notification
          if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
             new Notification('Event Reminder', { body: event.title || 'Untitled Event' });
          }
        }
      });
    }, 10000); // Check every 10 seconds for better precision

    return () => clearInterval(interval);
  }, [events, appSettings.notificationsEnabled, playSound]);

  const filteredEvents = useMemo(
    () =>
      events.filter((event) => {
        const calendarMatch =
          !event.calendar_id || selectedCalendars.length === 0 || selectedCalendars.includes(event.calendar_id);
        const tagMatch = !event.tag || activeFilters.length === 0 || activeFilters.includes(event.tag);
        return calendarMatch && tagMatch;
      }),
    [events, selectedCalendars, activeFilters],
  );

  // Calculate view range for expansion
  const viewRange = useMemo(() => {
    const start = view === 'month' ? startOfWeek(startOfMonth(currentDate)) :
                  view === 'week' ? startOfWeek(currentDate) :
                  startOfDay(currentDate);
    const end = view === 'month' ? endOfWeek(endOfMonth(currentDate)) :
                view === 'week' ? endOfWeek(currentDate) :
                endOfDay(currentDate);
    return { start, end };
  }, [view, currentDate]);

  // Expand events for the current view
  const expandedViewEvents = useMemo(() => {
    return getExpandedEvents(filteredEvents, viewRange.start, viewRange.end);
  }, [filteredEvents, viewRange]);

  const handleCalendarToggle = (calendarId: string) => {
    setSelectedCalendars([calendarId]);
  };

  const handleFilterChange = (tag: string) => {
    setActiveFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleNewEvent = () => {
    const now = new Date();
    setNewEventDate(now);
    setNewEventEndDate(null);
    setShowNewEventModal(true);
  };

  const handleSync = async () => {
    const googleCal = calendars.find(c => c.id === 'google-primary');
    if (!googleCal) {
        toast({ title: "No Google Calendar connected", variant: "destructive" });
        return;
    }

    try {
        const gapi = await getGapi();
        if (!gapi.client.getToken()) {
            await signInToGoogle(gapi, { prompt: 'none' });
        }
        
        if (!gapi.client.getToken()) {
             toast({ title: "Sync failed", description: "Please sign in again.", variant: "destructive" });
             return;
        }

        // 1. Push local pending events to Google (App -> Google)
        const pendingEvents = events.filter(e => 
            e.calendar_id === 'google-primary' && 
            /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e.id)
        );

        if (pendingEvents.length > 0) {
            toast({ title: "Syncing local events..." });
            let pushedCount = 0;
            
            // We need to update events state sequentially or in batch to avoid race conditions
            // Since createGoogleEvent is async, we'll collect the updates
            const idUpdates = new Map<string, string>();

            for (const event of pendingEvents) {
                try {
                    const googleEvent = await createGoogleEvent(gapi, event);
                    if (googleEvent && googleEvent.id) {
                        idUpdates.set(event.id, googleEvent.id);
                        pushedCount++;
                    }
                } catch (err) {
                    console.error(`Failed to push event ${event.title}:`, err);
                }
            }

            if (pushedCount > 0) {
                 setEvents(prev => prev.map(e => idUpdates.has(e.id) ? { ...e, id: idUpdates.get(e.id)! } : e));
            }
        }

        // 2. Fetch latest from Google (Google -> App)
        const eventsList = await listUpcomingEvents(gapi);
        const formattedEvents = eventsList.map((e: any) => ({
            id: e.id,
            title: e.summary,
            description: e.description,
            start_date: e.start.dateTime || e.start.date,
            end_date: e.end.dateTime || e.end.date,
            all_day: !e.start.dateTime,
            tag: 'Personal',
            calendar_id: 'google-primary',
        }));

        setEvents(prev => {
            // Remove existing Google events (except those we just pushed/are pushing, but fetching should include them if push worked)
            // Ideally, the fetch includes the events we just pushed.
            // So we can safely filter out ALL 'google-primary' events and replace with fetched list.
            // However, to be safe against race conditions (event pushed but not yet in list?), 
            // we should trust the fetched list as the source of truth for 'google-primary'.
            
            // But wait, what if we have a pending event that FAILED to push? It still has a UUID.
            // If we blindly replace all 'google-primary' events, we delete the failed-to-sync local event!
            // So we must KEEP events that are 'google-primary' AND have UUIDs (unless they are in the fetched list, which is unlikely for UUIDs).
            
            const nonGoogleEvents = prev.filter(e => e.calendar_id !== 'google-primary');
            const pendingGoogleEvents = prev.filter(e => 
                e.calendar_id === 'google-primary' && 
                /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e.id)
            );
            
            // Note: If we just successfully pushed a UUID event, 'prev' might still have the UUID if setEvents hasn't processed yet?
            // No, 'await' ensures sequential execution in this function scope, but setEvents is async state update.
            // Actually, we called setEvents above for idUpdates.
            // React state updates might be batched.
            // Safer approach: Calculate the new state based on current 'events' (which is closure stale?) 
            // OR use functional update.
            
            // Since we are inside the same closure, 'events' variable is from render start.
            // We need to be careful.
            // Let's rely on the functional update of the SECOND setEvents to merge everything.
            
            return prev.map(e => {
                 // First apply any ID updates from the push phase (re-applying logic effectively)
                 // This is tricky because we can't easily access the result of the first setEvents inside the second's functional update 
                 // without chaining or complex logic.
                 
                 // Simpler: Don't call setEvents twice. Do it all in one go.
                 return e;
            });
        });
        
        // Let's redo the state update logic to be single-pass
        setEvents(prev => {
             // 1. Apply ID updates
             let currentEvents = prev.map(e => idUpdates.has(e.id) ? { ...e, id: idUpdates.get(e.id)! } : e);
             
             // 2. Filter out Google events that are NOT pending (UUIDs)
             //    (i.e., keep non-google, and keep google-pending)
             const keptEvents = currentEvents.filter(e => 
                 e.calendar_id !== 'google-primary' || 
                 /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(e.id)
             );
             
             // 3. Append fetched events
             //    Check for duplicates just in case a pending event WAS fetched (shouldn't happen if IDs match, but here IDs differ)
             //    If we pushed a UUID event, it is now in 'keptEvents' with a NEW Google ID (thanks to step 1).
             //    The fetched list 'formattedEvents' ALSO contains this event with the Google ID.
             //    So we must filter duplicates by ID.
             
             const fetchedIds = new Set(formattedEvents.map((e: any) => e.id));
             const uniqueKept = keptEvents.filter(e => !fetchedIds.has(e.id));
             
             return [...uniqueKept, ...formattedEvents];
        });

        toast({ title: "Synced with Google Calendar" });

    } catch (error) {
        console.error("Sync error", error);
        toast({ title: "Sync failed", description: "Check console for details", variant: "destructive" });
    }
  };

  const handleNewCalendar = () => {
    setNewCalendarName('');
    setShowNewCalendarModal(true);
  };

  const handleCreateCalendar = () => {
    if (newCalendarName && newCalendarName.trim()) {
      const newCal: CalendarDefinition = {
        id: uuidv4(),
        name: newCalendarName.trim(),
        visible: true,
        category: 'my',
      };
      setCalendars((prev) => [...prev, newCal]);
      setSelectedCalendars([newCal.id]);
      setShowNewCalendarModal(false);
      setNewCalendarName('');
    }
  };

  const handleRenameCalendar = (id: string, newName: string) => {
    setCalendars((prev) =>
      prev.map((c) => (c.id === id ? { ...c, name: newName } : c))
    );
  };

  const handleDeleteCalendar = (id: string) => {
    if (id === 'google-primary') {
      handleGoogleDisconnect();
      return;
    }

    if (window.confirm('Are you sure you want to delete this calendar? All events in it will be lost.')) {
      setEvents((prev) => prev.filter((e) => e.calendar_id !== id));
      setCalendars((prev) => prev.filter((c) => c.id !== id));
      setSelectedCalendars((prev) => prev.filter((cid) => cid !== id));
    }
  };

  const handleDayClick = (day: Date) => {
    const start = setHours(day, 9);
    const end = setHours(day, 10);
    setNewEventDate(start);
    setNewEventEndDate(end);
    setShowNewEventModal(true);
  };

  const handleTimeSlotClick = (dateTime: Date) => {
    const end = new Date(dateTime.getTime() + 60 * 60 * 1000);
    setNewEventDate(dateTime);
    setNewEventEndDate(end);
    setShowNewEventModal(true);
  };

  const handleTimeRangeSelect = (start: Date, end: Date) => {
    setNewEventDate(start);
    setNewEventEndDate(end);
    setShowNewEventModal(true);
  };

  const handleEventClick = (event: CalendarEvent) => {
    // If it's a recurring instance (has composite ID), select the original event
    const originalId = event.id.split('_')[0];
    const originalEvent = events.find(e => e.id === originalId);
    setSelectedEvent(originalEvent || event);
  };

  const handleEventUpdate = async (updatedEvent: CalendarEvent) => {
    setEvents((prev) => prev.map((event) => (event.id === updatedEvent.id ? { ...event, ...updatedEvent } : event)));
    setSelectedEvent(updatedEvent);

    if (updatedEvent.calendar_id === 'google-primary') {
      // Check if it's a UUID (local) -> Create instead of Update
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(updatedEvent.id);
      
      try {
        const gapi = await getGapi();

        if (!gapi.client.getToken()) {
          toast({
            title: "Google Calendar Disconnected",
            description: "Please reconnect your Google Calendar account in settings.",
            variant: "destructive",
          });
          return;
        }
        
        if (isUuid) {
           // If it's a UUID, it means it was local and now moved to Google. We need to CREATE it on Google.
           const googleEvent = await createGoogleEvent(gapi, updatedEvent);
           if (googleEvent && googleEvent.id) {
               // Update local ID to match Google ID
               const newId = googleEvent.id;
               setEvents((prev) => prev.map((e) => (e.id === updatedEvent.id ? { ...e, id: newId } : e)));
               if (selectedEvent?.id === updatedEvent.id) {
                   setSelectedEvent({ ...updatedEvent, id: newId });
               }
           }
        } else {
           // Regular update for existing Google event
           await updateGoogleEvent(gapi, updatedEvent.id, updatedEvent);
        }
      } catch (error: any) {
        const msg = error?.result?.error?.message || error?.message || "Unknown error";
        
        if (msg.includes("missing required authentication credential") || error?.status === 401) {
             toast({
                variant: "destructive",
                title: "Authentication Required",
                description: "Your Google Calendar session has expired. Please reconnect via the 'Manage Calendars' button.",
            });
            console.warn("Google Sync skipped: Authentication required.");
            return;
        }

        if (error?.status === 404 || error?.status === 410 || error?.result?.error?.code === 404) {
          console.warn(`Google event ${updatedEvent.id} not found, cannot update.`);
          return;
        }

        toast({
            variant: "destructive",
            title: "Sync Failed",
            description: `Could not update Google Calendar: ${msg}`,
        });
        console.error('Failed to update Google Calendar event:', msg, error);
      }
    }
  };

  const handleEventDelete = async (eventId: string) => {
    const eventToDelete = events.find(e => e.id === eventId);
    setEvents((prev) => prev.filter((event) => event.id !== eventId));
    setSelectedEvent(null);

    if (eventToDelete?.calendar_id === 'google-primary') {
      // If the ID looks like a UUID, it's likely a local-only event that hasn't synced yet or failed to sync.
      // Google IDs usually don't look like UUIDs (they are base32/64 strings).
      // Skip the delete call to avoid 404s.
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(eventId);
      if (isUuid) {
        console.log('Skipping Google delete for local UUID event:', eventId);
        return;
      }

      try {
        const gapi = await getGapi();
        
        if (!gapi.client.getToken()) {
            console.warn("Google Sync skipped (delete): Authentication required.");
            return;
        }

        await deleteGoogleEvent(gapi, eventId);
        toast({
          title: "Event deleted",
          description: "Event removed from Google Calendar.",
        });
      } catch (error: any) {
        const msg = error?.result?.error?.message || error?.message || "";
        if (msg.includes("missing required authentication credential") || error?.status === 401) {
            console.warn("Google Sync skipped (delete): Authentication required.");
            return;
        }

        // Ignore 404 (Not Found) or 410 (Gone) as it means it's already deleted or never existed on Google
        const isNotFound = 
          error?.status === 404 || 
          error?.status === 410 || 
          error?.result?.error?.code === 404 ||
          (error?.body && error.body.includes('"code": 404'));

        if (isNotFound) {
          console.warn(`Google event ${eventId} not found, skipping delete.`);
          return;
        }
        
        // If error object is empty/opaque, just warn instead of error for delete operations
        if (Object.keys(error || {}).length === 0) {
            console.warn('Google delete failed with unknown error (likely harmless):', error);
            return;
        }

        console.error('Failed to delete Google Calendar event:', error);
        toast({
          title: "Delete Failed",
          description: "Failed to delete event from Google Calendar.",
          variant: "destructive"
        });
      }
    }
  };

  const handleEventDrop = async (eventId: string, newDate: Date) => {
    const event = events.find((e) => e.id === eventId);
    if (!event) return;

    const oldDate = new Date(event.start_date);
    const duration =
      event.end_date != null
        ? new Date(event.end_date).getTime() - oldDate.getTime()
        : 60 * 60 * 1000;

    const newStartDate = new Date(newDate);

    const updatedEvent: CalendarEvent = {
      ...event,
      start_date: newStartDate.toISOString(),
      end_date: new Date(newStartDate.getTime() + duration).toISOString(),
    };

    setEvents((prev) => prev.map((e) => (e.id === eventId ? updatedEvent : e)));

    if (updatedEvent.calendar_id === 'google-primary') {
      try {
        const gapi = await getGapi();
        
        if (!gapi.client.getToken()) {
            console.warn("Google Sync skipped (drop): Authentication required.");
            return;
        }

        await updateGoogleEvent(gapi, updatedEvent.id, updatedEvent);
      } catch (error: any) {
        const msg = error?.result?.error?.message || error?.message || "";
        if (msg.includes("missing required authentication credential") || error?.status === 401) {
            console.warn("Google Sync skipped (drop): Authentication required.");
            return;
        }

        if (error?.status === 404 || error?.status === 410 || error?.result?.error?.code === 404) {
          console.warn(`Google event ${updatedEvent.id} not found, cannot update (drop).`);
          return;
        }
        console.error('Failed to update Google Calendar event (drop):', error);
      }
    }
  };

  const handleEventDuplicate = (event: CalendarEvent) => {
    const newEvent: CalendarEvent = {
      ...event,
      id: uuidv4(),
      title: event.title ? `${event.title} (Copy)` : 'Untitled (Copy)',
    };
    // Note: Duplicates are not automatically pushed to Google unless they are "Created" as new.
    // If we want duplicates to sync, we should treat it as creation.
    // But currently duplicating just adds to local. If user edits and saves, it might not sync if we don't handle it.
    // For now, let's leave duplicate as local-first. If user changes calendar to Google, it won't sync automatically because 'create' isn't called.
    // However, we are not changing this function for now to avoid complexity.
    setEvents((prev) => [...prev, newEvent]);
  };

  const handleCreateEvent = async (eventData: Omit<CalendarEvent, 'id'>) => {
    const tempId = uuidv4();
    const newEvent: CalendarEvent = {
      id: tempId,
      ...eventData,
    };
    setEvents((prev) => [...prev, newEvent]);

    if (eventData.calendar_id === 'google-primary') {
      try {
        const gapi = await getGapi();

        if (!gapi.client.getToken()) {
            toast({
                title: "Google Calendar Disconnected",
                description: "Event created locally only. Reconnect account to sync.",
                variant: "destructive",
            });
            return;
        }

        const googleEvent = await createGoogleEvent(gapi, newEvent);
        if (googleEvent && googleEvent.id) {
            setEvents((prev) => prev.map(e => e.id === tempId ? { ...e, id: googleEvent.id } : e));
        }
      } catch (error: any) {
        const msg = error?.result?.error?.message || error?.message || "";
        if (msg.includes("missing required authentication credential") || error?.status === 401) {
            toast({
                title: "Authentication Required",
                description: "Event created locally. Reconnect Google Calendar to sync.",
                variant: "destructive",
            });
            return;
        }
        console.error('Failed to create Google Calendar event:', error);
      }
    }
  };

  const handleAddTag = (tagName: string) => {
    if (!allTags.includes(tagName)) {
      setAllTags((prev) => [...prev, tagName]);
      setActiveFilters((prev) => [...prev, tagName]);
    }
  };

  const handleRenameTag = (oldTag: string, newTag: string) => {
    setEvents((prev) =>
      prev.map((event) => (event.tag === oldTag ? { ...event, tag: newTag } : event)),
    );
    setAllTags((prev) => prev.map((t) => (t === oldTag ? newTag : t)));
    setActiveFilters((prev) => prev.map((t) => (t === oldTag ? newTag : t)));
  };

  const handleDeleteTag = (tag: string) => {
    setEvents((prev) =>
      prev.map((event) => (event.tag === tag ? { ...event, tag: '' } : event)),
    );
    setAllTags((prev) => prev.filter((t) => t !== tag));
    setActiveFilters((prev) => prev.filter((t) => t !== tag));
  };

  const handleEventsImported = (newEvents: CalendarEvent[]) => {
    setEvents((prev) => {
      // Create a map of existing events by ID
      const eventMap = new Map(prev.map(e => [e.id, e]));

      // Update or add new events
      newEvents.forEach(e => {
          eventMap.set(e.id, e);
      });

      return Array.from(eventMap.values());
    });
    setCalendars((prev) => {
      if (prev.some((c) => c.id === 'google-primary')) return prev;
      return [
        ...prev,
        { id: 'google-primary', name: 'Google Calendar', color: '#4285F4', visible: true, category: 'my' },
      ];
    });
    setSelectedCalendars(['google-primary']);
    setShowAccountModal(false);
  };

  const handleGoogleDisconnect = () => {
    // Remove Google Calendar events
    setEvents(prev => prev.filter(e => e.calendar_id !== 'google-primary'));
    
    // Remove Google Calendar from list
    setCalendars(prev => prev.filter(c => c.id !== 'google-primary'));
    
    // Deselect if selected
    setSelectedCalendars(prev => prev.filter(id => id !== 'google-primary'));
    
    toast({ title: "Google Calendar Disconnected" });
  };

  const navigateNext = () => {
    switch (view) {
      case 'day':
        setCurrentDate(addDays(currentDate, 1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, 1));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, 1));
        break;
    }
  };

  const navigatePrev = () => {
    switch (view) {
      case 'day':
        setCurrentDate(addDays(currentDate, -1));
        break;
      case 'week':
        setCurrentDate(addWeeks(currentDate, -1));
        break;
      case 'month':
        setCurrentDate(addMonths(currentDate, -1));
        break;
    }
  };

  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = (e: any) => {
    if (!e.touches || e.touches.length !== 1) return;
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  };

  const handleTouchEnd = (e: any) => {
    const start = touchStartRef.current;
    if (!start || !e.changedTouches || e.changedTouches.length === 0) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - start.x;
    const dy = touch.clientY - start.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    const threshold = 50;

    if (absDx > threshold && absDx > absDy) {
      if (dx < 0) {
        navigateNext();
      } else {
        navigatePrev();
      }
    }

    touchStartRef.current = null;
  };

  const renderView = () => {
    const viewProps = {
      currentDate,
      events: expandedViewEvents,
      onEventClick: handleEventClick,
      onEventDrop: handleEventDrop,
      onEventDelete: handleEventDelete,
      onEventUpdate: handleEventUpdate,
      onEventDuplicate: handleEventDuplicate,
      selectedEventId: selectedEvent ? selectedEvent.id : null,
    };

    switch (view) {
      case 'day':
        return (
          <DayView
            {...viewProps}
            onTimeSlotClick={handleTimeSlotClick}
            onTimeRangeSelect={handleTimeRangeSelect}
          />
        );
      case 'week':
        return (
          <WeekView
            {...viewProps}
            onTimeSlotClick={() => {}}
            onTimeSlotDoubleClick={handleTimeSlotClick}
          />
        );
      case 'month':
      default:
        return (
          <MonthView
            {...viewProps}
            onDayClick={(day) => setCurrentDate(day)}
            onDayDoubleClick={handleDayClick}
          />
        );
    }
  };

  return (
    <div className="h-full w-full flex flex-col bg-background">
      <KeyboardShortcuts
        onNewEvent={handleNewEvent}
        onNavigateNext={navigateNext}
        onNavigatePrev={navigatePrev}
        onToday={() => setCurrentDate(new Date())}
        onViewChange={setView}
        onClosePanel={() => setSelectedEvent(null)}
      />

      <div className="flex flex-1 min-h-0 bg-muted/40 font-sans antialiased">
        <Sidebar
          calendars={calendars}
          selectedCalendars={selectedCalendars}
          onCalendarToggle={handleCalendarToggle}
          onDateSelect={(day) => {
            setCurrentDate(day);
            setView('day');
          }}
          activeFilters={activeFilters}
          onFilterChange={handleFilterChange}
          onNewEvent={handleNewEvent}
          onNewCalendar={handleNewCalendar}
          allTags={allTags}
          onAddTag={handleAddTag}
          onRenameTag={handleRenameTag}
          onDeleteTag={handleDeleteTag}
          onAddAccount={() => setShowAccountModal(true)}
          onRenameCalendar={handleRenameCalendar}
          onDeleteCalendar={handleDeleteCalendar}
          onSync={handleSync}
        />

          <div className="flex-1 flex flex-col overflow-hidden">
          <CalendarHeader
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
            view={view}
            setView={setView}
          />

          <div
            className="flex-1 relative"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 flex flex-col"
              >
                {renderView()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        <AnimatePresence>
          {selectedEvent && (
            <EventPanel
              event={selectedEvent}
              onClose={() => setSelectedEvent(null)}
              onUpdate={handleEventUpdate}
              onDelete={handleEventDelete}
              calendars={calendars}
              allTags={allTags}
            />
          )}
        </AnimatePresence>
      </div>

      <NewEventModal
        isOpen={showNewEventModal}
        onClose={() => setShowNewEventModal(false)}
        onSave={handleCreateEvent}
        initialDate={newEventDate}
        initialEndDate={newEventEndDate}
        calendars={calendars}
        allTags={allTags}
        defaultCalendarId={selectedCalendars.length === 1 ? selectedCalendars[0] : undefined}
      />

      <CalendarAccountModal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        onEventsImported={handleEventsImported}
        onDisconnect={handleGoogleDisconnect}
        existingCalendars={calendars}
      />

      <Dialog open={showNewCalendarModal} onOpenChange={setShowNewCalendarModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Calendar</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Input
                id="calendar-name"
                placeholder="Calendar name"
                value={newCalendarName}
                onChange={(e) => setNewCalendarName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleCreateCalendar();
                  }
                }}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewCalendarModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCalendar} disabled={!newCalendarName.trim()}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Shortcuts Dialog */}
      <Dialog open={showShortcutsHint} onOpenChange={(open) => {
        setShowShortcutsHint(open);
        if (!open) setShortcutsSeen(true);
      }}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Keyboard Shortcuts</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4 text-sm">
             <div className="grid grid-cols-2 gap-2">
               <div className="flex justify-between items-center"><span className="text-muted-foreground">New Event</span> <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">N</kbd></div>
               <div className="flex justify-between items-center"><span className="text-muted-foreground">Today</span> <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">T</kbd></div>
               <div className="flex justify-between items-center"><span className="text-muted-foreground">Day View</span> <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">1</kbd></div>
               <div className="flex justify-between items-center"><span className="text-muted-foreground">Week View</span> <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">2</kbd></div>
               <div className="flex justify-between items-center"><span className="text-muted-foreground">Month View</span> <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">3</kbd></div>
               <div className="flex justify-between items-center"><span className="text-muted-foreground">Navigate</span> <span className="flex gap-1"><kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">←</kbd><kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">→</kbd></span></div>
               <div className="flex justify-between items-center"><span className="text-muted-foreground">Close Panel</span> <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">Esc</kbd></div>
             </div>
          </div>
          <DialogFooter>
             <Button onClick={() => { setShowShortcutsHint(false); setShortcutsSeen(true); }}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
