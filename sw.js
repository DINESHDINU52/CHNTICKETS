// Service Worker for CHN IT Support
const CACHE_NAME = 'chn-it-support-v4.0.1';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/styles.css',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

// Install event - cache initial resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip chrome extensions and non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Skip range requests entirely
  if (request.headers.has('range')) {
    return;
  }

  event.respondWith(
    (async () => {
      try {
        // Try network first for dynamic content
        const response = await fetch(request);
        
        // Update cache in background (don't await)
        if (response && response.ok) {
          updateCache(request, response.clone()).catch(() => {});
        }
        
        return response;
      } catch (error) {
        // Network failed, try cache
        const cachedResponse = await caches.match(request);
        
        if (cachedResponse) {
          console.log('Serving from cache:', request.url);
          return cachedResponse;
        }
        
        // If it's a navigation request and we have index.html cached, return that
        if (request.mode === 'navigate') {
          const indexCache = await caches.match('/index.html');
          if (indexCache) {
            return indexCache;
          }
        }
        
        // No cache available, throw error
        throw error;
      }
    })()
  );
});

// Update cache function with proper filtering
async function updateCache(request, response) {
  // Skip non-cacheable responses immediately
  if (!response || response.status !== 200 || request.method !== 'GET') {
    return;
  }

  // Check if it's a media request by multiple methods
  const url = request.url.toLowerCase();
  const isMediaRequest = 
    request.headers.has('range') ||
    request.destination === 'audio' ||
    request.destination === 'video' ||
    /\.(mp3|wav|ogg|mp4|webm|m4a|flac|aac|avi|mov|wmv|mkv)(\?|#|$)/i.test(url);

  if (isMediaRequest) {
    console.debug('Skipping media file cache:', request.url);
    return;
  }

  // Skip large files
  const contentLength = response.headers.get('content-length');
  if (contentLength && parseInt(contentLength) > 5 * 1024 * 1024) { // 5MB limit
    console.debug('Skipping large file cache:', request.url);
    return;
  }

  try {
    const responseToCache = response.clone();
    
    // Final safety check - verify it's not a partial response
    if (responseToCache.status === 200 && !responseToCache.headers.get('content-range')) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, responseToCache);
      console.debug('Cached:', request.url);
    }
  } catch (e) {
    // Specifically ignore partial response errors
    if (e.message.includes('206') || e.message.includes('Partial') || e.message.includes('partial')) {
      console.debug('Skipped caching partial response:', request.url);
    } else if (e.name === 'QuotaExceededError') {
      console.warn('Cache quota exceeded, clearing old cache...');
      // Clear cache and retry
      await caches.delete(CACHE_NAME);
      await caches.open(CACHE_NAME);
    } else {
      console.warn('Cache put failed:', request.url, e.message);
    }
  }
}

// Message event - for cache control from main app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(CACHE_NAME).then(() => {
        console.log('Cache cleared');
        return caches.open(CACHE_NAME);
      })
    );
  }
});

// Handle background sync (if needed)
self.addEventListener('sync', (event) => {
  console.log('Background sync:', event.tag);
  if (event.tag === 'sync-data') {
    event.waitUntil(syncData());
  }
});

async function syncData() {
  // Implement your sync logic here
  console.log('Syncing data...');
}

// Push notification handler (if needed)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification('CHN IT Support', options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});

console.log('Service Worker loaded - CHN IT Support v4.0.1');