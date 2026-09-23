var CACHE = 'geo-v2';
var ASSETS = [
  './geo-login.html',
  './geo.html',
  './geo-admin.html',
  './manifest-geo.json',
  './firebase-config.js'
];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(cache){
      return cache.addAll(ASSETS).catch(function(err){ console.warn('[SW]', err); });
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method !== 'GET') return;

  /* Exchange rate + Firebase — network first */
  if(e.request.url.indexOf('open.er-api.com') > -1 || e.request.url.indexOf('firestore.googleapis.com') > -1 || e.request.url.indexOf('gstatic.com') > -1){
    return;
  }

  /* Same-origin — cache first */
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