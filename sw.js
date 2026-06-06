const CACHE_NAME = 'awesome-iptv-cache-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './images.png',
  'https://cdn.jsdelivr.net/npm/hls.js@latest',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css'
];

// Install Service Worker and cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.error('[Service Worker] Failed to cache files during install:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate event (clean up old caches)
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cache);
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event handler
self.addEventListener('fetch', (event) => {
  const requestUrl = new URL(event.request.url);

  // We should NOT cache live M3U playlists or live TS video segments (dynamic streams)
  if (
    requestUrl.pathname.endsWith('.m3u') ||
    requestUrl.pathname.endsWith('.m3u8') ||
    requestUrl.pathname.endsWith('.ts') ||
    requestUrl.hostname.includes('firebase') || // Do not cache Firebase real-time database requests
    event.request.method !== 'GET'
  ) {
    return; // Let the browser fetch directly from network
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch a fresh version in the background to update cache (stale-while-revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse);
              });
            }
          })
          .catch(() => {
            // Ignore background fetch errors
          });
        return cachedResponse;
      }

      return fetch(event.request)
        .then((response) => {
          // Check if we should cache this response (static content from CDN/fonts)
          if (
            response &&
            response.status === 200 &&
            (requestUrl.origin === location.origin ||
              requestUrl.hostname.includes('fonts.googleapis.com') ||
              requestUrl.hostname.includes('fonts.gstatic.com') ||
              requestUrl.hostname.includes('cdnjs.cloudflare.com'))
          ) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // If offline and request is for page, return cached index
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html');
          }
        });
    })
  );
});
