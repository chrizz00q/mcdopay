/* Mcdopay service worker. The build script fills in the cache version and file list below. */
const CACHE = 'mcdopay-__VERSION__';
const FILES = __FILES__;
const SCOPE = self.registration.scope;
const SHELL = new URL('index.html', SCOPE).href;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES.map((f) => new URL(f, SCOPE).href)))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith('mcdopay-') && k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // Opening the app: try the network briefly so new deploys show up,
  // then fall back to the saved copy (this is what makes it work offline).
  if (req.mode === 'navigate') {
    event.respondWith(
      new Promise((resolve) => {
        const fallback = () => caches.match(SHELL).then((hit) => resolve(hit || Response.error()));
        const timer = setTimeout(fallback, 4000);
        fetch(req)
          .then((res) => {
            clearTimeout(timer);
            if (res.ok) {
              const copy = res.clone();
              caches.open(CACHE).then((c) => c.put(SHELL, copy));
            }
            resolve(res);
          })
          .catch(() => {
            clearTimeout(timer);
            fallback();
          });
      }),
    );
    return;
  }

  // Everything else: saved copy first (built files have unique names), network if missing.
  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
