// sw.js - BATEKE V5.6.4 APP CHECK - FORCE UPDATE
const CACHE_VERSION = 'v5.6.4-appcheck-20261020';
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
        keys.map(key => {
          if(key !== CACHE_NAME){
            console.log('SW DELETE OLD', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Ne cache rien, laisse passer - Firebase + modules chargent frais
self.addEventListener('fetch', e => {
  // Toujours réseau d'abord pour js/vendeur/* et js/patron/*
  if(e.request.url.includes('/js/') || e.request.url.includes('firebase')){
    return e.request;
  }
  return e.request;
});
