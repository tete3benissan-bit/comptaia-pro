// Service worker: makes GEST Africa launchable with zero connectivity after
// the first visit, on top of the Phase 2 cloud sync (which only covers
// "stay usable if the connection drops mid-session", not "open the app from
// cold with no connection at all").
//
// Strategy: network-first, cache-fallback, for everything. Not cache-first -
// this app has no build step/versioned filenames, so there's no reliable
// signal for "this file changed, bust the cache" other than always trying
// the network first when it's available and only falling back to the cached
// copy when the network fails. That means online users always get the
// latest deploy; the cache is purely the offline safety net.
//
// NOTE: if new css/*.css or js/*.js files are added to the app, add them to
// PRECACHE_URLS below too, or they simply won't be available offline until
// the first time they're fetched online (they'll still work fine online).
const CACHE_NAME = 'gest-africa-shell-v22';

const PRECACHE_URLS = [
  './',
  'index.html',
  'manifest.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'css/01-core.css','css/02-v10-dashboard.css','css/03-v11.css','css/04-jtab.css',
  'css/05-v14.css','css/06-v17-liasse-annexes.css','css/07-v18-stock.css','css/08-mobile.css',
  'css/09-v19.css','css/10-v20.css','css/11-v21.css','css/12-pro-theme.css',
  'css/13-v22-rh.css','css/14-uiverse.css','css/15-nav-icons.css','css/16-ia-copilot.css',
  'js/00-supabase-client.js','js/00b-pays-secteur.js','js/00c-pays-profil.js','js/00d-forme-juridique.js','js/01-core.js','js/02-immo-bilan-pdf-ia.js','js/03-v10-panes-inject.js',
  'js/04-v10-functions.js','js/05-v11-forme-juridique-prevision.js','js/06-v12-core-module.js','js/07-v13.js',
  'js/08-v14.js','js/09-correctif-orphan-panes.js','js/10-v15-accordion.js','js/11-v16-devis-paie.js',
  'js/12-v17-tft-liasse-annexes.js','js/13-v18-stock.js','js/14-mobile.js','js/15-v19-specializations.js',
  'js/00e-secteur-modules.js',
  'js/16-v20-notifications-sa-sarl.js','js/17-v21-recherche-import.js','js/18-v22-rh.js','js/19-nav-icons.js',
  'js/20-user-management.js','js/21-ia-copilot.js','js/22-permissions.js','js/23-supabase-sync.js',
  'js/24-draft-autosave.js','js/25-declaration-cnss.js','js/27-parametres.js','js/28-i18n.js',
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){ return cache.addAll(PRECACHE_URLS); })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(names.filter(function(n){ return n!==CACHE_NAME; }).map(function(n){ return caches.delete(n); }));
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', function(event){
  if(event.request.method !== 'GET') return; // never intercept writes (Supabase calls etc.)
  // Only handle this app's own same-origin files. Cross-origin requests
  // (Supabase's REST/Auth API, the CDN scripts, Google Fonts) must be left
  // completely alone - caching a Supabase API GET response here and serving
  // it back as a stale fallback on a later transient failure is exactly
  // what caused accounting data to intermittently vanish/revert after a
  // refresh, since supabase-js has no way to tell that "response" apart
  // from a real fresh one.
  if(new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(event.request).then(function(res){
      var copy = res.clone();
      caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
      return res;
    }).catch(function(){
      return caches.match(event.request).then(function(cached){
        if(cached) return cached;
        if(event.request.mode === 'navigate') return caches.match('index.html');
        return Response.error();
      });
    })
  );
});
