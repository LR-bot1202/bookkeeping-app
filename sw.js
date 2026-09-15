const CACHE_NAME = "bookkeeping-v12";
const APP_VERSION = "1.3.2";
const INDEX_URL = `./index.html?v=${APP_VERSION}`;
const APP_SHELL = [INDEX_URL, `./styles.css?v=${APP_VERSION}`, `./app.js?v=${APP_VERSION}`, `./manifest.webmanifest?v=${APP_VERSION}`, "./assets/app-icon.svg", "./assets/app-icon-192.png", "./assets/app-icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      cache.addAll(APP_SHELL.map((url) => new Request(url, { cache: "reload" })))
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
    const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    await Promise.all(windows.map((client) => client.navigate(client.url).catch(() => null)));
  })());
});

self.addEventListener("fetch", (event) => {
  const requestUrl = new URL(event.request.url);
  if (event.request.method !== "GET" || requestUrl.origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request, event.request.mode === "navigate" ? { cache: "no-store" } : undefined)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match(INDEX_URL)))
  );
});
