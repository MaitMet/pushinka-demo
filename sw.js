/* Химчистка · офлайн-оболочка: страница открывается с телефона как приложение,
   даже при плохой связи. Заявки и статусы всегда берутся из сети. */
var CACHE = 'hc-v3';
var SHELL = ['./', 'index.html', 'admin.html', 'config.js', 'assets/app.css', 'assets/store.js', 'assets/app.js', 'assets/admin.js',
  'icon.svg', 'manifest.webmanifest', 'admin.webmanifest', 'icons/client-192.png', 'icons/admin-192.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
// Сначала сеть, при обрыве — сохранённая копия. api.php не кешируем.
self.addEventListener('fetch', function (e) {
  var url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin || /api\.php/.test(url.pathname)) return;
  e.respondWith(fetch(e.request).then(function (res) {
    var copy = res.clone();
    caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
    return res;
  }).catch(function () { return caches.match(e.request); }));
});
