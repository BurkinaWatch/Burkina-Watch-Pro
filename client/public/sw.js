const CACHE_NAME = 'burkina-watch-v1';
const STATIC_CACHE = 'burkina-watch-static-v1';
const DATA_CACHE = 'burkina-watch-data-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html'
];

async function networkFirstStrategy(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(DATA_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache for:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response(JSON.stringify({ 
      error: 'Hors ligne', 
      message: 'Vous êtes hors ligne. Les données affichées peuvent être obsolètes.',
      offline: true 
    }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function cacheFirstStrategy(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok && request.url.startsWith(self.location.origin)) {
      const cache = await caches.open(STATIC_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed for static asset:', request.url);
    if (request.destination === 'document') {
      return caches.match('/');
    }
    return new Response('Hors ligne', { status: 503 });
  }
}

self.addEventListener('fetch', function(event) {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') {
    return;
  }

  if (!url.origin.includes(self.location.origin)) {
    return;
  }

  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request));
  }
});

self.addEventListener('message', function(event) {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_API_DATA') {
    cacheApiData(event.data.urls);
  }
});

async function cacheApiData(urls) {
  const cache = await caches.open(DATA_CACHE);
  for (const url of urls) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        await cache.put(url, response);
        console.log('[SW] Cached:', url);
      }
    } catch (error) {
      console.log('[SW] Failed to cache:', url);
    }
  }
}

self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();
  
  const options = {
    body: data.body || 'Nouvelle alerte',
    icon: '/logo-burkinawatch.png',
    badge: '/logo-burkinawatch.png',
    vibrate: [200, 100, 200, 100, 300],
    data: {
      url: data.url || '/',
      signalementId: data.signalementId,
    },
    actions: [
      { action: 'view', title: 'Voir' },
      { action: 'close', title: 'Fermer' }
    ],
    tag: data.tag || 'burkina-watch-notification',
    renotify: true,
    silent: false,
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Burkina Watch', options).then(function() {
      return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
        clientList.forEach(function(client) {
          client.postMessage({ type: 'PUSH_RECEIVED', payload: data });
        });
      });
    })
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'close') return;

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

self.addEventListener('install', function(event) {
  self.skipWaiting();
});

self.addEventListener('activate', function(event) {
  event.waitUntil(clients.claim());
});
