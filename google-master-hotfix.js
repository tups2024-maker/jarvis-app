/* JARVIS V7.0.7 Google master sync hotfix */
(function(){
  'use strict';

  function gasBaseUrl(){
    return typeof GAS_API_URL==='string'?GAS_API_URL:'';
  }

  function gasActionUrl(action){
    const base=gasBaseUrl();
    if(!base) return '';
    return base+(base.includes('?')?'&':'?')+'action='+encodeURIComponent(action)+'&_='+Date.now();
  }

  async function readJson(response){
    const text=await response.text();
    let result;
    try{result=JSON.parse(text);}catch(_){
      const preview=text.slice(0,160).replace(/\s+/g,' ');
      throw new Error('Google APIがJSONを返していません: '+preview);
    }
    if(!response.ok) throw new Error(result?.error||('Google API error '+response.status));
    return result;
  }

  function ensureSuccess(result){
    if(result?.success===false) throw new Error(result?.error||'Google APIでエラーが発生しました');
    return result;
  }

  function extractSheets(result){
    const data=result?.data??result;
    if(Array.isArray(data)) return data;
    if(Array.isArray(data?.sheets)) return data.sheets;
    if(data?.sheets&&typeof data.sheets==='object') return Object.entries(data.sheets).map(([sheetName,v])=>({sheetName,values:Array.isArray(v)?v:v?.values}));
    if(data?.sheetName&&Array.isArray(data.values)) return [data];
    return [];
  }

  saveGoogleDeliveryRange=async function(sheetName,range,values){
    if(!gasBaseUrl()) throw new Error('配送管理表APIが設定されていません');
    const actions=['delivery_save','saveDelivery','deliverySave','save_delivery'];
    let lastError=null;
    for(const action of actions){
      try{
        const response=await fetch(gasActionUrl(action),{
          method:'POST',
          headers:{'Content-Type':'text/plain;charset=utf-8'},
          body:JSON.stringify({action,sheetName,range,values})
        });
        const result=ensureSuccess(await readJson(response));
        if(result?.success===true || result?.saved===true || result?.updated===true || result?.range || result?.data) return result;
        lastError=new Error('保存APIの応答形式を確認できません');
      }catch(e){
        lastError=e;
      }
    }
    throw lastError||new Error('Google配送管理表の保存に失敗しました');
  };

  fetchGoogleDelivery=async function(silent=false){
    if(workbookEditingOrDirty()||WB_GOOGLE_IMPORTING)return false;
    if(!gasBaseUrl())return false;
    WB_GOOGLE_IMPORTING=true;
    try{
      const actions=['delivery','getDelivery','delivery_get'];
      let sheets=[];
      let lastError=null;
      for(const action of actions){
        try{
          const response=await fetch(gasActionUrl(action),{cache:'no-store'});
          const result=ensureSuccess(await readJson(response));
          sheets=extractSheets(result);
          if(sheets.length) break;
          lastError=new Error('配送管理表データが応答にありません');
        }catch(e){
          lastError=e;
        }
      }
      if(!sheets.length) throw lastError||new Error('Google配送管理表を取得できませんでした');
      sheets.forEach(s=>mergeGoogleDeliverySheet(s.sheetName||s.name,s.values));
      normalizeBlankMoneyDefaults();
      applyManualWorkbookOverrides();
      applyNoAutoPayRows();
      await persistMigratedWorkbook();
      setupSheetSelect();
      renderWorkbook();
      if(!silent&&$('workbookStatus'))$('workbookStatus').textContent='✓ 元のGoogle配送管理表から最新データを取得しました';
      return true;
    }catch(e){
      console.error('delivery fetch failed',e);
      if($('workbookStatus'))$('workbookStatus').textContent='Google配送管理表の取得に失敗しました（JARVIS内データは保持）：'+(e?.message||e);
      return false;
    }finally{
      WB_GOOGLE_IMPORTING=false;
    }
  };

  document.addEventListener('DOMContentLoaded',()=>{
    setTimeout(()=>{try{fetchGoogleDelivery(true);}catch(_){}},1400);
  });
})();
