// Nexaris Module - Service Worker
// Handles background push notifications and scheduled reminder delivery.

const CACHE_NAME = 'nexaris-v1';

// ─── Lifecycle ────────────────────────────────────────────────────────────────

self.addEventListener('install', (event) => {
  console.log('[SW] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activated');
  event.waitUntil(self.clients.claim());
});

// ─── Web Push (fired by the server when the app is closed) ────────────────────

self.addEventListener('push', (event) => {
  console.log('[SW] Push received');

  let data = { title: 'Nexaris Module', body: 'You have a new update.', url: '/dashboard' };

  if (event.data) {
    try {
      data = { ...data, ...event.data.json() };
    } catch {
      data.body = event.data.text();
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.png',
      badge: '/icon.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/dashboard' },
      actions: [
        { action: 'open', title: 'Open App' },
        { action: 'dismiss', title: 'Dismiss' },
      ],
    })
  );
});

// ─── Scheduled reminders (fired from the app via postMessage) ─────────────────
//
// The app sends: { type: 'SCHEDULE_NOTIFICATION', id, title, body, url, fireAt }
// fireAt is a Unix timestamp (ms). The SW stores them in IndexedDB and checks
// every minute via a setTimeout chain.

const DB_NAME  = 'nexaris-sw-db';
const DB_STORE = 'scheduled-notifications';
const DB_VER   = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VER);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(DB_STORE)) {
        db.createObjectStore(DB_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

async function saveReminder(reminder) {
  const db    = await openDB();
  const tx    = db.transaction(DB_STORE, 'readwrite');
  const store = tx.objectStore(DB_STORE);
  store.put(reminder);
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror    = reject;
  });
}

async function deleteReminder(id) {
  const db    = await openDB();
  const tx    = db.transaction(DB_STORE, 'readwrite');
  const store = tx.objectStore(DB_STORE);
  store.delete(id);
  return new Promise((resolve, reject) => {
    tx.oncomplete = resolve;
    tx.onerror    = reject;
  });
}

async function getAllReminders() {
  const db    = await openDB();
  const tx    = db.transaction(DB_STORE, 'readonly');
  const store = tx.objectStore(DB_STORE);
  const req   = store.getAll();
  return new Promise((resolve, reject) => {
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror   = (e) => reject(e.target.error);
  });
}

async function checkReminders() {
  const now       = Date.now();
  const reminders = await getAllReminders();

  for (const reminder of reminders) {
    if (reminder.fireAt <= now) {
      await self.registration.showNotification(reminder.title, {
        body:    reminder.body || '',
        icon:    '/icon.png',
        badge:   '/icon.png',
        vibrate: [100, 50, 100],
        data:    { url: reminder.url || '/dashboard' },
        actions: [
          { action: 'open',    title: 'Open App' },
          { action: 'dismiss', title: 'Dismiss'  },
        ],
      });
      await deleteReminder(reminder.id);
    }
  }

  // Keep checking every 30 s while the SW is alive
  setTimeout(checkReminders, 30_000);
}

// Start the check loop when the SW activates
self.addEventListener('activate', () => {
  checkReminders();
});

// ─── Messages from the page ───────────────────────────────────────────────────

self.addEventListener('message', async (event) => {
  const { type, ...payload } = event.data || {};

  if (type === 'SCHEDULE_NOTIFICATION') {
    // payload: { id, title, body, url, fireAt }
    await saveReminder(payload);
  }

  if (type === 'CANCEL_NOTIFICATION') {
    // payload: { id }
    await deleteReminder(payload.id);
  }

  if (type === 'SHOW_NOW') {
    // Immediate notification while the page is open but backgrounded
    const { title, body, url } = payload;
    await self.registration.showNotification(title, {
      body:    body || '',
      icon:    '/icon.png',
      badge:   '/icon.png',
      vibrate: [100, 50, 100],
      data:    { url: url || '/dashboard' },
    });
  }
});

// ─── Notification click ───────────────────────────────────────────────────────

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') return;

  const targetUrl = event.notification.data?.url || '/dashboard';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});

// ─── Fetch (pass-through — no caching needed for a data-heavy app) ────────────

self.addEventListener('fetch', (event) => {
  // Intercept /api/status for a quick health check
  const url = new URL(event.request.url);
  if (url.pathname === '/api/status') {
    event.respondWith(
      new Response(JSON.stringify({ status: 'ok', sw: true, timestamp: new Date().toISOString() }), {
        headers: { 'Content-Type': 'application/json' },
      })
    );
  }
});
