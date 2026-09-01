/* JARVIS V7.0.7 Google master sync hotfix */
(function(){
  'use strict';

  function apiBaseUrl(){
    return typeof GAS_API_URL==='string'?GAS_API_URL:'';
  }

  function isWorkerBase(){
    return /workers\.dev|t-ups2024\.work/i.test(apiBaseUrl());
  }

  function gasActionUrl(action){
    const base=apiBaseUrl();
    if(!base) return '';
    return base+(base.includes('?')?'&':'?')+'action='+encodeURIComponent(action)+'&_='+Date.now();
  }

  function workerUrl(path){
    const base=apiBaseUrl().replace(/\/$/,'');
    return base+path;
  }

  async function readJson(response){
    const text=await response.text();
    let result;
    try{result=JSON.parse(text);}catch(_){
      const preview=text.slice(0,160).replace(/\s+/g,' ');
      throw new Error('APIがJSONを返していません: '+preview);
    }
    if(!response.ok) throw new Error(result?.error||('API error '+response.status));
    return result;
  }

  function ensureSuccess(result){
    if(result?.success===false) throw new Error(result?.error||'APIでエラーが発生しました');
    return result;
  }

  function extractSheets(result){
    const data=result?.data??result;
    if(Array.isArray(data)) return data;
    if(Array.isArray(data?.sheets)) return data.sheets;
    if(data?.sheets&&typeof data.sheets==='object') return Object.entries(data.sheets).map(([sheetName,v])=>({sheetName,values:Array.isArray(v)?v:v?.values}));
    if(data?.sheetName&&Array.isArray(data.values)) return [data];
    if(Array.isArray(data?.values)) return [{sheetName:data.sheetName||'',values:data.values}];
    return [];
  }

  saveGoogleDeliveryRange=async function(sheetName,range,values){
    if(!apiBaseUrl()) throw new Error('配送管理表APIが設定されていません');
    let response;
    if(isWorkerBase()){
      response=await fetch(workerUrl('/delivery/save'),{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({sheetName,range,values})
      });
    }else{
      const action='saveDeliveryData';
      response=await fetch(gasActionUrl(action),{
        method:'POST',
        headers:{'Content-Type':'text/plain;charset=utf-8'},
        body:JSON.stringify({action,sheetName,range,values})
      });
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
      sheets.forEach(s=>mergeGoogleDeliverySheet(s.sheetName||s.name,s.values));
      normalizeBlankMoneyDefaults();
      applyManualWorkbookOverrides();
      applyNoAutoPayRows();
      await persistMigratedWorkbook();
      setupSheetSelect();
      renderWorkbook();
      if($('workbookStatus')) $('workbookStatus').textContent='✓ Google配送管理表と同期しました';
      return true;
    }catch(e){
      console.error('delivery fetch failed',e);
      if($('workbookStatus')) $('workbookStatus').textContent='Google配送管理表の取得に失敗しました（JARVIS内データは保持）：'+(e?.message||e);
      return false;
    }finally{
      WB_GOOGLE_IMPORTING=false;
    }
  };

  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(()=>{try{fetchGoogleDelivery(true);}catch(_){}},1400);
  });
})();
