
// This is the service worker file that acts as a local server.

// Listen for the 'install' event. This is the first step in the service worker lifecycle.
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
  // Immediately activate the new service worker
  self.skipWaiting();
});

// Listen for the 'activate' event. This is fired when the service worker becomes active.
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activated');
  // Take control of all open clients (pages) right away.
  event.waitUntil(self.clients.claim());
});

// Listen for the 'fetch' event. This is the core of our server functionality.
// It fires every time the application tries to fetch a resource (e.g., an API call, an image).
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // We only want to intercept requests to our specific, local API path.
  // In this case, we're watching for any requests that go to '/api/status'.
  if (url.pathname === '/api/status') {
    console.log('Service Worker: Intercepted API request to /api/status');

    // This is where we act like a server. We construct a response.
    // Instead of letting the request go to the internet, we handle it ourselves.
    const responseBody = {
      status: 'ok',
      message: 'Response from your local, in-browser server!',
      timestamp: new Date().toISOString(),
      serverAgent: 'ServiceWorker/1.0',
    };

    // We create a new Response object.
    // The first argument is the body of the response (which must be a string).
    // The second argument is an options object where we can set headers.
    const response = new Response(JSON.stringify(responseBody), {
      headers: { 'Content-Type': 'application/json' },
      status: 200, // HTTP status code for "OK"
      statusText: 'OK',
    });

    // We use respondWith() to send our custom response back to the application.
    event.respondWith(response);
  }

  // For any other request that doesn't match our API path, we don't do anything.
  // The browser will handle it normally (i.e., fetch it from the network).
});
