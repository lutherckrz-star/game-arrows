/**
 * Arrow Escape — Elemental
 * Service Worker for PWA offline support
 */

// Naikkan versi setiap kali ada perubahan agar user langsung dapat update
const CACHE_NAME = 'arrow-escape-v4';
const STATIC_ASSETS = [
    './', './index.html', './style.css', './manifest.json',
    './js/config.js', './js/i18n.js', './js/arrow.js', './js/element.js',
    './js/board.js', './js/level.js', './js/boss.js', './js/crystal.js',
    './js/achievement.js', './js/menu.js', './js/settings.js', './js/audio.js',
    './js/ads.js', './js/analytics.js', './js/security.js', './js/particles.js',
    './js/ui.js', './js/game.js'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(STATIC_ASSETS))
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys()
            .then((cacheNames) => Promise.all(
                cacheNames.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    if (!event.request.url.startsWith(self.location.origin)) return;
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then((networkResponse) => {
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') return networkResponse;
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
                return networkResponse;
            }).catch(() => {
                if (event.request.headers.get('accept').includes('text/html')) return caches.match('./index.html');
            });
        })
    );
});

self.addEventListener('message', (event) => {
    if (event.data === 'skipWaiting') self.skipWaiting();
});
