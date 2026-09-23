/* ============================================
   GEO — Service Worker
   شرکت فرصت‌های تحصیلی غرجستان
   ============================================ */

var CACHE = 'geo-v2';
var ASSETS = [
  './geo-login.html',
  './geo.html',
  './geo-admin.html',
  './manifest-geo.json',
  './firebase-config.js'
];

/* Install */
self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(ASSETS).catch(function(err){ console.warn('[SW]', err); });
    }).then(function(){ return self.skipWaiting(); })
  );
});

/* Activate */
self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

/* Fetch */
self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;

  /* Network-only for external APIs and Firebase */
  var url = e.request.url;
  if(url.indexOf('open.er-api.com') > -1 ||
     url.indexOf('firestore.googleapis.com') > -1 ||
     url.indexOf('gstatic.com') > -1 ||
     url.indexOf('googleapis.com') > -1){
    return;
  }

  /* Cache-first for same-origin */
  e.respondWith(
    caches.match(e.request).then(function(cached){
      if(cached) return cached;
      return fetch(e.request).then(function(res){
        if(res && res.status === 200 && res.type === 'basic'){
          var clone = res.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        }
        return res;
      }).catch(function(){
        if(e.request.destination === 'document') return caches.match('./geo-login.html');
      });
    })
  );
});