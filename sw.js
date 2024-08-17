var cacheAll = true;
var CACHE_NAME = 'webapk-cache';
var urlsToCache = [
    './index.html',
    './mainSW.js',
    './sw.js',
    './notify.mp3',
    './notify2.mp3',
    './notify3.mp3',
    './notify4.mp3',
    './omm.mp3',
    './recover.mp3',
    './bells.mp3',
];

var urlsNotToCache = [
    // Add URLs that should not be cached here
];

// Install Event
self.addEventListener('install', function(event) {
    console.log("[SW] install event:", event);
    // Perform install steps
    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            console.log('[SW] Opened cache:', cache);
            return cache.addAll(urlsToCache);
        })
    );
});

// Fetch Event
self.addEventListener('fetch', function(event) {
    console.log("[SW] fetch event:", event);
    event.respondWith(
        caches.match(event.request).then(function(response) {
            if (response) {
                return response; // Cache hit - return response
            }

            // Check if the request is in urlsNotToCache
            if (!cacheAll || urlsNotToCache.includes(event.request.url)) {
                return fetch(event.request); // Fetch from network
            }

            // Cache new requests directly
            return fetch(event.request).then(function(response) {
                // Check if we received a valid response
                if (!response || response.status !== 200 || response.type !== 'basic') {
                    return response;
                }

                // IMPORTANT: Clone the response. A response is a stream
                // and because we want the browser to consume the response
                // as well as the cache consuming the response, we need
                // to clone it so we have two streams.
                var responseToCache = response.clone();

                caches.open(CACHE_NAME).then(function(cache) {
                    cache.put(event.request, responseToCache);
                });

                return response;
            }).catch(function(error) {
                console.error('[SW] Fetch failed:', error);
                // Optionally return a fallback response here
                return new Response('Network error occurred', {
                    status: 408,
                    statusText: 'Network Error'
                });
            });
        })
    );
});

// Activation Event
self.addEventListener('activate', function(event) {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames.map(function(cacheName) {
                    if (!cacheWhitelist.includes(cacheName)) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
