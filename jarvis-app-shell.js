/* JARVIS app shell: PWA registration + mobile app chrome */
(function(){
  'use strict';
  function css(){
    if(document.getElementById('jarvis-app-shell-style'))return;
    const s=document.createElement('style');s.id='jarvis-app-shell-style';s.textContent=`
      html{background:#020711}body{overscroll-behavior-y:none;-webkit-tap-highlight-color:transparent}
      .jarvis-app-badge{position:fixed;right:14px;top:max(10px,env(safe-area-inset-top));z-index:9998;padding:7px 10px;border:1px solid rgba(80,225,255,.35);border-radius:999px;background:rgba(2,14,24,.88);backdrop-filter:blur(14px);color:#9af1ff;font-size:10px;letter-spacing:.08em;pointer-events:none}
      .jarvis-bottom-nav{display:none}
      @media(max-width:900px){
        main{padding-bottom:92px!important}.sidebar{padding-bottom:96px!important}
        .jarvis-bottom-nav{position:fixed;left:10px;right:10px;bottom:max(10px,env(safe-area-inset-bottom));z-index:9997;display:grid;grid-template-columns:repeat(5,1fr);gap:5px;padding:7px;border:1px solid rgba(70,220,255,.28);border-radius:18px;background:rgba(2,14,24,.94);backdrop-filter:blur(18px);box-shadow:0 12px 35px #000a}
        .jarvis-bottom-nav button{min-width:0;border:0;border-radius:12px;background:transparent;color:#7fa7b6;padding:8px 3px;font:inherit;font-size:10px;cursor:pointer}.jarvis-bottom-nav button b{display:block;color:#dffbff;font-size:16px;margin-bottom:2px}.jarvis-bottom-nav button.active{background:rgba(22,189,226,.16);color:#7eefff;box-shadow:inset 0 0 0 1px rgba(82,227,255,.24)}
      }
      @media(display-mode:standalone){body{padding-top:env(safe-area-inset-top)}.jarvis-app-badge{display:none}}
    `;document.head.appendChild(s);
  }
  function pageButton(label,icon,target){const b=document.createElement('button');b.type='button';b.innerHTML=`<b>${icon}</b><span>${label}</span>`;b.addEventListener('click',()=>{const src=document.querySelector(`.nav-item[data-page="${target}"],[data-page="${target}"]`);if(src){src.click();return;}const p=document.getElementById('page-'+target);if(p){document.querySelectorAll('main .page.active').forEach(x=>x.classList.remove('active'));p.classList.add('active');window.scrollTo(0,0);}});return b;}
  function mountNav(){if(document.getElementById('jarvisBottomNav'))return;const nav=document.createElement('nav');nav.id='jarvisBottomNav';nav.className='jarvis-bottom-nav';[['ホーム','⌂','dashboard'],['シフト','▦','shift'],['配送','⇄','workbook'],['売上','¥','sourcebreakdown'],['AI','J','ai']].forEach(x=>nav.appendChild(pageButton(...x)));document.body.appendChild(nav);}
  function badge(){if(document.getElementById('jarvisAppBadge'))return;const d=document.createElement('div');d.id='jarvisAppBadge';d.className='jarvis-app-badge';d.textContent='JARVIS APP';document.body.appendChild(d);}
  async function register(){if(!('serviceWorker'in navigator))return;try{await navigator.serviceWorker.register('./sw.js?v=20260905-1',{scope:'./'});}catch(e){console.warn('[JARVIS APP] service worker',e);}}
  function boot(){css();badge();mountNav();register();document.documentElement.dataset.jarvisApp='ready';}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,1200),{once:true});else setTimeout(boot,1200);
})();
