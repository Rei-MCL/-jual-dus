/* Jual Dus - service worker
   HTML selalu diambil dari jaringan lebih dulu supaya pembaruan langsung terpakai.
   Aset statis (ikon, manifest) tetap dari cache. */
const CACHE = 'jualdus-v3';
const ASET  = ['./manifest.json', './icon-192.png', './icon-512.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASET)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(k => Promise.all(k.filter(x => x !== CACHE).map(x => caches.delete(x))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const htmlDiminta = req.mode === 'navigate' ||
    (req.headers.get('accept') || '').includes('text/html');

  if (htmlDiminta) {
    // jaringan dulu, cache hanya sebagai cadangan saat offline
    e.respondWith(
      fetch(req).then(res => {
        const salinan = res.clone();
        caches.open(CACHE).then(c => c.put('./index.html', salinan));
        return res;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }

  e.respondWith(
    caches.match(req).then(hit => hit || fetch(req).then(res => {
      const salinan = res.clone();
      caches.open(CACHE).then(c => c.put(req, salinan));
      return res;
    }))
  );
});
