self.addEventListener("install", e => {
  self.skipWaiting();
});

self.addEventListener("fetch", e => {
  // Mode réseau d'abord
  e.respondWith(fetch(e.request).catch(() => new Response("Offline")));
});
