/* Offline service worker. Bump CACHE_NAME in each release. */
const CACHE_NAME = 'juergen-dartkasse-static-3.8.2';
const CORE = ['./dart-juergen-photo.png','./dart-perfect-photo.png','./champion-stars.js?v=3.8.2','./','./index.html','./styles.css?v=3.8.2','./app.js?v=3.8.2','./play-focus.js?v=3.8.2','./evening-engine.js?v=3.8.2','./evening-ui.js?v=3.8.2','./games-engine.js?v=3.8.2','./pro-engine.js?v=3.8.2','./games-ui.js?v=3.8.2','./pro-ui.js?v=3.8.2','./elite-engine.js?v=3.8.2','./elite-ui.js?v=3.8.2','./stats-35.js?v=3.8.2','./dart-caller.js?v=3.8.2','./club-next-engine.js?v=3.8.2','./club-next-ui.js?v=3.8.2','./camera-assist.js?v=3.8.2','./qr-offline.js?v=3.8.2','./live-lan.js?v=3.8.2','./manifest.webmanifest','./favicon-64.png','./icon-192.png','./icon-512.png','./apple-touch-icon.png','./version.json'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(Promise.all([caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('juergen-dartkasse-static-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))),self.clients.claim()])));
self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting();});
self.addEventListener('fetch',event=>{
  const req=event.request;if(req.method!=='GET')return;
  const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  if(url.pathname.endsWith('/version.json')||url.pathname.endsWith('/sw.js')){
    event.respondWith(fetch(req,{cache:'no-store'}).catch(()=>caches.match(req)));
    return;
  }
  if(req.mode==='navigate'){
    event.respondWith(fetch(req,{cache:'no-store'}).then(response=>{if(response.ok){const clone=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put('./index.html',clone));}return response;}).catch(()=>caches.match('./index.html')));
    return;
  }
  event.respondWith(caches.match(req).then(cached=>cached||fetch(req)));
});
