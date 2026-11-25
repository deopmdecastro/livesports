/* Offline fallback only. Never cache pages, API responses, video, ads or user data. */
const CACHE = 'livesports-offline-v1';
const ASSETS = ['/offline.html', '/icons/icon-192.png'];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith('livesports-offline-') && key !== CACHE).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(fetch(request).catch(async () => (await caches.match('/offline.html')) || Response.error()));
  } else if (ASSETS.includes(url.pathname)) {
    event.respondWith(fetch(request).catch(() => caches.match(request)));
  }
});

self.addEventListener('push', event => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch { data = {}; }
  const link = typeof data.link === 'string' && data.link.startsWith('/') && !data.link.startsWith('//') && !data.link.includes('\\') ? data.link : '/';
  event.waitUntil(self.registration.showNotification(typeof data.title === 'string' ? data.title.slice(0,150) : 'LiveSports', {
    body: typeof data.body === 'string' ? data.body.slice(0,500) : '', icon: '/icons/icon-192.png', badge: '/icons/icon-192.png',
    data: { link }, ...(data.id ? {tag: String(data.id)} : {})
  }));
});
self.addEventListener('notificationclick', event => {
  event.notification.close();
  const path = event.notification.data?.link || '/';
  const target = new URL(path, self.location.origin);
  if (target.origin !== self.location.origin) return;
  event.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(async windows => {
    const existing=windows.find(client => new URL(client.url).origin === self.location.origin);
    if(existing){ await existing.focus(); return existing.navigate(target.href); }
    return clients.openWindow(target.href);
  }));
});
