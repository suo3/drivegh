import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { clientsClaim } from 'workbox-core';
import { registerRoute } from 'workbox-routing';
import { CacheFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

// Import OneSignal SDK Worker
// Note: self.importScripts is required as OneSignalSDKWorker.js is not an ES module
importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDKWorker.js');

// Cleanup outdated caches
cleanupOutdatedCaches();

// Precache resources
// @ts-ignore
precacheAndRoute(self.__WB_MANIFEST);

// Skip waiting and claim clients
self.skipWaiting();
clientsClaim();

// Runtime caching for Google Fonts
registerRoute(
    /^https:\/\/fonts\.googleapis\.com\/.*/i,
    new CacheFirst({
        cacheName: 'google-fonts-cache',
        plugins: [
            new ExpirationPlugin({
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
            }),
            new CacheableResponsePlugin({
                statuses: [0, 200]
            })
        ]
    })
);
