(function(){
  'use strict';

  const TARGET_NAME='秋山製麺';
  const FULL_START=8*60;
  const FULL_END=12*60;
  const DRIVER_FULL=9000;
  const COMPANY_FULL=11000;
  const DRIVER_STEP=1000;
  const COMPANY_STEP=1250;

  function norm(v){
    return String(v||'').replace(/\u3000/g,' ').replace(/\s+/g,' ').trim();
  }
  function isAkiyama(name){ return norm(name).includes(TARGET_NAME); }

  function parseTimeToken(token){
    const t=String(token||'').trim();
    let m=t.match(/(\d{1,2})\s*[:：]\s*(\d{1,2})/);
    if(m){
      const h=Number(m[1]), min=Number(m[2]);
      if(h>=0&&h<=23&&min>=0&&min<=59) return h*60+min;
    }
    m=t.match(/(\d{1,2})\s*時\s*半/);
    if(m){ const h=Number(m[1]); if(h>=0&&h<=23) return h*60+30; }
    m=t.match(/(\d{1,2})\s*時\s*(\d{1,2})?\s*分?/);
    if(m){
      const h=Number(m[1]), min=m[2]==null?0:Number(m[2]);
      if(h>=0&&h<=23&&min>=0&&min<=59) return h*60+min;
    }
    return null;
  }

  function parseTimeRange(note){
    const s=String(note||'').trim();
    if(!s) return null;
    const tokens=s.match(/\d{1,2}\s*[:：]\s*\d{1,2}|\d{1,2}\s*時\s*半|\d{1,2}\s*時\s*\d{0,2}\s*分?/g)||[];
    const times=tokens.map(parseTimeToken).filter(v=>v!=null);
    if(times.length>=2) return {start:times[0],end:times[times.length-1]};
    if(times.length===1) return {start:FULL_START,end:times[0]};
    return null;
  }

  function calcPrices(range){
    if(!range) return null;
    const late=Math.max(0,range.start-FULL_START);
    const early=Math.max(0,FULL_END-range.end);
    const lateSteps=Math.floor(late/30);
    const earlySteps=early===0?0:Math.ceil(early/30);
    const steps=lateSteps+earlySteps;
    return {
      steps,lateSteps,earlySteps,
      driver:Math.max(0,DRIVER_FULL-steps*DRIVER_STEP),
      company:Math.max(0,COMPANY_FULL-steps*COMPANY_STEP)
    };
  }

  function rowInfo(sheetName,rowIndex){
    if(!window.WB||!window.XLSX||!WB.Sheets?.[sheetName]) return null;
    const aoa=XLSX.utils.sheet_to_json(WB.Sheets[sheetName],{header:1,defval:''});
    const h=aoa[2]||[];
    const noteCol=h.findIndex(x=>norm(x)==='備考');
    const drCol=h.findIndex(x=>norm(x)==='DR金額');
    const companyCol=h.findIndex(x=>norm(x)==='金額');
    if(noteCol<0||drCol<0||companyCol<0||rowIndex<3) return null;
    return {aoa,noteCol,drCol,companyCol};
  }

  async function persistWorkbook(){
    try{
      if(!window.WB||!window.XLSX||typeof window.saveWorkbookBytes!=='function') return;
      const buf=XLSX.write(WB,{bookType:'xlsx',type:'array'});
      await saveWorkbookBytes(buf,window.WB_NAME||'delivery.xlsx');
    }catch(e){ console.warn('Akiyama local persist skipped',e); }
  }

  async function applyPricing(sheetName,rowIndex,originalSave,writeRemote=true){
    if(!isAkiyama(sheetName)) return false;
    const info=rowInfo(sheetName,rowIndex);
    if(!info) return false;
    const note=info.aoa[rowIndex]?.[info.noteCol]??'';
    const range=parseTimeRange(note);
    const prices=calcPrices(range);
    if(!prices) return false;

    const currentDr=Number(info.aoa[rowIndex]?.[info.drCol]);
    const currentCompany=Number(info.aoa[rowIndex]?.[info.companyCol]);
    setWorkbookCellDirect(sheetName,rowIndex,info.drCol,prices.driver);
    setWorkbookCellDirect(sheetName,rowIndex,info.companyCol,prices.company);

    if(writeRemote && (currentDr!==prices.driver || currentCompany!==prices.company)){
      const drAddr=XLSX.utils.encode_cell({r:rowIndex,c:info.drCol});
      const companyAddr=XLSX.utils.encode_cell({r:rowIndex,c:info.companyCol});
      if(currentDr!==prices.driver) await originalSave(sheetName,drAddr,[[prices.driver]]);
      if(currentCompany!==prices.company) await originalSave(sheetName,companyAddr,[[prices.company]]);
    }
    await persistWorkbook();
    try{renderWorkbook();}catch(_){}
    return true;
  }

  function isNoteRange(sheetName,range){
    if(!isAkiyama(sheetName)||!window.WB||!window.XLSX||!WB.Sheets?.[sheetName]) return null;
    try{
      const cell=XLSX.utils.decode_cell(String(range||'').split(':')[0]);
      const info=rowInfo(sheetName,cell.r);
      if(!info||cell.c!==info.noteCol) return null;
      return cell.r;
    }catch(_){ return null; }
  }

  async function recalcAllFromGoogle(){
    if(!window.WB||!window.XLSX||typeof window.saveGoogleDeliveryRange!=='function') return;
    const sheetName=(WB.SheetNames||[]).find(isAkiyama);
    if(!sheetName) return;
    const aoa=XLSX.utils.sheet_to_json(WB.Sheets[sheetName],{header:1,defval:''});
    const original=window.saveGoogleDeliveryRange.__akiyamaOriginal || window.saveGoogleDeliveryRange;
    for(let r=3;r<aoa.length;r++){
      try{await applyPricing(sheetName,r,original,true);}catch(e){console.warn('Akiyama recalc row failed',r,e);}
    }
    const status=document.getElementById('workbookStatus');
    if(status) status.textContent='✓ 秋山製麺：開始・終了時刻を認識して料金まで自動同期しました';
  }

  function install(){
    if(typeof window.saveGoogleDeliveryRange!=='function'){
      setTimeout(install,250);
      return;
    }
    if(window.saveGoogleDeliveryRange.__akiyamaWrapped) return;
    const original=window.saveGoogleDeliveryRange;
    const wrapped=async function(sheetName,range,values){
      const result=await original(sheetName,range,values);
      const row=isNoteRange(sheetName,range);
      if(row!=null){
        try{await applyPricing(sheetName,row,original,true);}catch(e){
          console.error('Akiyama pricing save failed',e);
          const status=document.getElementById('workbookStatus');
          if(status) status.textContent='秋山製麺の料金自動計算に失敗しました：'+(e?.message||e);
        }
      }
      return result;
    };
    wrapped.__akiyamaWrapped=true;
    wrapped.__akiyamaOriginal=original;
    window.saveGoogleDeliveryRange=wrapped;
    try{saveGoogleDeliveryRange=wrapped;}catch(_){}
  }

  window.addEventListener('jarvis-delivery-synced',()=>{setTimeout(recalcAllFromGoogle,50);});
  install();
})();
