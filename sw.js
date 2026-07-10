// Pi Game — Service Worker
// Caches all assets for offline play after first load.

const CACHE_NAME = 'pi-game-v3';
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  './visuals/tracer.js?v=2',
  './visuals/spirograph.js?v=2',
  './visuals/gallery.js?v=4',
  './visuals/orbital.js?v=2',
  './visuals/manager.js?v=2',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.mode === 'navigate') {
    // Network-first for the HTML shell to prevent stale content
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }
  // Cache-first for static assets; cache successful fetches too, so assets
  // missing from ASSETS (or added later) still work offline next time.
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        }
        return response;
      });
    })
  );
});
