const CACHE='tareas-gobierno-real-17L100-v5';
const SHELL=['./','./index.html','./manifest.webmanifest','./icon.svg'];
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{for(const k of await caches.keys())if(k.startsWith('tareas-gobierno-real-17L100-')&&k!==CACHE)await caches.delete(k);await self.clients.claim();})());});
self.addEventListener('fetch',event=>{const r=event.request;if(r.method!=='GET'||new URL(r.url).origin!==self.location.origin)return;
if(r.mode==='navigate'){event.respondWith(fetch(r).catch(()=>caches.match('./index.html')));return;}
if(SHELL.some(p=>new URL(p,self.registration.scope).href===r.url))event.respondWith(caches.match(r).then(x=>x||fetch(r)));});
