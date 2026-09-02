(function(){
  'use strict';

  const originalFetch=window.fetch.bind(window);

  function monthFromSheetName(name){
    const m=String(name||'').match(/(\d{4})年\s*(\d{1,2})月/);
    return m?{year:Number(m[1]),month:Number(m[2])}:null;
  }

  function monthFromValue(value){
    if(value===null||value===undefined||value==='') return null;
    const s=String(value).trim();
    let m=s.match(/^(\d{4})[-\/]([01]?\d)[-\/](\d{1,2})/);
    if(m) return {year:Number(m[1]),month:Number(m[2])};
    m=s.match(/^(\d{1,2})月\s*(\d{1,2})日/);
    if(m) return {year:null,month:Number(m[1])};
    return null;
  }

  function isHeaderRow(row,index){
    if(index<3) return true;
    const a=String(row?.[0]??'').trim();
    return a==='走行日'||a==='';
  }

  function sanitizeSheet(sheet,audit){
    if(!sheet||!Array.isArray(sheet.values)) return sheet;
    const expected=monthFromSheetName(sheet.sheetName||sheet.sourceSheetName);
    if(!expected) return sheet;

    const values=sheet.values.map((row,index)=>{
      if(!Array.isArray(row)||isHeaderRow(row,index)) return row;
      const actual=monthFromValue(row[0]);
      if(!actual) return row;
      const wrongMonth=actual.month!==expected.month;
      const wrongYear=actual.year!==null&&actual.year!==expected.year;
      if(!wrongMonth&&!wrongYear) return row;

      audit.push({
        sheetName:sheet.sheetName||sheet.sourceSheetName||'',
        row:index+1,
        value:row[0],
        expected:`${expected.year}-${String(expected.month).padStart(2,'0')}`
      });
      return new Array(row.length).fill('');
    });

    return {...sheet,values};
  }

  function sanitizeDeliveryPayload(payload){
    if(!payload||typeof payload!=='object') return payload;
    const audit=[];
    const data=payload.data&&typeof payload.data==='object'?payload.data:payload;
    if(Array.isArray(data.sheets)){
      data.sheets=data.sheets.map(sheet=>sanitizeSheet(sheet,audit));
    }
    if(audit.length){
      window.JARVIS_DATE_SYNC_ERRORS=audit;
      console.error('[JARVIS DATE SYNC] 月ズレを検出し表示対象から除外しました',audit);
    }else{
      window.JARVIS_DATE_SYNC_ERRORS=[];
    }
    return payload;
  }

  function requestBody(input,init){
    if(!init||typeof init.body!=='string') return null;
    try{return JSON.parse(init.body);}catch(_){return null;}
  }

  function validateDeliverySave(body){
    if(!body||!body.sheetName||!body.range||!Array.isArray(body.values)) return;
    const expected=monthFromSheetName(body.sheetName);
    if(!expected) return;

    const startCol=String(body.range).replace(/\$/g,'').match(/^([A-Z]+)/i)?.[1]?.toUpperCase();
    if(startCol!=='A') return;

    for(const row of body.values){
      if(!Array.isArray(row)||row.length===0) continue;
      const actual=monthFromValue(row[0]);
      if(!actual) continue;
      if(actual.month!==expected.month||(actual.year!==null&&actual.year!==expected.year)){
        throw new Error(`日付と配送管理表の月が一致しません: ${body.sheetName} / ${row[0]}`);
      }
    }
  }

  window.fetch=async function(input,init){
    const url=typeof input==='string'?input:(input&&input.url)||'';
    const method=String(init?.method||'GET').toUpperCase();

    if(url.includes('/delivery/save')&&method==='POST'){
      validateDeliverySave(requestBody(input,init));
    }

    const response=await originalFetch(input,init);

    if(url.includes('/delivery')&&!url.includes('/delivery/save')&&method==='GET'){
      try{
        const clone=response.clone();
        const json=await clone.json();
        const sanitized=sanitizeDeliveryPayload(json);
        return new Response(JSON.stringify(sanitized),{
          status:response.status,
          statusText:response.statusText,
          headers:{'Content-Type':'application/json'}
        });
      }catch(error){
        console.warn('[JARVIS DATE SYNC] delivery応答の検査をスキップ',error);
      }
    }

    return response;
  };

  window.JARVIS_DATE_SYNC={
    monthFromSheetName,
    monthFromValue,
    sanitizeDeliveryPayload,
    getErrors:()=>window.JARVIS_DATE_SYNC_ERRORS||[]
  };
})();
