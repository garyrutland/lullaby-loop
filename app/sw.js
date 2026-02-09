// Luma Loop Service Worker
const CACHE_NAME = 'luma-loop-v1';
const URLS_TO_CACHE = [
    '.',
    'index.html',
    'manifest.json',
    'icon.png'
];

// Install: cache essential files
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(URLS_TO_CACHE).catch(() => {
                // Silently fail if resources aren't available yet
                return Promise.resolve();
            });
        })
    );
    self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Fetch: serve from cache, fallback to network
self.addEventListener('fetch', event => {
    // Only handle GET requests
    if (event.request.method !== 'GET') return;

    event.respondWith(
        caches.match(event.request).then(response => {
            if (response) return response;

            return fetch(event.request).then(response => {
                // Don't cache non-successful responses
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // Clone and cache successful responses
                const responseToCache = response.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }).catch(() => {
                // Network failed, serve what we have in cache
                return caches.match(event.request);
            });
        })
    );
});
