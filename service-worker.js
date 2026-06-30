const CACHE='micontrol-pro-v22-tasa-historica';
const FILES=[
  './','./index.html','./css/style.css','./js/storage.js','./js/app.js',
  './manifest.json','./assets/splash-1080x1920.png',
  './icons/icon-72.png','./icons/icon-96.png','./icons/icon-128.png','./icons/icon-144.png',
  './icons/icon-152.png','./icons/icon-180.png','./icons/icon-192.png','./icons/icon-384.png',
  './icons/icon-512.png','./icons/maskable-512.png'
];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request))));
