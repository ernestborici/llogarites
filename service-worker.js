const VERSION = "v1";
const STATIC_CACHE = `llogarites-static-${VERSION}`;
const RUNTIME_CACHE = `llogarites-runtime-${VERSION}`;

const CORE_ASSETS = [
  "./",
  "./index.html",
  "./Kredia.html",
  "./Paga.html",
  "./Produktet.html",
  "./Direktiva.html",
  "./Formulare.html",
  "./AboutApp.html",
  "./Install.html",
  "./Sugjerime.html",
  "./Kontakt.html",
  "./Privacy.html",
  "./404.html",
  "./base.css",
  "./shell.css",
  "./theme.css",
  "./manifest.json",
  "./install-android.svg",
  "./install-ios.svg",
  "./install-pc.svg",
  "./icon.png",
  "./logo-full.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) => !k.includes(VERSION))
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response && (response.status === 200 || response.type === "opaque")) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || (await fetchPromise);
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  const isSameOrigin = url.origin === self.location.origin;
  const isFont =
    url.origin === "https://fonts.googleapis.com" ||
    url.origin === "https://fonts.gstatic.com";
  const isCdn =
    url.origin === "https://unpkg.com" ||
    url.origin === "https://cdn.tailwindcss.com";

  if (isSameOrigin) {
    if (request.mode === "navigate") {
      event.respondWith(
        staleWhileRevalidate(request, STATIC_CACHE).then(
          (resp) => resp || caches.match("./index.html")
        )
      );
      return;
    }

    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }

  if (isFont || isCdn) {
    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
  }
});
