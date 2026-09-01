/* JARVIS V7.0.7 Google master sync hotfix */
(function(){
  'use strict';

  const EXPECTED_AUGUST_SHEETS=[
    '2026年8月 鶴見','2026年8月 中村区','2026年8月 一宮','2026年8月 静岡','2026年8月 三島',
    '2026年8月 お酒','2026年8月 秋山製麺','2026年8月 遠州トラック 野洲市',
    '2026年8月 遠州トラック 駿河区','2026年8月 遠州トラック 富士市'
  ];
  const AUTO_REFRESH_MS=30000;
  let lastSyncAt=0;

  function apiBaseUrl(){ return typeof GAS_API_URL==='string'?GAS_API_URL:''; }
  function isWorkerBase(){ return /workers\.dev|t-ups2024\.work/i.test(apiBaseUrl()); }
  function gasActionUrl(action){
    const base=apiBaseUrl(); if(!base) return '';
    return base+(base.includes('?')?'&':'?')+'action='+encodeURIComponent(action)+'&_='+Date.now();
  }
  function workerUrl(path){ return apiBaseUrl().replace(/\/$/,'')+path; }
  async function readJson(response){
    const text=await response.text(); let result;
    try{result=JSON.parse(text);}catch(_){throw new Error('APIがJSONを返していません: '+text.slice(0,160).replace(/\s+/g,' '));}
    if(!response.ok) throw new Error(result?.error||('API error '+response.status));
    return result;
  }
  function ensureSuccess(result){ if(result?.success===false) throw new Error(result?.error||'APIでエラーが発生しました'); return result; }
  function extractSheets(result){
    const data=result?.data??result;
    if(Array.isArray(data)) return data;
    if(Array.isArray(data?.sheets)) return data.sheets;
    if(data?.sheets&&typeof data.sheets==='object') return Object.entries(data.sheets).map(([sheetName,v])=>({sheetName,values:Array.isArray(v)?v:v?.values}));
    if(data?.sheetName&&Array.isArray(data.values)) return [data];
    if(Array.isArray(data?.values)) return [{sheetName:data.sheetName||'',values:data.values}];
    return [];
  }
  function normalizeName(v){ return String(v||'').replace(/\u3000/g,' ').replace(/\s+/g,' ').trim(); }
  function validateAugustSheets(sheets){
    const names=new Set(sheets.map(s=>normalizeName(s.sheetName||s.name)));
    const missing=EXPECTED_AUGUST_SHEETS.filter(name=>!names.has(normalizeName(name)));
    if(missing.length) throw new Error('8月の配送管理表が不足しています: '+missing.join(' / '));
  }
  function normalizeAugustValues(values){
    if(!Array.isArray(values)) return values;
    return values.map((row,r)=>{
      if(!Array.isArray(row)) return row;
      const next=[...row];
      if(r>=3 && typeof next[0]==='string' && /^2026-\d{2}-\d{2}T/.test(next[0])){
        const d=new Date(next[0]);
        if(!Number.isNaN(d.getTime())){
          const parts=new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric'}).formatToParts(d);
          const m=Number(parts.find(x=>x.type==='month')?.value||0);
          const day=Number(parts.find(x=>x.type==='day')?.value||0);
          if(m===8&&day) next[0]=`8月${day}日`;
        }
      }
      return next;
    });
  }
  function pruneWorkbookToAugust(){
    if(!WB||!Array.isArray(WB.SheetNames)||!WB.Sheets) return;
    const keep=new Set(EXPECTED_AUGUST_SHEETS.map(normalizeName));
    WB.SheetNames=[...WB.SheetNames].filter(name=>keep.has(normalizeName(name)));
    Object.keys(WB.Sheets).forEach(name=>{if(!keep.has(normalizeName(name))) delete WB.Sheets[name];});
    WB_FILTERS={};
  }

  saveGoogleDeliveryRange=async function(sheetName,range,values){
    if(!apiBaseUrl()) throw new Error('配送管理表APIが設定されていません');
    let response;
    if(isWorkerBase()){
      response=await fetch(workerUrl('/delivery/save'),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sheetName,range,values})});
    }else{
      const action='saveDeliveryData';
      response=await fetch(gasActionUrl(action),{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,sheetName,range,values})});
    }
    return ensureSuccess(await readJson(response));
  };

  fetchGoogleDelivery=async function(silent=false){
    if(workbookEditingOrDirty()||WB_GOOGLE_IMPORTING)return false;
    if(!apiBaseUrl())return false;
    WB_GOOGLE_IMPORTING=true;
    try{
      const url=isWorkerBase()?workerUrl('/delivery'):gasActionUrl('getDeliveryData');
      const response=await fetch(url,{cache:'no-store'});
      const result=ensureSuccess(await readJson(response));
      const sheets=extractSheets(result);
      if(!sheets.length) throw new Error('配送管理表データが応答にありません');
      validateAugustSheets(sheets);
      sheets.forEach(s=>mergeGoogleDeliverySheet(s.sheetName||s.name,normalizeAugustValues(s.values)));
      pruneWorkbookToAugust();
      normalizeBlankMoneyDefaults();
      applyManualWorkbookOverrides();
      applyNoAutoPayRows();
      await persistMigratedWorkbook();
      setupSheetSelect();
      renderWorkbook();
      lastSyncAt=Date.now();
      window.dispatchEvent(new CustomEvent('jarvis-delivery-synced',{detail:{at:lastSyncAt,sheets:sheets.length}}));
      if($('workbookStatus')) $('workbookStatus').textContent='✓ 2026年8月 全10配送管理表をGoogle正本と同期しました';
      return true;
    }catch(e){
      console.error('delivery fetch failed',e);
      if($('workbookStatus')) $('workbookStatus').textContent='Google配送管理表の取得に失敗しました（JARVIS内データは保持）：'+(e?.message||e);
      return false;
    }finally{ WB_GOOGLE_IMPORTING=false; }
  };

  function refreshIfSafe(){
    if(document.hidden) return;
    if(Date.now()-lastSyncAt<5000) return;
    try{fetchGoogleDelivery(true);}catch(_){}
  }

  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(refreshIfSafe,1400);
    setInterval(refreshIfSafe,AUTO_REFRESH_MS);
  });
  window.addEventListener('focus',refreshIfSafe);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) refreshIfSafe();});
})();
