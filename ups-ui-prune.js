(()=>{
  'use strict';
  const TARGETS=new Set(['ドライバー','採用・求人','営業リスト','AI事業']);
  const CARD_SELECTORS=['.card','.action','.menu-card','.nav-card','.quick-card','.tile','.panel-card','[class*="card"]'];
  function norm(v){return String(v||'').replace(/\s+/g,' ').trim();}
  function removeTarget(el){
    if(!TARGETS.has(norm(el.textContent)))return false;
    let p=el;
    while(p&&p!==document.body){
      if(CARD_SELECTORS.some(sel=>{try{return p.matches(sel)}catch{return false}})){
        p.remove();
        return true;
      }
      p=p.parentElement;
    }
    return false;
  }
  function prune(){
    document.querySelectorAll('h1,h2,h3,h4,h5,b,strong,.title,.card-title,.menu-title').forEach(removeTarget);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',prune);else prune();
  let ticks=0;
  const mo=new MutationObserver(()=>{prune();if(++ticks>100)mo.disconnect()});
  mo.observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(prune,500);setTimeout(prune,1500);setTimeout(prune,3000);
})();
