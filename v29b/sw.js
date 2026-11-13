const CACHE='tareas-gobierno-v29b-c17l162';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install', event => { event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())); });
self.addEventListener('activate', event => { event.waitUntil((async()=>{for(const key of await caches.keys()){if(key.startsWith('tareas-gobierno-v29b-')&&key!==CACHE)await caches.delete(key)}await self.clients.claim()})()); });
self.addEventListener('fetch', event => {
 const req=event.request;
 if(req.method!=='GET'||new URL(req.url).origin!==self.location.origin)return;
 if(req.mode==='navigate'){
   event.respondWith(fetch(req).catch(async()=>await caches.match('./index.html')));
   return;
 }
 if(SHELL.some(path=>new URL(path,self.registration.scope).href===req.url)){
   event.respondWith(caches.match(req).then(cached=>cached||fetch(req)));
 }
});