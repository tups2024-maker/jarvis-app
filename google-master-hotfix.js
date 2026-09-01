/* JARVIS V7.0.7 Google master sync hotfix */
(function(){
  'use strict';

  async function parseJsonResponse(response){
    const text=await response.text();
    let result;
    try{result=JSON.parse(text);}catch(_){
      const preview=text.slice(0,160).replace(/\s+/g,' ');
      throw new Error('Google APIがJSONを返していません: '+preview);
    }
    if(!response.ok||!result?.success) throw new Error(result?.error||('Google API error '+response.status));
    return result;
  }

  saveGoogleDeliveryRange=async function(sheetName,range,values){
    const url=deliveryApiUrl('/delivery/save');
    if(!url) throw new Error('配送管理表APIが設定されていません');
    const response=await fetch(url,{
      method:'POST',
      headers:{'Content-Type':'text/plain;charset=utf-8'},
      body:JSON.stringify({sheetName,range,values})
    });
    return parseJsonResponse(response);
  };

  fetchGoogleDelivery=async function(silent=false){
    if(workbookEditingOrDirty()||WB_GOOGLE_IMPORTING)return false;
    const url=deliveryApiUrl('/delivery');
    if(!url)return false;
    WB_GOOGLE_IMPORTING=true;
    try{
      const response=await fetch(url,{cache:'no-store'});
      const result=await parseJsonResponse(response);
      const data=result.data??result;
      let sheets=[];
      if(Array.isArray(data))sheets=data;
      else if(Array.isArray(data?.sheets))sheets=data.sheets;
      else if(data?.sheets&&typeof data.sheets==='object')sheets=Object.entries(data.sheets).map(([sheetName,v])=>({sheetName,values:Array.isArray(v)?v:v?.values}));
      else if(data?.sheetName&&Array.isArray(data.values))sheets=[data];
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
