// Bump CACHE_VERSION whenever you change any cached file so users get the update.
const CACHE_VERSION = 'dotw-v1';
const PRECACHE = [
  './',
  'index.html',
  'style.css',
  'script.js',
  'manifest.webmanifest',
  'images/dotw.ico',
  'images/icon-192.png',
  'images/icon-512.png',
  'images/icon-maskable-512.png',
  'images/apple-touch-icon.png',
  'images/favicon-32.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(PRECACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// Network first (so edits show up when online), falling back to the cache offline.
// Also caches the Google Fonts CSS/files the page requests, so the font works offline.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const sameOrigin = url.origin === self.location.origin;
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!sameOrigin && !fonts) return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res && (res.ok || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req, { ignoreSearch: true }).then((hit) =>
          hit || (req.mode === 'navigate' ? caches.match('index.html') : Response.error())
        )
      )
  );
});
