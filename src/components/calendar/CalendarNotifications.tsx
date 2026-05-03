'use client';

import { useEffect, useRef } from 'react';
import { useApp } from '@/components/layout/app-provider';
import { useNotifications } from '@/hooks/use-notifications';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { isSameMinute, parseISO, addMinutes } from 'date-fns';

/**
 * CalendarNotifications
 *
 * Dual-mode notification engine:
 *
 * 1. IN-APP (app is open)  — checks every 10 s, fires toast + OS notification
 *    via the existing useNotifications hook.
 *
 * 2. BACKGROUND (app is closed) — on every events change, schedules reminders
 *    in the Service Worker's IndexedDB store. The SW fires them at the right
 *    time regardless of whether the tab is open.
 */
export default function CalendarNotifications() {
  const { events, appSettings } = useApp();
  const { showNotification, requestPermission } = useNotifications();
  const { scheduleNotification, cancelNotification } = usePushNotifications();

  // Track which events we've already handled this session (in-app)
  const notifiedEvents = useRef<Set<string>>(new Set());
  // Track which event IDs have SW reminders scheduled
  const scheduledSW = useRef<Set<string>>(new Set());

  // ─── IN-APP: poll every 10 s ──────────────────────────────────────────────
  useEffect(() => {
    if (!appSettings.notificationsEnabled) return;

    const checkEvents = () => {
      const now = new Date();

      events.forEach((event) => {
        if (!event.start_date) return;
        const startDate = parseISO(event.start_date);

        if (isSameMinute(now, startDate) && !notifiedEvents.current.has(event.id)) {
          showNotification(`Event Starting: ${event.title || 'Untitled'}`, {
            body: `Starting at ${startDate.toLocaleTimeString()}`,
            sound: 'reminder',
          });
          notifiedEvents.current.add(event.id);
        }
      });
    };

    requestPermission();
    const interval = setInterval(checkEvents, 10_000);
    checkEvents();
    return () => clearInterval(interval);
  }, [events, appSettings.notificationsEnabled, requestPermission, showNotification]);

  // ─── BACKGROUND: sync SW reminders whenever events change ─────────────────
  useEffect(() => {
    if (!appSettings.notificationsEnabled) return;
    const NotificationApi = typeof window !== 'undefined' ? (window as any).Notification : undefined;
    if (!NotificationApi || NotificationApi.permission !== 'granted') return;
    if (!('serviceWorker' in navigator)) return;

    const now = Date.now();

    events.forEach((event) => {
      if (!event.start_date) return;
      const startDate = parseISO(event.start_date);
      const fireAt = startDate.getTime();

      // Skip past events and already-scheduled ones
      if (fireAt <= now) return;
      if (scheduledSW.current.has(event.id)) return;

      // Schedule 1 min before start as a reminder
      const reminderAt = addMinutes(startDate, -1).getTime();
      if (reminderAt > now) {
        scheduleNotification({
          id: `cal-reminder-${event.id}`,
          title: `⏰ Upcoming: ${event.title || 'Event'}`,
          body: `Starting in 1 minute at ${startDate.toLocaleTimeString()}`,
          url: '/calendar',
          fireAt: reminderAt,
        });
      }

      // Schedule at exact start time
      scheduleNotification({
        id: `cal-start-${event.id}`,
        title: `🗓 Event Starting: ${event.title || 'Untitled'}`,
        body: `Starting now at ${startDate.toLocaleTimeString()}`,
        url: '/calendar',
        fireAt,
      });

      scheduledSW.current.add(event.id);
    });

    // Cancel SW reminders for events that were deleted
    const currentIds = new Set(events.map((e) => e.id));
    scheduledSW.current.forEach((id) => {
      if (!currentIds.has(id)) {
        cancelNotification(`cal-reminder-${id}`);
        cancelNotification(`cal-start-${id}`);
        scheduledSW.current.delete(id);
      }
    });
  }, [events, appSettings.notificationsEnabled, scheduleNotification, cancelNotification]);

  return null;
}
