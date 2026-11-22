// Service worker: offline app shell.
// Strategy: NETWORK-FIRST for the page and its shell files (always the latest deploy when online,
// so index.html and tareas-core.js can never be a mismatched pair), cached copy only when offline.
// Encrypted user data is NEVER cached here; it lives in the browser's own storage.
// Only same-origin GETs are touched: Microsoft login / Graph traffic bypasses this worker entirely.
const VERSION = '17L102-1';              // CI stamps this with the commit hash (see deploy.yml)
const CACHE = `tareas-shell-${VERSION}`;
const OWN_PREFIXES = ['tareas-shell-', 'tareas-gobierno-preview-17L101-'];   // also cleans the old worker's cache
const SHELL = [
  './', './index.html', './tareas-core.js', './manifest.webmanifest',
  './icon.svg', './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png',
];
const SHELL_URLS = new Set(SHELL.map(p => new URL(p, self.registration.scope).href));
const INDEX = new URL('./index.html', self.registration.scope).href;

self.addEventListener('install', e => {
  // 'reload' bypasses the HTTP cache so a fresh deploy is never precached from a stale copy.
  // addAll is atomic: if any file is missing the new worker does not install and the old one keeps working.
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== CACHE && OWN_PREFIXES.some(p => k.startsWith(p))) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', e => {
  const r = e.request, url = new URL(r.url);
  if (r.method !== 'GET' || url.origin !== self.location.origin) return;
  const nav = r.mode === 'navigate';
  if (!nav && !SHELL_URLS.has(url.href)) return;                 // anything else: normal network behaviour
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(r.url, { cache: 'no-cache' });     // revalidate; cheap 304 when unchanged
      if (res.ok) cache.put(nav ? INDEX : r.url, res.clone());   // navigations always stored as index.html (never ?code=… URLs)
      return res;
    } catch {
      return (await cache.match(nav ? INDEX : r.url)) || Response.error();
    }
  })());
});
