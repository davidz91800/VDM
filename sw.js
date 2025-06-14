const CACHE_NAME = 'calctas-cache-v5'; // Version de cache incrémentée
// Liste des fichiers à mettre en cache
const urlsToCache = [
  './', 
  'index.html',
  'tas_calculator.html',
  'calculator.js',
  'gradient_calculator.html',
  'layout.js',
  'gradient_calculator.js',
  'performance_data.js',
  'style.css',
  'manifest.json',
  'logocalc.png',
  'icon-192x192.png',
  'icon-512x512.png',
  
  // NOUVEAUX FICHIERS AJOUTÉS
  'checklists.html',
  'checklist_viewer.html',
  'checklist.js',
  'checklist_data.js', // Ajout du fichier de données

  // Polices et icônes externes
  'https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&family=Orbitron:wght@500&family=Stardos+Stencil:wght@700&display=swap',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.0/css/all.min.css'
];

// Étape d'installation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        // Utilisation de addAll avec un re-fetch pour éviter les problèmes de cache opaque
        const promises = urlsToCache.map(url => {
            return fetch(new Request(url, {cache: 'reload'}))
                .then(response => cache.put(url, response));
        });
        return Promise.all(promises);
      })
  );
});

// Étape de fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      }
    )
  );
});

// Étape d'activation
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});