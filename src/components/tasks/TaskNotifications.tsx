'use client';

import { useEffect, useRef } from 'react';
import { useApp } from '@/components/layout/app-provider';
import { useNotifications } from '@/hooks/use-notifications';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { isSameMinute, parseISO, addMinutes, isBefore, startOfToday, isSameDay } from 'date-fns';

/**
 * TaskNotifications
 *
 * Dual-mode notification engine for Tasks:
 *
 * 1. IN-APP (app is open) — checks every 10 s, fires toast + OS notification
 *    via the existing useNotifications hook for overdue or due-today tasks.
 *
 * 2. BACKGROUND (app is closed) — on every tasks change, schedules reminders
 *    in the Service Worker's IndexedDB store.
 */
export default function TaskNotifications() {
  const { tasks, appSettings, userProfile } = useApp();
  const { showNotification, requestPermission } = useNotifications();
  const { scheduleNotification, cancelNotification, subscribe } = usePushNotifications(userProfile?.id);

  // Track which tasks we've already handled this session (in-app)
  const notifiedTasks = useRef<Set<string>>(new Set());
  // Track which task IDs have SW reminders scheduled
  const scheduledSW = useRef<Set<string>>(new Set());

  // ─── IN-APP: poll every 10 s ──────────────────────────────────────────────
  useEffect(() => {
    if (!appSettings.notificationsEnabled) return;

    const checkTasks = () => {
      const now = new Date();
      const today = startOfToday();

      tasks.forEach((task) => {
        if (task.completed || !task.notifications || !task.dueDate) return;
        
        const dueDate = parseISO(task.dueDate);
        const isDueToday = isSameDay(dueDate, today);

        // Check if due today (at or after 12 AM) and not yet notified
        if (isDueToday && !notifiedTasks.current.has(`${task.id}-due`)) {
          showNotification(`Task Due Today: ${task.name}`, {
            body: `Deadline reached: ${task.description || 'No additional details'}`,
            sound: 'reminder',
          });
          notifiedTasks.current.add(`${task.id}-due`);
        }
        
        // Overdue Check: Only notify at the "end of the day" (e.g., 8 PM / 20:00)
        const currentHour = now.getHours();
        if (isBefore(dueDate, today) && currentHour >= 20 && !notifiedTasks.current.has(`${task.id}-overdue`)) {
           showNotification(`Overdue Task: ${task.name}`, {
            body: `This task was due on ${dueDate.toLocaleDateString()}`,
            sound: 'overdue',
          });
          notifiedTasks.current.add(`${task.id}-overdue`);
        }
      });
    };

    requestPermission();
    const interval = setInterval(checkTasks, 10_000);
    checkTasks();
    return () => clearInterval(interval);
  }, [tasks, appSettings.notificationsEnabled, requestPermission, showNotification]);

  // Ensure push subscription is active if enabled
  useEffect(() => {
    if (appSettings.notificationsEnabled && userProfile?.id) {
      subscribe().catch(console.error);
    }
  }, [appSettings.notificationsEnabled, userProfile?.id, subscribe]);

  // ─── BACKGROUND: sync SW reminders whenever tasks change ─────────────────
  useEffect(() => {
    if (!appSettings.notificationsEnabled) return;
    const NotificationApi = typeof window !== 'undefined' ? (window as any).Notification : undefined;
    if (!NotificationApi || NotificationApi.permission !== 'granted') return;
    if (!('serviceWorker' in navigator)) return;

    const now = Date.now();

    tasks.forEach((task) => {
      if (task.completed || !task.notifications || !task.dueDate) {
        // Cancel any existing ones if task was completed or notifications disabled
        if (scheduledSW.current.has(task.id)) {
            cancelNotification(`task-reminder-${task.id}`);
            cancelNotification(`task-overdue-${task.id}`);
            scheduledSW.current.delete(task.id);
        }
        return;
      }

      const dueDate = parseISO(task.dueDate);
      // Set to 12 AM (start of day) unless a specific time was already in the ISO string
      // parseISO on a YYYY-MM-DD string often defaults to 12 AM local or UTC depending on env.
      // We'll ensure it's the start of the day.
      dueDate.setHours(0, 0, 0, 0);
      const fireAt = dueDate.getTime();

      // Skip past tasks (handled by in-app overdue check)
      if (fireAt <= now) return;
      
      // If already scheduled, skip
      if (scheduledSW.current.has(task.id)) return;

      // Schedule at exact start time (12 AM)
      scheduleNotification({
        id: `task-overdue-${task.id}`,
        title: `‼️ Task Due: ${task.name}`,
        body: `The deadline for "${task.name}" has been reached.`,
        url: '/tasks',
        fireAt,
      });

      scheduledSW.current.add(task.id);
    });

    // Cancel SW reminders for tasks that were deleted
    const currentIds = new Set(tasks.map((t) => t.id));
    scheduledSW.current.forEach((id) => {
      if (!currentIds.has(id)) {
        cancelNotification(`task-overdue-${id}`);
        scheduledSW.current.delete(id);
      }
    });
  }, [tasks, appSettings.notificationsEnabled, scheduleNotification, cancelNotification]);

  return null;
}
