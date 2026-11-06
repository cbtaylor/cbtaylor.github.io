// Service worker: makes the app open offline and keeps updates consistent.
//
// Strategy: NETWORK FIRST, falling back to the saved copy.
//  - Online: every app file is fetched fresh (revalidated with the server, so GitHub Pages'
//    10-minute HTTP cache can't hand us an old index.html next to a new app.js) and the saved
//    copy is refreshed. An update shows up the FIRST time the app is opened after you push.
//  - Offline, or the network takes longer than NETWORK_TIMEOUT_MS: the saved copy is used.
//
// (The previous version served saved copies first and refreshed each file separately in the
//  background, which could leave the phone running new JavaScript with an old HTML page.)
//
// Audiobooks are NOT stored here; they live in the app's private file storage (OPFS).
// Bump CACHE_VERSION to discard every saved copy.

const CACHE_VERSION = 'v3';
const CACHE = 'easyreader-' + CACHE_VERSION;
const NETWORK_TIMEOUT_MS = 4000;

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
    event.waitUntil((async () => {
        const cache = await caches.open(CACHE);
        // cache: 'reload' bypasses the HTTP cache, so the new version is saved as one consistent set
        await Promise.all(SHELL.map(async (url) => {
            const res = await fetch(url, { cache: 'reload' });
            if (!res.ok) throw new Error('Could not cache ' + url);
            await cache.put(url, res);
        }));
        await self.skipWaiting();
    })());
});

self.addEventListener('activate', (event) => {
    event.waitUntil((async () => {
        const keys = await caches.keys();
        await Promise.all(keys.filter((k) => k.startsWith('easyreader-') && k !== CACHE).map((k) => caches.delete(k)));
        await self.clients.claim();
    })());
});

async function fetchFresh(req) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), NETWORK_TIMEOUT_MS);
    try {
        // fetch by URL: a navigation Request can't be re-created with extra options
        return await fetch(req.url, { cache: 'no-cache', signal: controller.signal });
    } finally {
        clearTimeout(timer);
    }
}

self.addEventListener('fetch', (event) => {
    const req = event.request;
    if (req.method !== 'GET') return;
    if (new URL(req.url).origin !== self.location.origin) return;

    event.respondWith((async () => {
        const cache = await caches.open(CACHE);
        try {
            const res = await fetchFresh(req);
            if (res && res.ok) {
                await cache.put(req, res.clone());
                return res;
            }
        } catch (e) { /* offline or too slow: use the saved copy */ }

        const cached = await cache.match(req, { ignoreSearch: true });
        if (cached) return cached;
        if (req.mode === 'navigate') {
            const shell = await cache.match('./index.html');
            if (shell) return shell;
        }
        return new Response('Offline', { status: 503, statusText: 'Offline' });
    })());
});
