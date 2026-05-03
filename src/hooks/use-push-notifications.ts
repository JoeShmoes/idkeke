'use client';

import { useCallback, useEffect, useRef } from 'react';

// ─── Helper: convert base64url VAPID key to Uint8Array ───────────────────────
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64  = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw     = window.atob(base64);
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ScheduleOptions {
  /** Unique ID so the reminder can be cancelled later */
  id: string;
  title: string;
  body?: string;
  /** URL to open when the user clicks the notification */
  url?: string;
  /** When to fire — JS Date or ISO string */
  fireAt: Date | string;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function usePushNotifications(userId?: string) {
  const swRegRef = useRef<ServiceWorkerRegistration | null>(null);

  // Store/retrieve the SW registration
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then((reg) => {
      swRegRef.current = reg;
    });
  }, []);

  /** Request permission and create a Web Push subscription */
  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[Push] Not supported');
      return false;
    }

    // Ask for permission — iOS Safari doesn't have Notification, so guard with typeof
    const NotificationApi = typeof window !== 'undefined' ? (window as any).Notification : undefined;
    if (!NotificationApi) return false;
    const permission = await NotificationApi.requestPermission();
    if (permission !== 'granted') return false;

    try {
      const reg = await navigator.serviceWorker.ready;
      swRegRef.current = reg;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || 'BLTI402rqhvwwnuOdVH56fxtPpTjFGi31x6Z8b49NCPZOV7gPd4ex825wtkTQB7XuuFvLN9BMMbHDYZt8-lnres';
      if (!vapidKey) {
        console.error('[Push] NEXT_PUBLIC_VAPID_PUBLIC_KEY not set');
        return false;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });

      // Persist to server (fire-and-forget)
      if (userId) {
        fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription, userId }),
        }).catch(console.error);
      }

      return true;
    } catch (err) {
      console.error('[Push] Subscribe error:', err);
      return false;
    }
  }, [userId]);

  /** Check whether the user already has an active push subscription */
  const isSubscribed = useCallback(async (): Promise<boolean> => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return false;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    return sub !== null;
  }, []);

  /**
   * Schedule a reminder via the Service Worker's IndexedDB store.
   * Works even if the tab is closed BEFORE the fireAt time (as long as the
   * browser keeps the SW alive — Chrome/Edge/Firefox all do this).
   */
  const scheduleNotification = useCallback(async (opts: ScheduleOptions): Promise<void> => {
    const NotificationApi = typeof window !== 'undefined' ? (window as any).Notification : undefined;
    if (!NotificationApi || NotificationApi.permission !== 'granted') return;

    const reg = swRegRef.current || (await navigator.serviceWorker.ready);
    swRegRef.current = reg;

    const fireAt = opts.fireAt instanceof Date
      ? opts.fireAt.getTime()
      : new Date(opts.fireAt).getTime();

    // If the time is in the past, skip
    if (fireAt <= Date.now()) return;

    reg.active?.postMessage({
      type:   'SCHEDULE_NOTIFICATION',
      id:     opts.id,
      title:  opts.title,
      body:   opts.body || '',
      url:    opts.url  || '/dashboard',
      fireAt,
    });
  }, []);

  /** Cancel a previously scheduled reminder by its ID */
  const cancelNotification = useCallback(async (id: string): Promise<void> => {
    const reg = swRegRef.current || (await navigator.serviceWorker.ready);
    swRegRef.current = reg;
    reg.active?.postMessage({ type: 'CANCEL_NOTIFICATION', id });
  }, []);

  /**
   * Show an immediate OS notification via the SW (works while the app is
   * open in the background on mobile).
   */
  const showNow = useCallback(async (title: string, body?: string, url?: string): Promise<void> => {
    const NotificationApi = typeof window !== 'undefined' ? (window as any).Notification : undefined;
    if (!NotificationApi || NotificationApi.permission !== 'granted') return;
    const reg = swRegRef.current || (await navigator.serviceWorker.ready);
    swRegRef.current = reg;
    reg.active?.postMessage({ type: 'SHOW_NOW', title, body, url });
  }, []);

  return { subscribe, isSubscribed, scheduleNotification, cancelNotification, showNow };
}
