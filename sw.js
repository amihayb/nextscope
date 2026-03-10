/**
 * Glimpse Service Worker
 * Strategy:
 *   - App shell (local assets) : cache-first, populate on install
 *   - Google Fonts              : network-first, cache on success
 *   - Analytics / Tag Manager   : network-only, never cache
 *   - All other same-origin     : cache-first with background refresh
 *
 * Bump CACHE_VERSION whenever the app shell changes so stale caches are evicted.
 */

const CACHE_VERSION = 'v1';
const CACHE_NAME = `glimpse-${CACHE_VERSION}`;

const APP_SHELL = [
  './',
  './index.html',
  './StyleSheet.css',
  './manifest.json',
  /* vendor */
  './vendor/plotly-latest.min.js',
  './vendor/sweetalert2@11.js',
  './vendor/font-awesome.min.css',
  /* font-awesome webfonts */
  './fonts/fontawesome-webfont.woff2',
  './fonts/fontawesome-webfont.woff',
  './fonts/fontawesome-webfont.ttf',
  /* app scripts */
  './js/config.js',
  './js/dataTransforms.js',
  './js/dataParser.js',
  './js/plot.js',
  './js/ui.js',
  './js/fileIO.js',
  './js/app.js',
  './js/contextMenu.js',
  './js/theme.js',
  /* images */
  './images/glimpse.ico',
  './images/logo-title.svg',
  './images/logo-title.png'
];

/* ── Install: pre-cache the entire app shell ─────────────────────────────── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

/* ── Activate: delete caches from previous versions ─────────────────────── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch ───────────────────────────────────────────────────────────────── */
self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  /* Analytics / Tag Manager — always network, never cache */
  if (
    url.hostname === 'www.googletagmanager.com' ||
    url.hostname === 'www.google-analytics.com'
  ) return;

  /* Google Fonts — network-first so the cache stays fresh; serve cache offline */
  if (
    url.hostname === 'fonts.googleapis.com' ||
    url.hostname === 'fonts.gstatic.com'
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        fetch(request)
          .then(response => {
            if (response.ok) cache.put(request, response.clone());
            return response;
          })
          .catch(() => cache.match(request))
      )
    );
    return;
  }

  /* Everything else (same-origin) — cache-first, background refresh */
  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(request).then(cached => {
        const networkFetch = fetch(request).then(response => {
          if (response.ok) cache.put(request, response.clone());
          return response;
        });
        return cached || networkFetch;
      })
    )
  );
});
