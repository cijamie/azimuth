// Offline support: caches the app's own files (never API responses or anything cross-origin).
const CACHE = 'azimuth-v3.2';
const SHELL = ['./', 'index.html', 'css/arf.css', 'logo.png', 'manifest.webmanifest', 'icons/icon-192.png',
    ...['data', 'util', 'settings', 'selectors', 'pivots', 'lookups', 'toolkit', 'imagetools', 'case', 'graph', 'watch', 'sweep', 'palette', 'vault', 'analysis', 'bulk', 'forensics', 'research', 'mapview', 'match', 'interop', 'evidencetools', 'ai', 'app'].map(f => `js/${f}.js`)];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
    e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

// Same-origin GETs: network first (so updates show immediately), cache as fallback when offline.
self.addEventListener('fetch', e => {
    const url = new URL(e.request.url);
    if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
    e.respondWith(
        fetch(e.request).then(res => {
            if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
            return res;
        }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('index.html')))
    );
});
