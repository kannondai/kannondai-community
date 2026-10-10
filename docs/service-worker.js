self.addEventListener('install', event => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const legacyCaches = ['kannondai-community-v1', 'kannondai-community-v2'];
    await Promise.all(legacyCaches.map(cacheName => caches.delete(cacheName)));
    await self.registration.unregister();
  })());
});
