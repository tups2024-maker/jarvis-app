/* JARVIS V7.0.14 app shell: mobile tap rescue + installable PWA */
(function(){
  'use strict';
  function css(){
    if(document.getElementById('jarvis-app-shell-style'))return;
    const s=document.createElement('style');s.id='jarvis-app-shell-style';s.textContent=`
      html{background:#020711;min-height:100%;overscroll-behavior:none}
      body{min-height:100dvh;overscroll-behavior-y:none;-webkit-tap-highlight-color:transparent;padding-bottom:env(safe-area-inset-bottom)}
      button,a,input,textarea,select,[role="button"]{touch-action:manipulation;pointer-events:auto!important}
      .overlay:not(.show):not(.active),.modal-backdrop:not(.show),[aria-hidden="true"]{pointer-events:none!important}
      .jarvis-app-badge{position:fixed;right:14px;top:max(10px,env(safe-area-inset-top));z-index:9998;padding:7px 10px;border:1px solid rgba(80,225,255,.35);border-radius:999px;background:rgba(2,14,24,.88);backdrop-filter:blur(14px);color:#9af1ff;font-size:10px;letter-spacing:.08em;pointer-events:none!important}
      .jarvis-bottom-nav{display:none;pointer-events:auto!important}.jarvis-bottom-nav *{pointer-events:auto!important}
      @media(max-width:900px){main{padding-bottom:102px!important}.sidebar{padding-bottom:105px!important}.jarvis-bottom-nav{position:fixed;left:8px;right:8px;bottom:max(8px,env(safe-area-inset-bottom));z-index:2147483646;display:grid;grid-template-columns:repeat(5,1fr);gap:5px;padding:7px;border:1px solid rgba(70,220,255,.28);border-radius:20px;background:rgba(2,14,24,.95);backdrop-filter:blur(20px);box-shadow:0 16px 42px #000b}.jarvis-bottom-nav button{min-width:0;border:0;border-radius:13px;background:transparent;color:#7fa7b6;padding:9px 3px 7px;font:inherit;font-size:10px;cursor:pointer}.jarvis-bottom-nav button b{display:block;color:#dffbff;font-size:17px;line-height:1.15;margin-bottom:3px}.jarvis-bottom-nav button.active{background:rgba(22,189,226,.16);color:#7eefff;box-shadow:inset 0 0 0 1px rgba(82,227,255,.24)}}
      @media(display-mode:standalone){body{padding-top:env(safe-area-inset-top);user-select:none}input,textarea{user-select:text}.jarvis-app-badge{display:none!important}}
    `;document.head.appendChild(s);
  }
  function rescueTouchBlockers(){
    const vw=innerWidth||document.documentElement.clientWidth,vh=innerHeight||document.documentElement.clientHeight;
    document.querySelectorAll('body *').forEach(el=>{
      if(el.id==='jarvisBottomNav'||el.closest('#jarvisBottomNav'))return;
      const cs=getComputedStyle(el),r=el.getBoundingClientRect(),zi=parseInt(cs.zIndex,10)||0;
      const covers=r.width>=vw*.88&&r.height>=vh*.72;
      const invisible=cs.visibility==='hidden'||Number(cs.opacity||1)<0.06;
      const name=((el.id||'')+' '+String(el.className||'')).toLowerCase();
      const suspicious=/overlay|backdrop|mask|loading|blocker/.test(name)&&!/show|active|open/.test(name);
      if((covers&&zi>=1000&&invisible)||suspicious)el.style.pointerEvents='none';
    });
  }
  function activateFor(target,button){document.querySelectorAll('#jarvisBottomNav button').forEach(b=>b.classList.remove('active'));button?.classList.add('active');const src=document.querySelector(`.nav-item[data-page="${target}"],[data-page="${target}"]`);if(src){src.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));return;}const p=document.getElementById('page-'+target);if(p){document.querySelectorAll('main .page.active').forEach(x=>x.classList.remove('active'));p.classList.add('active');window.scrollTo({top:0,behavior:'auto'});}}
  function pageButton(label,icon,target){const b=document.createElement('button');b.type='button';b.dataset.target=target;b.innerHTML=`<b>${icon}</b><span>${label}</span>`;let lock=false;const go=e=>{e.preventDefault();e.stopPropagation();if(lock)return;lock=true;activateFor(target,b);setTimeout(()=>lock=false,250)};b.addEventListener('click',go);b.addEventListener('touchend',go,{passive:false});return b;}
  function mountNav(){let nav=document.getElementById('jarvisBottomNav');if(nav)return nav;nav=document.createElement('nav');nav.id='jarvisBottomNav';nav.className='jarvis-bottom-nav';[['ホーム','⌂','dashboard'],['シフト','▦','shift'],['配送','⇄','workbook'],['売上','¥','sourcebreakdown'],['AI','J','ai']].forEach((x,i)=>{const b=pageButton(...x);if(i===0)b.classList.add('active');nav.appendChild(b)});document.body.appendChild(nav);return nav;}
  async function register(){if(!('serviceWorker'in navigator))return;try{const reg=await navigator.serviceWorker.register('./sw.js?v=20260905-1752',{scope:'./'});reg.update().catch(()=>{});}catch(e){console.warn('[JARVIS APP] service worker',e);}}
  function boot(){css();mountNav();register();rescueTouchBlockers();setTimeout(rescueTouchBlockers,700);setTimeout(rescueTouchBlockers,2200);document.documentElement.dataset.jarvisApp='ready';}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,350),{once:true});else setTimeout(boot,350);
})();
