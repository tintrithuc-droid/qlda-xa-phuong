/* Service worker: lưu sẵn khung giao diện để mở nhanh trên điện thoại; dữ liệu nghiệp vụ (/api) luôn lấy từ máy chủ */
const CACHE = 'qlda-shell-v6';
const SHELL = ['/', '/css/app.css', '/js/seed.js', '/js/core.js', '/js/views-1.js', '/js/views-2.js', '/js/views-3.js', '/js/views-4.js', '/lib/xlsx.full.min.js', '/icons/icon.svg', '/manifest.webmanifest'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || u.origin !== location.origin || u.pathname.startsWith('/api/')) return;
  // Ưu tiên mạng để luôn có bản mới nhất; mất mạng thì dùng bản đã lưu
  e.respondWith(fetch(e.request).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(u.pathname === '/' ? '/' : e.request, c)); } return r; })
    .catch(() => caches.match(u.pathname === '/' ? '/' : e.request, { ignoreSearch: true })));
});
