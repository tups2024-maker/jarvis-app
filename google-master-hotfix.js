/* JARVIS V7.0.8 Google master sync hotfix */
(function(){
  'use strict';

  const CORE_LOCATIONS=['鶴見','中村区','一宮','静岡','三島','株式会社サカエ','秋山製麺所'];
  const AUTO_REFRESH_MS=30000;
  let lastSyncAt=0;
  let activeYearMonth='';

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
  function tokyoNow(){
    const parts=new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'numeric',day:'numeric'}).formatToParts(new Date());
    return {
      year:Number(parts.find(x=>x.type==='year')?.value||0),
      month:Number(parts.find(x=>x.type==='month')?.value||0),
      day:Number(parts.find(x=>x.type==='day')?.value||0)
    };
  }
  function ymLabel(year,month){ return `${year}年${month}月`; }
  function parseSheetYearMonth(name){
    const m=normalizeName(name).match(/(20\d{2})年\s*(\d{1,2})月/);
    return m?{year:Number(m[1]),month:Number(m[2]),label:ymLabel(Number(m[1]),Number(m[2]))}:null;
  }
  function chooseActiveYearMonth(sheets){
    const now=tokyoNow();
    const wanted=ymLabel(now.year,now.month);
    const labels=[...new Set(sheets.map(s=>parseSheetYearMonth(s.sheetName||s.name)?.label).filter(Boolean))];
    if(labels.includes(wanted)) return wanted;
    if(labels.length){
      return labels.sort((a,b)=>{
        const pa=parseSheetYearMonth(a), pb=parseSheetYearMonth(b);
        return (pb?.year*12+(pb?.month||0))-(pa?.year*12+(pa?.month||0));
      })[0];
    }
    return wanted;
  }
  function selectedSheetsForMonth(sheets,label){
    return sheets.filter(s=>parseSheetYearMonth(s.sheetName||s.name)?.label===label);
  }
  function validateMonthSheets(sheets,label){
    if(!sheets.length) throw new Error(label+'の配送管理表が応答にありません');
    const normalized=sheets.map(s=>normalizeName(s.sheetName||s.name));
    const missingCore=CORE_LOCATIONS.filter(loc=>!normalized.some(name=>name.includes(loc)));
    if(missingCore.length){
      console.warn(label+'の主要配送管理表に未取得があります:',missingCore.join(' / '));
    }
  }
  function normalizeMonthValues(values,label){
    if(!Array.isArray(values)) return values;
    const ym=parseSheetYearMonth(label);
    const targetMonth=ym?.month||tokyoNow().month;
    return values.map((row,r)=>{
      if(!Array.isArray(row)) return row;
      const next=[...row];
      if(r>=3 && typeof next[0]==='string' && /^20\d{2}-\d{2}-\d{2}T/.test(next[0])){
        const d=new Date(next[0]);
        if(!Number.isNaN(d.getTime())){
          const parts=new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric'}).formatToParts(d);
          const m=Number(parts.find(x=>x.type==='month')?.value||0);
          const day=Number(parts.find(x=>x.type==='day')?.value||0);
          if(m===targetMonth&&day) next[0]=`${targetMonth}月${day}日`;
        }
      }
      return next;
    });
  }
  function pruneWorkbookToMonth(label){
    if(!WB||!Array.isArray(WB.SheetNames)||!WB.Sheets) return;
    WB.SheetNames=[...WB.SheetNames].filter(name=>parseSheetYearMonth(name)?.label===label);
    Object.keys(WB.Sheets).forEach(name=>{if(parseSheetYearMonth(name)?.label!==label) delete WB.Sheets[name];});
    WB_FILTERS={};
  }
  function updateMonthLabels(label){
    activeYearMonth=label;
    const m=parseSheetYearMonth(label);
    if(!m) return;
    const monthText=`${m.month}月`;
    const replacements=[
      ['cmdSales',monthText+'売上'],['cmdGross',monthText+'粗利'],['kpiSales',monthText+'累計売上']
    ];
    replacements.forEach(([id,text])=>{
      const el=document.getElementById(id);
      const parent=el?.parentElement;
      const span=parent?.querySelector('span');
      if(span) span.textContent=text;
    });
    document.querySelectorAll('[data-jarvis-active-month]').forEach(el=>el.textContent=label);
    window.JARVIS_ACTIVE_YEARMONTH=label;
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
      const allSheets=extractSheets(result);
      if(!allSheets.length) throw new Error('配送管理表データが応答にありません');

      const label=chooseActiveYearMonth(allSheets);
      const sheets=selectedSheetsForMonth(allSheets,label);
      validateMonthSheets(sheets,label);
      sheets.forEach(s=>mergeGoogleDeliverySheet(s.sheetName||s.name,normalizeMonthValues(s.values,label)));
      pruneWorkbookToMonth(label);

      // Google Sheets を正本にする。取得直後に古いローカル補正を重ねない。
      await persistMigratedWorkbook();
      setupSheetSelect();
      renderWorkbook();
      updateMonthLabels(label);
      lastSyncAt=Date.now();
      window.dispatchEvent(new CustomEvent('jarvis-delivery-synced',{detail:{at:lastSyncAt,sheets:sheets.length,yearMonth:label}}));
      if($('workbookStatus')) $('workbookStatus').textContent=`✓ ${label} ${sheets.length}配送管理表をGoogle正本と同期しました`;
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
    const now=tokyoNow();
    updateMonthLabels(ymLabel(now.year,now.month));
    setTimeout(refreshIfSafe,1400);
    setInterval(refreshIfSafe,AUTO_REFRESH_MS);
  });
  window.addEventListener('focus',refreshIfSafe);
  document.addEventListener('visibilitychange',()=>{if(!document.hidden) refreshIfSafe();});
})();