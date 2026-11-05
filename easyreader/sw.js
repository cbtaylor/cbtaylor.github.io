self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open('audiobook-pwa-v1').then((cache) => {
            return cache.addAll([
                './index.html',
                './style.css',
                './app.js',
                './manifest.json',
                './icon-192.png',
                './icon-512.png'
            ]);
        })
    );
});

self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            return cachedResponse || fetch(e.request);
        })
    );
});
