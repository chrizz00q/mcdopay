const CACHE = 'mcdopay-mummt9bv';
const FILES = ["./","assets/index-nwLu7EpQ.js","assets/ibm-plex-mono-cyrillic-400-normal-BSMlKf0J.woff2","assets/ibm-plex-mono-cyrillic-400-normal-CEL4l2ZJ.woff","assets/ibm-plex-mono-cyrillic-500-normal-Ael50iVv.woff","assets/ibm-plex-mono-cyrillic-500-normal-Bq9vWWag.woff2","assets/ibm-plex-mono-cyrillic-600-normal-CTOM6hUh.woff2","assets/ibm-plex-mono-cyrillic-600-normal-fLZuRloM.woff","assets/ibm-plex-mono-cyrillic-ext-400-normal-DMdlQ8Kv.woff","assets/ibm-plex-mono-cyrillic-ext-400-normal-xuaO2J-f.woff2","assets/ibm-plex-mono-cyrillic-ext-500-normal-BIfNGwUT.woff","assets/ibm-plex-mono-cyrillic-ext-500-normal-BqneJy0T.woff2","assets/ibm-plex-mono-cyrillic-ext-600-normal-9HEixskS.woff","assets/ibm-plex-mono-cyrillic-ext-600-normal-V-xxqcpd.woff2","assets/ibm-plex-mono-latin-400-normal-CvHOgSBP.woff","assets/ibm-plex-mono-latin-400-normal-DMJ8VG8y.woff2","assets/ibm-plex-mono-latin-500-normal-CB9ihrfo.woff","assets/ibm-plex-mono-latin-500-normal-DSY6xOcd.woff2","assets/ibm-plex-mono-latin-600-normal-BgSNZQsw.woff2","assets/ibm-plex-mono-latin-600-normal-DWFSQ4vo.woff","assets/ibm-plex-mono-latin-ext-400-normal-BmRBH3aV.woff2","assets/ibm-plex-mono-latin-ext-400-normal-D3D2R8hC.woff","assets/ibm-plex-mono-latin-ext-500-normal-CAhNIIs5.woff2","assets/ibm-plex-mono-latin-ext-500-normal-CZ70TYgx.woff","assets/ibm-plex-mono-latin-ext-600-normal-D38SheWl.woff2","assets/ibm-plex-mono-latin-ext-600-normal-DmB0ttJJ.woff","assets/ibm-plex-mono-vietnamese-400-normal-BulugwFq.woff2","assets/ibm-plex-mono-vietnamese-400-normal-DDuiU_S-.woff","assets/ibm-plex-mono-vietnamese-500-normal-C8zxqsMH.woff","assets/ibm-plex-mono-vietnamese-500-normal-DZ4AoWbu.woff2","assets/ibm-plex-mono-vietnamese-600-normal-D2EvbN8M.woff2","assets/ibm-plex-mono-vietnamese-600-normal-iLQfcSjf.woff","assets/index-C0LLBRuQ.css","assets/space-grotesk-latin-500-normal-CNSSEhBt.woff","assets/space-grotesk-latin-500-normal-lFbtlQH6.woff2","assets/space-grotesk-latin-600-normal-BflQw4A9.woff","assets/space-grotesk-latin-600-normal-DjKNqYRj.woff2","assets/space-grotesk-latin-700-normal-CwsQ-cCU.woff","assets/space-grotesk-latin-700-normal-RjhwGPKo.woff2","assets/space-grotesk-latin-ext-500-normal-3dgZTiw9.woff","assets/space-grotesk-latin-ext-500-normal-DUe3BAxM.woff2","assets/space-grotesk-latin-ext-600-normal-DxxdqCpr.woff2","assets/space-grotesk-latin-ext-600-normal-VcznFIpX.woff","assets/space-grotesk-latin-ext-700-normal-BQnZhY3m.woff2","assets/space-grotesk-latin-ext-700-normal-HVCqSBdx.woff","assets/space-grotesk-vietnamese-500-normal-BTqKIpxg.woff","assets/space-grotesk-vietnamese-500-normal-BmEvtly_.woff2","assets/space-grotesk-vietnamese-600-normal-D6zpsUhD.woff","assets/space-grotesk-vietnamese-600-normal-DUi7WF5p.woff2","assets/space-grotesk-vietnamese-700-normal-DMty7AZE.woff2","assets/space-grotesk-vietnamese-700-normal-Duxec5Rn.woff","favicon.svg","manifest.webmanifest","icon-192.png","icon-512.png","icon-maskable-512.png"];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then((hit) => {
      if (hit) return hit;
      return fetch(e.request).catch(() =>
        e.request.mode === 'navigate' ? caches.match('./') : Response.error()
      );
    })
  );
});
