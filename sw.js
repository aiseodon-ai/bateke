// sw.js - BATEKE V5.6.4 APP CHECK - FIX DEFINITIF CONNEXION
const CACHE_VERSION = 'v5.6.4-appcheck-20261022';
const CACHE_NAME = 'bateke-' + CACHE_VERSION;

self.addEventListener('install', e => { 
  console.log('SW INSTALL', CACHE_VERSION);
  self.skipWaiting(); 
});

self.addEventListener('activate', e => { 
  console.log('SW ACTIVATE', CACHE_VERSION, '- suppression anciens caches');
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => {
          console.log('SW DELETE OLD', k);
          return caches.delete(k);
        })
      );
    }).then(() => self.clients.claim())
  );
});

// ✅ FIX: NE CACHE RIEN, TOUJOURS RESEAU - Pour App Check + modules
self.addEventListener('fetch', e => {
  // On laisse passer 100% en réseau, pas de cache
  // C'est voulu pour V5.6.4 App Check, Firebase doit charger frais
  e.respondWith(
    fetch(e.request)
      .then(res => res)
      .catch(() => {
        // Si vraiment offline, on essaie le cache (fallback)
        return caches.match(e.request).then(cached => {
          if(cached) return cached;
          // Si c'est une navigation, renvoie vendeur.html du cache si existe
          if(e.request.mode === 'navigate'){
            return caches.match('./vendeur.html');
          }
          throw new Error('offline');
        });
      })
  );
});
