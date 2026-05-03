let timers = new Map();

self.addEventListener('push', function(event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/icon.png',
      badge: '/icon.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        url: data.url || '/'
      }
    };
    event.waitUntil(
      self.registration.showNotification(data.title || 'Nexaris Module', options)
    );
  }
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(
    clients.openWindow(url)
  );
});

self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data) return;

  if (data.type === 'SCHEDULE_NOTIFICATION') {
    const { id, title, body, url, fireAt } = data;
    const delay = fireAt - Date.now();
    
    if (delay > 0) {
      if (timers.has(id)) clearTimeout(timers.get(id));
      
      const timer = setTimeout(() => {
        self.registration.showNotification(title, {
          body,
          icon: '/icon.png',
          data: { url }
        });
        timers.delete(id);
      }, delay);
      
      timers.set(id, timer);
    }
  } else if (data.type === 'CANCEL_NOTIFICATION') {
    if (timers.has(data.id)) {
      clearTimeout(timers.get(data.id));
      timers.delete(data.id);
    }
  } else if (data.type === 'SHOW_NOW') {
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon.png',
      data: { url: data.url }
    });
  }
});
