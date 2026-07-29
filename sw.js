/* Pi Game Service Worker — offline-first cache.
 *
 * CANONICAL FLEET SHAPE. The structure here — version line, owned-prefix
 * cleanup, scope-guarded fetch, skip-waiting message — is meant to be
 * identical across every arcade app; only APP_VERSION, CACHE_PREFIX and the
 * precache list differ. Fix a bug here and it has to be carried everywhere.
 */

// Written by fleet CI on every deploy (fleet-ci.yml, "Bump patch version").
// DO NOT EDIT BY HAND — a hand-maintained constant drifts, and when it drifts
// the origin serves a fix that no returning player ever executes. That is not
// hypothetical: it stranded a sibling game's players for two releases.
//
// Tracks the app version now, so it moves on every deploy. The old private
// v7 counter is abandoned deliberately: only string inequality matters for
// cache identity, so any change to this line invalidates correctly.
const APP_VERSION = '1.0.1';

// Every cache this game has ever owned starts with this prefix — including the
// old hand-numbered 'pi-game-v7' names, so the switch to a version-derived
// name still collects them. Cleanup is filtered to it; see activate for why
// that is not optional.
const CACHE_PREFIX = 'pi-game-';
const CACHE_NAME = `${CACHE_PREFIX}v${APP_VERSION}`;

// WARNING: This list is manually maintained. When adding new static assets
// (JS files, CSS files, images, sounds, etc.), update this list too or
// offline mode will silently break for those assets.
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
  // Deliberately NOT skipWaiting(). The new worker installs and waits; the
  // launcher spots it and offers the player an explicit "update ready" reload,
  // then sends the message below once they accept. Activating unannounced
  // would swap the cache under a running game, so anything fetched lazily
  // after the swap would come from a different build than the code asking.
});

self.addEventListener('message', event => {
  // Sent by the launcher's update control (menu → "Check for Updates", or the
  // automatic prompt) once the player accepts the reload.
  if (event.data && event.data.type === 'arcade:sw.skipWaiting') self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          // ONLY our own caches. caches.keys() is ORIGIN-scoped and the whole
          // fleet shares paulgibeault.github.io, so the bare `k !== CACHE_NAME`
          // filter this used to have deleted the launcher's cache and every
          // sibling game's on each activation — every app silently destroying
          // every other app's offline support, on every deploy.
          .filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME)
          .map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  // Only requests within this game's own scope. Without this guard the
  // handler below caches EVERY request the page makes under our cache —
  // including launcher assets like /arcade-sdk.js, which then get served
  // stale from here indefinitely, and cross-origin responses we have no
  // business storing.
  if (!event.request.url.startsWith(self.registration.scope)) return;

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
