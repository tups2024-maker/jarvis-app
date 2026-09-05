const CACHE='jarvis-v7-0-13-20260905';
const CORE=[
  './',
  './index.html',
  './v7.html',
  './manifest.json',
  './jarvis-icon.svg',
  './jarvis-openai-chat.js',
  './jarvis-app-shell.js',
  './jarvis-tax-mom.js'
];

self.addEventListener('install',event=>{
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).catch(()=>{}));
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;

  // HTML/navigation is always network-first so the newest JARVIS loads quickly.
  if(req.mode==='navigate' || req.destination==='document'){
    event.respondWith(
      fetch(req,{cache:'no-store'})
        .then(res=>{const copy=res.clone();caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});return res;})
        .catch(()=>caches.match(req).then(r=>r||caches.match('./')))
    );
    return;
  }

  // Static assets use stale-while-revalidate for app-like speed without locking old code.
  event.respondWith((async()=>{
    const cached=await caches.match(req);
    const network=fetch(req).then(res=>{
      const copy=res.clone();
      caches.open(CACHE).then(c=>c.put(req,copy)).catch(()=>{});
      return res;
    }).catch(()=>null);
    return cached || await network || new Response('',{status:504});
  })());
});
