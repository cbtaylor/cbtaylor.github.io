// Service worker: makes the app open instantly and work offline.
//
// Strategy: "stale-while-revalidate". Files are served from the cache immediately
// and refreshed from the network in the background, so an update you publish shows
// up the NEXT time the app is opened. (The old version of this file used a
// cache-first strategy with no versioning, so updates would never have arrived.)
//
// Audiobooks are NOT stored here; they live in the app's private file storage (OPFS).
//
// Bump CACHE_VERSION when you want to force old caches to be discarded.

const CACHE_VERSION = 'v2';
const CACHE = 'easyreader-' + CACHE_VERSION;

const SHELL = [
    './',
    './index.html',
    './style.css',
    './app.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    './icon-maskable-512.png'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE)
            .then((cache) => cache.addAll(SHELL))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((keys) => Promise.all(
                keys.filter((k) => k.startsWith('easyreader-') && k !== CACHE).map((k) => caches.delete(k))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    const url = new URL(req.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith((async () => {
        const cache = await caches.open(CACHE);
        const cached = await cache.match(req, { ignoreSearch: true });

        const network = fetch(req).then((res) => {
            if (res && res.ok) cache.put(req, res.clone());
            return res;
        }).catch(() => null);

        if (cached) {
            event.waitUntil(network);          // refresh in the background
            return cached;
        }
        const res = await network;
        if (res) return res;
        // Offline and not cached: for page loads, fall back to the app itself.
        if (req.mode === 'navigate') {
            const shell = await cache.match('./index.html');
            if (shell) return shell;
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
    })());
});
