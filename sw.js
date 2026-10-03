// Cache only the connection fallback. Never store sports pages, APIs or prediction data.
const CACHE='tonati-offline-v1',OFFLINE='/offline.html';
self.addEventListener('install',event=>{
 event.waitUntil((async()=>{const response=await fetch(OFFLINE,{cache:'reload'});if(!response.ok)throw Error('Offline page unavailable');const cache=await caches.open(CACHE);await cache.put(OFFLINE,response);await self.skipWaiting();})());
});
self.addEventListener('activate',event=>{
 event.waitUntil((async()=>{for(const key of await caches.keys())if(key.startsWith('tonati-offline-')&&key!==CACHE)await caches.delete(key);await self.clients.claim();})());
});
self.addEventListener('fetch',event=>{
 if(event.request.method!=='GET'||event.request.mode!=='navigate'||new URL(event.request.url).origin!==self.location.origin)return;
 event.respondWith((async()=>{try{return await fetch(event.request);}catch{const fallback=await caches.match(OFFLINE,{cacheName:CACHE});return fallback||new Response('Unable to connect. Reconnect and reload TONATI LAB.',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});}})());
});
