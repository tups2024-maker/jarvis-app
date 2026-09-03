/* JARVIS V7.0.8 Google-backed previous-month KPI history fix */
(function(){
  'use strict';

  let loading=false;
  let lastLoaded='';

  const norm=v=>String(v||'').replace(/\u3000/g,' ').replace(/\s+/g,' ').trim();
  function apiBase(){ return typeof GAS_API_URL==='string'?GAS_API_URL.replace(/\/$/,''):''; }
  function isWorker(){ return /workers\.dev|t-ups2024\.work/i.test(apiBase()); }
  function tokyoYM(offset=0){
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit'}).formatToParts(new Date());
    let y=Number(parts.find(p=>p.type==='year')?.value||0);
    let m=Number(parts.find(p=>p.type==='month')?.value||0)+offset;
    while(m<1){m+=12;y--;} while(m>12){m-=12;y++;}
    return {year:y,month:m,label:`${y}年${m}月`,ym:`${y}-${String(m).padStart(2,'0')}`};
  }
  function parseSheetMonth(name){
    const m=norm(name).match(/(20\d{2})年\s*(\d{1,2})月/);
    return m?`${Number(m[1])}-${String(Number(m[2])).padStart(2,'0')}`:'';
  }
  function extractSheets(result){
    const data=result?.data??result;
    if(Array.isArray(data)) return data;
    if(Array.isArray(data?.sheets)) return data.sheets;
    if(data?.sheets&&typeof data.sheets==='object') return Object.entries(data.sheets).map(([sheetName,v])=>({sheetName,values:Array.isArray(v)?v:v?.values}));
    return [];
  }
  async function readJson(response){
    const text=await response.text();
    let result; try{result=JSON.parse(text);}catch(_){throw new Error('配送管理APIがJSONを返していません');}
    if(!response.ok||result?.success===false) throw new Error(result?.error||`API ${response.status}`);
    return result;
  }
  async function loadPreviousMonth(){
    if(loading||!apiBase()||typeof window.mergeGoogleDeliverySheet!=='function') return false;
    const prev=tokyoYM(-1);
    if(lastLoaded===prev.ym && window.WB?.SheetNames?.some(n=>parseSheetMonth(n)===prev.ym)){
      window.JARVIS_MONTH_SYNC?.refresh?.();
      return true;
    }
    loading=true;
    try{
      const url=isWorker()?`${apiBase()}/delivery`:`${apiBase()}${apiBase().includes('?')?'&':'?'}action=getDeliveryData&_=${Date.now()}`;
      const result=await readJson(await fetch(url,{cache:'no-store'}));
      const sheets=extractSheets(result).filter(s=>parseSheetMonth(s.sheetName||s.name)===prev.ym);
      if(!sheets.length) throw new Error(`${prev.label}の配送管理表が取得できません`);
      sheets.forEach(s=>window.mergeGoogleDeliverySheet(s.sheetName||s.name,s.values||[]));
      lastLoaded=prev.ym;
      window.JARVIS_GOOGLE_HISTORY={previousMonth:prev.ym,sheets:sheets.length,loadedAt:Date.now()};
      setTimeout(()=>window.JARVIS_MONTH_SYNC?.refresh?.(),50);
      return true;
    }catch(e){
      console.warn('[JARVIS MONTH HISTORY] previous month load failed',e);
      return false;
    }finally{loading=false;}
  }

  window.addEventListener('jarvis-delivery-synced',()=>setTimeout(loadPreviousMonth,100));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(loadPreviousMonth,2200));
  window.JARVIS_LOAD_PREVIOUS_MONTH=loadPreviousMonth;
})();
