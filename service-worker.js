const CACHE_NAME = "law-school-practice-lab-starter-v1";
const RUNTIME_ASSETS = [
  "index.html",
  "styles.css",
  "app.js",
  "config.js",
  "rule-bank.js",
  "questions.js",
  "manifest.webmanifest",
  "offline.html",
  "assets/icons/practice-lab-icon-192.png",
  "assets/icons/practice-lab-icon-512.png",
  "assets/icons/practice-lab-maskable-512.png",
  "assets/icons/practice-lab-apple-touch-180.png"
];

function scopedUrl(path) {
  return new URL(path, self.registration.scope).toString();
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(RUNTIME_ASSETS.map(scopedUrl)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys
        .filter((key) => key.startsWith("law-school-practice-lab-") && key !== CACHE_NAME)
        .map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(scopedUrl("index.html"), copy));
          return response;
        })
        .catch(() => caches.match(scopedUrl("index.html")).then((response) => response || caches.match(scopedUrl("offline.html"))))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
