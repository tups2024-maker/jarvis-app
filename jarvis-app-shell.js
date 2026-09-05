/* JARVIS V7.0.13 app shell: installable PWA + mobile app chrome */
(function(){
  'use strict';

  function css(){
    if(document.getElementById('jarvis-app-shell-style'))return;
    const s=document.createElement('style');
    s.id='jarvis-app-shell-style';
    s.textContent=`
      html{background:#020711;min-height:100%;overscroll-behavior:none}
      body{min-height:100dvh;overscroll-behavior-y:none;-webkit-tap-highlight-color:transparent;padding-bottom:env(safe-area-inset-bottom)}
      button,a,input,textarea,select{touch-action:manipulation}
      .jarvis-app-badge{position:fixed;right:14px;top:max(10px,env(safe-area-inset-top));z-index:9998;padding:7px 10px;border:1px solid rgba(80,225,255,.35);border-radius:999px;background:rgba(2,14,24,.88);backdrop-filter:blur(14px);color:#9af1ff;font-size:10px;letter-spacing:.08em;pointer-events:none}
      .jarvis-bottom-nav{display:none}
      .jarvis-install-tip{display:none;position:fixed;left:12px;right:12px;bottom:calc(max(12px,env(safe-area-inset-bottom)) + 78px);z-index:9996;padding:12px 13px;border:1px solid rgba(80,225,255,.28);border-radius:15px;background:rgba(2,14,24,.96);box-shadow:0 18px 42px rgba(0,0,0,.38);color:#dffaff;font-size:12px;line-height:1.55}
      .jarvis-install-tip button{float:right;margin-left:8px;border:0;background:transparent;color:#7defff;font:inherit;font-weight:700}
      @media(max-width:900px){
        body{background:radial-gradient(circle at 50% 0%,rgba(0,178,215,.07),transparent 34%),#020711}
        main{padding-bottom:102px!important}.sidebar{padding-bottom:105px!important}
        .jarvis-bottom-nav{position:fixed;left:8px;right:8px;bottom:max(8px,env(safe-area-inset-bottom));z-index:9997;display:grid;grid-template-columns:repeat(5,1fr);gap:5px;padding:7px;border:1px solid rgba(70,220,255,.28);border-radius:20px;background:rgba(2,14,24,.95);backdrop-filter:blur(20px);box-shadow:0 16px 42px #000b}
        .jarvis-bottom-nav button{min-width:0;border:0;border-radius:13px;background:transparent;color:#7fa7b6;padding:9px 3px 7px;font:inherit;font-size:10px;cursor:pointer}
        .jarvis-bottom-nav button b{display:block;color:#dffbff;font-size:17px;line-height:1.15;margin-bottom:3px}
        .jarvis-bottom-nav button.active{background:rgba(22,189,226,.16);color:#7eefff;box-shadow:inset 0 0 0 1px rgba(82,227,255,.24)}
      }
      @media(display-mode:standalone){
        body{padding-top:env(safe-area-inset-top);user-select:none}
        input,textarea{user-select:text}
        .jarvis-app-badge,.jarvis-install-tip{display:none!important}
      }
    `;
    document.head.appendChild(s);
  }

  function activateFor(target,button){
    document.querySelectorAll('#jarvisBottomNav button').forEach(b=>b.classList.remove('active'));
    button?.classList.add('active');
    const src=document.querySelector(`.nav-item[data-page="${target}"],[data-page="${target}"]`);
    if(src){src.click();return;}
    const p=document.getElementById('page-'+target);
    if(p){document.querySelectorAll('main .page.active').forEach(x=>x.classList.remove('active'));p.classList.add('active');window.scrollTo({top:0,behavior:'smooth'});}
  }

  function pageButton(label,icon,target){
    const b=document.createElement('button');
    b.type='button';b.dataset.target=target;b.innerHTML=`<b>${icon}</b><span>${label}</span>`;
    b.addEventListener('click',()=>activateFor(target,b));
    return b;
  }

  function mountNav(){
    let nav=document.getElementById('jarvisBottomNav');
    if(nav)return nav;
    nav=document.createElement('nav');nav.id='jarvisBottomNav';nav.className='jarvis-bottom-nav';nav.setAttribute('aria-label','JARVIS app navigation');
    [['ホーム','⌂','dashboard'],['シフト','▦','shift'],['配送','⇄','workbook'],['売上','¥','sourcebreakdown'],['AI','J','ai']].forEach((x,i)=>{const b=pageButton(...x);if(i===0)b.classList.add('active');nav.appendChild(b);});
    document.body.appendChild(nav);return nav;
  }

  function badge(){if(document.getElementById('jarvisAppBadge'))return;const d=document.createElement('div');d.id='jarvisAppBadge';d.className='jarvis-app-badge';d.textContent='JARVIS APP';document.body.appendChild(d);}

  function installTip(){
    if(matchMedia('(display-mode: standalone)').matches || navigator.standalone)return;
    if(localStorage.getItem('jarvis-install-tip-closed')==='1')return;
    const isiOS=/iPad|iPhone|iPod/.test(navigator.userAgent);
    const d=document.createElement('div');d.id='jarvisInstallTip';d.className='jarvis-install-tip';
    d.innerHTML=`<button type="button">閉じる</button><b>JARVISをアプリとして使えます</b><br>${isiOS?'Safariの共有ボタン →「ホーム画面に追加」':'ブラウザの「アプリをインストール」またはホーム画面に追加'}で、通常のアプリのように起動できます。`;
    d.querySelector('button').onclick=()=>{localStorage.setItem('jarvis-install-tip-closed','1');d.remove();};
    document.body.appendChild(d);
    setTimeout(()=>{if(d.isConnected)d.style.display='block';},1800);
  }

  function syncActiveNav(){
    const observer=new MutationObserver(()=>{
      const active=document.querySelector('main .page.active');
      if(!active)return;
      const id=(active.id||'').replace(/^page-/,'');
      document.querySelectorAll('#jarvisBottomNav button').forEach(b=>b.classList.toggle('active',b.dataset.target===id));
    });
    const main=document.querySelector('main');if(main)observer.observe(main,{subtree:true,attributes:true,attributeFilter:['class']});
  }

  async function register(){
    if(!('serviceWorker'in navigator))return;
    try{
      const reg=await navigator.serviceWorker.register('./sw.js?v=20260905-1738',{scope:'./'});
      reg.update().catch(()=>{});
    }catch(e){console.warn('[JARVIS APP] service worker',e);}
  }

  function boot(){css();badge();mountNav();installTip();syncActiveNav();register();document.documentElement.dataset.jarvisApp='ready';}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,900),{once:true});else setTimeout(boot,900);
})();
