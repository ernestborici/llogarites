const APP_VERSION = "3.2.0";
const STATIC_CACHE = `llogarites-static-${APP_VERSION}`;
const RUNTIME_CACHE = `llogarites-runtime-${APP_VERSION}`;
const LEGACY_CACHE_PREFIXES = ["llogarites-static-", "llogarites-runtime-"];
const APP_SHELL = "./index.html";
const NAVIGATION_FALLBACKS = {
  "/": APP_SHELL,
  "/index.html": APP_SHELL,
  "/kredi": APP_SHELL,
  "/Kredia": APP_SHELL,
  "/kredia": "./kredia.html",
  "/kredia.html": "./kredia.html",
  "/Paga": "./paga.html",
  "/paga": "./paga.html",
  "/paga.html": "./paga.html",
  "/About": "./about.html",
  "/about": "./about.html",
  "/about.html": "./about.html",
  "/AboutInstall": "./AboutInstall.html",
  "/about-install": "./AboutInstall.html",
  "/FAQ": "./faq.html",
  "/faq": "./faq.html",
  "/faq.html": "./faq.html",
  "/Privacy": "./privacy.html",
  "/privacy": "./privacy.html",
  "/privacy.html": "./privacy.html",
  "/Terms": "./Terms.html",
  "/terms": "./Terms.html",
  "/Terms.html": "./Terms.html"
};

const CORE_ASSETS = [
  APP_SHELL,
  "./kredia.html",
  "./paga.html",
  "./about.html",
  "./AboutInstall.html",
  "./faq.html",
  "./privacy.html",
  "./Terms.html",
  "./404.html",
  "./src/design-system/base.css",
  "./src/design-system/theme.css?v=3.2.0",
  "./src/design-system/pages/about.css?v=3.2.0",
  "./src/design-system/pages/about-install.css?v=3.2.0",
  "./src/design-system/pages/faq.css?v=3.2.0",
  "./src/design-system/pages/loan.css?v=3.2.0",
  "./src/design-system/pages/not-found.css?v=3.2.0",
  "./src/design-system/pages/privacy.css?v=3.2.0",
  "./src/design-system/pages/salary.css?v=3.2.0",
  "./src/design-system/pages/terms.css?v=3.2.0",
  "./src/app/version.js?v=3.2.0",
  "./src/app/analytics-config.js?v=3.2.0",
  "./src/app/analytics.js?v=3.2.0",
  "./manifest.json",
  "./robots.txt",
  "./assets/brand/favicon.ico",
  "./assets/brand/favicon.svg",
  "./assets/brand/favicon-16.png",
  "./assets/brand/favicon-32.png",
  "./assets/brand/favicon-48.png",
  "./assets/brand/apple-touch-icon.png",
  "./assets/brand/logo-header.png",
  "./assets/brand/logo-mark.png",
  "./assets/brand/og-image.png",
  "./assets/brand/pwa-icon-192.png",
  "./assets/brand/pwa-icon-512.png",
  "./assets/brand/pwa-maskable-512.png"
];

const MODULE_ASSETS = [
  "./src/shared/lucide-lite.js",
  "./src/shared/direct-page-analytics.js",
  "./src/shared/mobile-gestures.js",
  "./src/app/routes.js?v=3.2.0",
  "./src/design-system/shell/mobile-top-shell.css?v=3.2.0",
  "./src/design-system/shell/top-header.css?v=3.2.0",
  "./src/shell/mobile-top-shell.js?v=3.2.0",
  "./src/shared/theme-manager.js",
  "./src/features/faq/faq-access.js?v=3.2.0",
  "./src/features/loan/loan-engine.js?v=3.2.0",
  "./src/features/loan/loan-dates.js?v=3.2.0",
  "./src/features/loan/loan-controller.js?v=3.2.0",
  "./src/features/loan/loan-options.js?v=3.2.0",
  "./src/features/loan/loan-share.js?v=3.2.0",
  "./src/features/loan/loan-page.js?v=3.2.0",
  "./src/features/not-found/not-found-page.js?v=3.2.0",
  "./src/features/salary/salary-formatters.js?v=3.2.0",
  "./src/features/salary/salary-engine.js?v=3.2.0",
  "./src/features/salary/salary-analytics.js?v=3.2.0",
  "./src/features/salary/salary-ui.js?v=3.2.0",
  "./src/features/salary/salary-page.js?v=3.2.0"
];

const IMAGE_ASSETS = [
  "./assets/images/ios-step-1.webp",
  "./assets/images/ios-step-2.webp",
  "./assets/images/ios-step-3.webp"
];

const PRECACHE_ASSETS = [...CORE_ASSETS, ...MODULE_ASSETS, ...IMAGE_ASSETS];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then(async (cache) => {
      await Promise.all(
        PRECACHE_ASSETS.map(async (asset) => {
          try {
            const response = await fetch(asset, { cache: "reload" });
            if (isCacheableResponse(response)) {
              await cache.put(asset, response.clone());
            }
          } catch (_) {
            // Ignore single-asset cache errors to keep SW install stable.
          }
        })
      );
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((k) =>
              LEGACY_CACHE_PREFIXES.some((prefix) => k.startsWith(prefix)) ||
              (k.startsWith("llogarites-") && k !== STATIC_CACHE && k !== RUNTIME_CACHE)
            )
            .map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function isCacheableResponse(response, { allowOpaque = false } = {}) {
  if (!response || response.redirected || response.type === "opaqueredirect") {
    return false;
  }
  if (response.status === 200) return true;
  return allowOpaque && response.type === "opaque";
}

function normalizedCacheKeys(request) {
  const url = new URL(request.url);
  const keys = [];

  keys.push(request.url);

  if (url.pathname.startsWith("/s/src/") || url.pathname.startsWith("/s/assets/")) {
    const normalized = new URL(url);
    normalized.pathname = url.pathname.slice(2);
    keys.push(normalized.toString());
    if (normalized.searchParams.has("v")) {
      normalized.searchParams.delete("v");
      keys.push(normalized.toString());
    }
  }

  if (url.pathname === "/s/manifest.json") {
    const normalized = new URL(url);
    normalized.pathname = "/manifest.json";
    normalized.search = "";
    keys.push(normalized.toString());
  }

  if (url.searchParams.has("v")) {
    url.searchParams.delete("v");
    keys.push(url.toString());
  }

  if (url.search) {
    url.search = "";
    keys.push(url.toString());
  }

  return [...new Set(keys)];
}

async function matchCachedNavigation(cache, request) {
  return matchCachedRequest(cache, request);
}

async function matchCachedRequest(cache, request) {
  for (const key of normalizedCacheKeys(request)) {
    const cached = await cache.match(key);
    if (cached && !cached.redirected && cached.type !== "opaqueredirect") {
      return cached;
    }
  }
  return null;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const staticCache = cacheName === STATIC_CACHE ? cache : await caches.open(STATIC_CACHE);
  const cached = await matchCachedRequest(cache, request) || await matchCachedRequest(staticCache, request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (isCacheableResponse(response, { allowOpaque: true })) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || (await fetchPromise);
}

async function networkFirstNavigation(request) {
  const cache = await caches.open(STATIC_CACHE);
  const requestUrl = new URL(request.url);
  const fetchTarget = new URL(request.url);
  if (fetchTarget.searchParams.has("v")) {
    fetchTarget.searchParams.delete("v");
  }

  try {
    const response = await fetch(fetchTarget.toString(), { cache: "no-cache" });
    if (isCacheableResponse(response)) {
      await cache.put(fetchTarget.toString(), response.clone());
      return response;
    }
  } catch (_) {
    // Fall back to cache below when offline or network fails.
  }

  const cached = await matchCachedNavigation(cache, request);
  if (cached) return cached;

  const url = new URL(request.url);
  if (url.pathname.match(/^\/s\/[A-Za-z0-9]+\/?$/)) {
    const sharedLoanFallback = await cache.match(APP_SHELL);
    if (sharedLoanFallback && !sharedLoanFallback.redirected && sharedLoanFallback.type !== "opaqueredirect") {
      return sharedLoanFallback;
    }
  }

  const fallbackAsset = NAVIGATION_FALLBACKS[url.pathname];
  if (fallbackAsset) {
    const fallback = await cache.match(fallbackAsset);
    if (fallback && !fallback.redirected && fallback.type !== "opaqueredirect") {
      return fallback;
    }
  }

  const rootFallback = await cache.match(APP_SHELL);
  if (url.pathname === "/" || url.pathname === "/index.html") {
    return rootFallback || Response.error();
  }

  const notFound = await cache.match("./404.html");
  return notFound || rootFallback || Response.error();
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);

  const isSameOrigin = url.origin === self.location.origin;
  if (isSameOrigin) {
    if (request.mode === "navigate") {
      event.respondWith(networkFirstNavigation(request));
      return;
    }

    event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
    return;
  }
});
