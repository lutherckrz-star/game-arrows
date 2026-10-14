/**
 * Arrow Escape — Elemental
 * Service Worker for PWA offline support
 */

// Naikkan versi setiap kali ada perubahan agar user langsung dapat update (bug-fix 2026-10)
const CACHE_NAME = 'arrow-escape-v2';
const STATIC_ASSETS = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './js/config.js',
    './js/i18n.js',
    './js/arrow.js',
    './js/element.js',
    './js/board.js',
    './js/level.js',
    './js/boss.js',
    './js/crystal.js',
    './js/achievement.js',
    './js/menu.js',
    './js/settings.js',
    './js/audio.js',
    './js/ads.js',
    './js/analytics.js',
    './js/security.js',
    './js/particles.js',
    './js/ui.js',
    './js/game.js'
];

// Install - cache static assets
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

// Activate - clean old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => {
                return Promise.all(
                    cacheNames
                        .filter((name) => name !== CACHE_NAME)
                        .map((name) => caches.delete(name))
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
    // Skip non-GET requests
    if (event.request.method !== 'GET') return;

    // Skip external requests (CrazyGames SDK)
    if (!event.request.url.startsWith(self.location.origin)) return;

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then((networkResponse) => {
                        // Don't cache opaque responses
                        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
                            return networkResponse;
                        }

                        // Clone and cache
                        const responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                            .then((cache) => cache.put(event.request, responseToCache));

                        return networkResponse;
                    })
                    .catch(() => {
                        // Offline fallback for HTML
                        if (event.request.headers.get('accept').includes('text/html')) {
                            return caches.match('./index.html');
                        }
                    });
            })
    );
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') {
        self.skipWaiting();
    }
});

// Background sync for analytics (if supported)
self.addEventListener('sync', (event) => {
    if (event.tag === 'analytics-sync') {
        event.waitUntil(syncAnalytics());
    }
});

async function syncAnalytics() {
    // Send queued analytics when online
    const clients = await self.clients.matchAll();
    clients.forEach((client) => {
        client.postMessage({ type: 'SYNC_ANALYTICS' });
    });
}