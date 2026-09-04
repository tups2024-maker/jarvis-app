/* JARVIS accounting master Google Sheet direct link */
(function(){
  'use strict';
  const MASTER_URL='https://docs.google.com/spreadsheets/d/1Itlt2LkosrvNnvZrbAWb6PpeZlAQaW0hJf8CzwPfddI/edit';

  function addButton(){
    if(document.getElementById('jarvisAccountingMasterLink')) return;
    const page=document.getElementById('page-workbook')||document.querySelector('[data-page-root="workbook"]')||document.body;
    if(!page) return;
    const host=page.querySelector('.section-head,.page-head,.panel-head,.workbook-actions,.toolbar')||page;
    const a=document.createElement('a');
    a.id='jarvisAccountingMasterLink';
    a.href=MASTER_URL;
    a.target='_blank';
    a.rel='noopener noreferrer';
    a.textContent='Google正本を開く';
    a.setAttribute('aria-label','2026年8月 配送管理表 実運用版をGoogleスプレッドシートで開く');
    a.style.cssText='display:inline-flex;align-items:center;justify-content:center;gap:6px;margin:8px;padding:9px 14px;border:1px solid #52e5ff;border-radius:10px;color:#dffcff;text-decoration:none;background:rgba(20,120,150,.18);box-shadow:0 0 18px rgba(82,229,255,.18);font-weight:700;font-size:12px;';
    host.appendChild(a);
  }

  function boot(){ addButton(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,500)); else setTimeout(boot,500);
  new MutationObserver(addButton).observe(document.documentElement,{childList:true,subtree:true});
  window.JARVIS_ACCOUNTING_MASTER_URL=MASTER_URL;
})();