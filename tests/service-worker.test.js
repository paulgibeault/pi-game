/**
 * service-worker.test.js — the sw.js invariants that have each already cost
 * the fleet a production incident or come one step from it.
 *
 * 1. Cleanup is scoped to our own caches. `caches.keys()` is ORIGIN-scoped and
 *    the whole fleet shares paulgibeault.github.io, so the obvious
 *    `k !== CACHE_NAME` filter deletes the launcher's cache and every sibling
 *    game's on every activation. This worker shipped that filter, and was the
 *    last one on the origin still doing it.
 *
 * 2. The cache identity keeps the shape fleet CI rewrites, and derives from
 *    it. If that line stops matching CI's sed, the rewrite silently stops
 *    firing and every returning player is stranded on a stale cache.
 *
 * 3. install() does not skipWaiting. The launcher's update flow depends on the
 *    new worker WAITING so the player can be offered a reload; a worker that
 *    activates unannounced swaps the cache under a running game.
 *
 * 4. fetch() only answers for our own scope. Without that guard this worker
 *    caches launcher assets (arcade-sdk.js) under our cache and serves them
 *    stale to the whole app indefinitely.
 *
 * The worker is evaluated in a vm with a fake ServiceWorkerGlobalScope rather
 * than mocked, so the assertions run the real handler bodies.
 */

import assert from 'node:assert';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SW_SRC = readFileSync(join(ROOT, 'sw.js'), 'utf8');
const PKG = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')); // realistic cache keys
const SCOPE = 'https://paulgibeault.github.io/pi-game/';

/** Evaluate sw.js against a fake global scope and return the handles. */
function loadWorker({ cacheKeys = [] } = {}) {
  const deleted = [];
  const handlers = {};
  const calls = { skipWaiting: 0, claim: 0, addAll: null };

  const caches = {
    keys: async () => cacheKeys.slice(),
    delete: async (k) => { deleted.push(k); return true; },
    open: async () => ({
      addAll: async (list) => { calls.addAll = list; },
      put: async () => {},
    }),
    match: async () => undefined,
  };

  const self = {
    addEventListener: (type, fn) => { handlers[type] = fn; },
    skipWaiting: () => { calls.skipWaiting++; },
    clients: { claim: () => { calls.claim++; } },
    registration: { scope: SCOPE },
    location: { hostname: 'paulgibeault.github.io' },
    caches,
  };

  // The fetch handler falls through to the network on a cache miss, so the
  // scope test would otherwise reach a real fetch that does not exist here.
  const fetchStub = async () => ({ ok: false, clone: () => ({}) });
  const ctx = vm.createContext({ self, caches, console, fetch: fetchStub });
  vm.runInContext(SW_SRC, ctx);

  const fire = async (type, data) => {
    assert.ok(handlers[type], `sw.js registered no '${type}' handler`);
    let waited = null;
    await handlers[type]({ ...data, waitUntil: (p) => { waited = p; } });
    if (waited) await waited;
  };

  /** Drive the fetch handler; returns true if the worker took the request. */
  const fetchHandled = (url, { method = 'GET', mode = 'no-cors' } = {}) => {
    let responded = false;
    handlers.fetch({
      request: { url, method, mode, clone: () => ({}) },
      respondWith: () => { responded = true; },
    });
    return responded;
  };

  return { fire, fetchHandled, deleted, calls, ctx };
}

test('activate deletes only this game\'s caches, never a sibling\'s', async () => {
  const w = loadWorker({
    cacheKeys: [
      'paul-arcade-v67',           // launcher — must survive
      'hecknsic-v1.2.28',          // sibling — must survive
      'sowduku-shell-v10',         // sibling — must survive
      'pi-game-v7',                // ours, legacy hand-numbered — must go
      `pi-game-v${PKG.version}`,   // ours, current — must stay
    ],
  });

  await w.fire('activate');

  assert.deepStrictEqual(
    w.deleted, ['pi-game-v7'],
    'activate must delete exactly our own stale caches — deleting anything ' +
    'else destroys another app\'s offline support, and keeping our own stale ' +
    'one is what serves players a fix they never execute');
  assert.strictEqual(w.calls.claim, 1, 'activate should claim clients');
});

test('the cache identity is in the shape CI rewrites, and derives from it', () => {
  // Deliberately a SHAPE check, not `APP_VERSION === PKG.version`. CI writes
  // both in one commit so they match on main, but any PR open across a deploy
  // merges a newer package.json onto an older sw.js — equality would fail on
  // branch staleness, which says nothing about whether the app is correct.
  const declared = /^const APP_VERSION = '([^']*)';$/m.exec(SW_SRC);
  assert.ok(
    declared,
    "sw.js must declare `const APP_VERSION = '…';` at the start of a line, " +
    'single-quoted — that exact shape is what fleet-ci.yml rewrites on deploy');
  assert.match(
    declared[1], /^\d+\.\d+\.\d+$/,
    `APP_VERSION should be a bare semver (got '${declared[1]}')`);

  assert.match(
    SW_SRC, /^const CACHE_NAME = `\$\{CACHE_PREFIX\}v\$\{APP_VERSION\}`;$/m,
    'CACHE_NAME must interpolate CACHE_PREFIX and APP_VERSION, not hardcode ' +
    'a literal — otherwise bumping the version leaves the cache identity ' +
    'unchanged and no update ever fires');
});

test('install precaches and does NOT skipWaiting', async () => {
  const w = loadWorker();
  await w.fire('install');

  assert.ok(w.calls.addAll && w.calls.addAll.length > 0, 'install should precache assets');
  assert.ok(
    w.calls.addAll.includes('./index.html'),
    'the precache list should cover the app shell');
  assert.strictEqual(
    w.calls.skipWaiting, 0,
    'install must not skipWaiting — the launcher\'s update prompt depends on ' +
    'the new worker waiting, and activating unannounced swaps the cache under ' +
    'a running game');
});

test('the launcher can activate a waiting worker on demand', async () => {
  const w = loadWorker();
  await w.fire('message', { data: { type: 'arcade:sw.skipWaiting' } });
  assert.strictEqual(w.calls.skipWaiting, 1, 'the update control must be able to activate the waiting worker');

  const ignored = loadWorker();
  await ignored.fire('message', { data: { type: 'something-else' } });
  assert.strictEqual(ignored.calls.skipWaiting, 0, 'unrelated messages must not activate the worker');
});

test('fetch answers only for our own scope', () => {
  const w = loadWorker();

  assert.strictEqual(
    w.fetchHandled(SCOPE + 'visuals/tracer.js'), true,
    'our own assets must be served from the cache');

  assert.strictEqual(
    w.fetchHandled('https://paulgibeault.github.io/arcade-sdk.js'), false,
    'a launcher asset must fall through — caching it here serves the whole ' +
    'app a stale SDK from this game\'s cache indefinitely');
  assert.strictEqual(
    w.fetchHandled('https://paulgibeault.github.io/hecknsic/js/main.js'), false,
    'a sibling game\'s asset must fall through');
  assert.strictEqual(
    w.fetchHandled('https://example.com/thing.js'), false,
    'cross-origin requests must fall through');
  assert.strictEqual(
    w.fetchHandled(SCOPE + 'api', { method: 'POST' }), false,
    'non-GET requests must fall through');
});
