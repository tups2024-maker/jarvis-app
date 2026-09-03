/* JARVIS V7.0.9 ops hardening: live date + Google master shortcut + sync health */
(function(){
  'use strict';
  const MASTER_URL='https://docs.google.com/spreadsheets/d/1Itlt2LkosrvNnvZrbAWb6PpeZlAQaW0hJf8CzwPfddI/edit';
  const TZ='Asia/Tokyo';
  const norm=v=>String(v??'').replace(/\u3000/g,' ').replace(/\s+/g,' ').trim();

  function tokyoDate(){
    const parts=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date()).map(p=>[p.type,p.value]));
    return {year:+parts.year,month:+parts.month,day:+parts.day};
  }
  function liveDateText(){
    const d=tokyoDate();
    const mon=['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'][d.month-1];
    return `${String(d.day).padStart(2,'0')} ${mon} ${d.year} / SECURE LINK`;
  }
  function patchHudDate(){
    document.querySelectorAll('.hud-topline span').forEach(el=>{
      if(/\b(?:JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)\b/i.test(el.textContent||'')||/\d{1,2}\s+[A-Z]{3}\s+20\d{2}/.test(el.textContent||'')) el.textContent=liveDateText();
    });
  }
  function addMasterButton(){
    if(document.getElementById('jarvisGoogleMasterLink')) return;
    const host=document.querySelector('#page-workbook .section-head, #page-workbook .panel-head, #page-workbook') || document.querySelector('.command-quick-links');
    if(!host) return;
    const a=document.createElement('a');
    a.id='jarvisGoogleMasterLink';
    a.href=MASTER_URL;
    a.target='_blank';
    a.rel='noopener noreferrer';
    a.textContent='↗ Google配送管理 正本を開く';
    a.style.cssText='display:inline-flex;align-items:center;justify-content:center;gap:6px;padding:9px 12px;border:1px solid rgba(69,221,255,.55);border-radius:10px;color:#bff5ff;text-decoration:none;background:rgba(0,160,210,.10);font-size:12px;font-weight:700;margin:6px;';
    host.appendChild(a);
  }
  function addSyncHealth(){
    let el=document.getElementById('jarvisSyncHealth');
    if(!el){
      const host=document.querySelector('#page-workbook .section-head, #page-workbook .panel-head, #page-workbook');
      if(!host) return;
      el=document.createElement('small');
      el.id='jarvisSyncHealth';
      el.style.cssText='display:inline-block;margin:6px;color:#8ddfee;font-size:11px';
      host.appendChild(el);
    }
    const label=window.JARVIS_ACTIVE_YEARMONTH||'';
    el.textContent=`Google Sheets 正本 / ${label||'現在月'} / 自動同期`;
  }
  function auditVisibleWorkbook(){
    const wb=window.WB;
    const out={sheets:0,errors:0,oldMonthRows:0};
    if(!wb?.SheetNames||!window.XLSX?.utils?.sheet_to_json) return out;
    const d=tokyoDate();
    const target=`${d.month}月`;
    wb.SheetNames.forEach(name=>{
      out.sheets++;
      let rows=[];try{rows=XLSX.utils.sheet_to_json(wb.Sheets[name],{header:1,defval:'',raw:false})}catch{}
      rows.forEach((row,i)=>{
        row.forEach(v=>{if(/^#(?:REF!|VALUE!|N\/A)$/i.test(norm(v)))out.errors++;});
        if(i>=3){const x=norm(row?.[0]);if(/^\d{1,2}月\d{1,2}日/.test(x)&&!x.startsWith(target))out.oldMonthRows++;}
      });
    });
    window.JARVIS_ACCOUNTING_AUDIT=out;
    const el=document.getElementById('jarvisSyncHealth');
    if(el){
      const state=out.errors||out.oldMonthRows?'要確認':'正常';
      el.textContent=`Google Sheets 正本 / ${window.JARVIS_ACTIVE_YEARMONTH||'現在月'} / ${out.sheets}シート / ${state}`;
      el.title=`数式エラー ${out.errors} / 月外行 ${out.oldMonthRows}`;
    }
    return out;
  }
  function refresh(){patchHudDate();addMasterButton();addSyncHealth();auditVisibleWorkbook();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(refresh,1100),{once:true});else setTimeout(refresh,1100);
  setInterval(refresh,30000);
  window.addEventListener('jarvis-delivery-synced',()=>setTimeout(refresh,150));
  new MutationObserver(()=>{patchHudDate();addMasterButton();}).observe(document.documentElement,{childList:true,subtree:true});
  window.JARVIS_OPS_HARDENING={refresh,auditVisibleWorkbook,masterUrl:MASTER_URL};
})();
