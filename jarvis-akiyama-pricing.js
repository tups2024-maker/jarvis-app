(function(){
  'use strict';

  const TARGET_NAME='秋山製麺';
  const FULL_END=12*60;
  const MIN_END=8*60;
  const DRIVER_FULL=9000;
  const COMPANY_FULL=11000;
  const DRIVER_STEP=1000;
  const COMPANY_STEP=1250;

  function norm(v){
    return String(v||'').replace(/\u3000/g,' ').replace(/\s+/g,' ').trim();
  }

  function isAkiyama(name){
    return norm(name).includes(TARGET_NAME);
  }

  function parseTimeToken(token){
    const t=String(token||'').trim();
    let m=t.match(/(?:^|\D)(\d{1,2})\s*[:：]\s*(\d{1,2})(?:\D|$)/);
    if(m){
      const h=Number(m[1]), min=Number(m[2]);
      if(h>=0&&h<=23&&min>=0&&min<=59) return h*60+min;
    }
    m=t.match(/(?:^|\D)(\d{1,2})\s*時\s*(\d{1,2})?\s*分?(?:\D|$)/);
    if(m){
      const h=Number(m[1]), min=m[2]==null?0:Number(m[2]);
      if(h>=0&&h<=23&&min>=0&&min<=59) return h*60+min;
    }
    m=t.match(/(?:^|\D)(\d{1,2})\s*時\s*半(?:\D|$)/);
    if(m){
      const h=Number(m[1]);
      if(h>=0&&h<=23) return h*60+30;
    }
    return null;
  }

  function parseEndMinutes(note){
    const s=String(note||'').trim();
    if(!s) return null;
    const matches=[];
    const re=/(\d{1,2}\s*[:：]\s*\d{1,2}|\d{1,2}\s*時\s*半|\d{1,2}\s*時\s*\d{0,2}\s*分?)/g;
    let m;
    while((m=re.exec(s))){
      const minutes=parseTimeToken(m[1]);
      if(minutes!=null) matches.push(minutes);
    }
    if(matches.length) return matches[matches.length-1];
    return parseTimeToken(s);
  }

  function calcPrices(endMinutes){
    if(endMinutes==null) return null;
    const clamped=Math.max(MIN_END,Math.min(FULL_END,endMinutes));
    const diff=Math.max(0,FULL_END-clamped);
    const steps=diff===0?0:Math.ceil(diff/30);
    return {
      steps,
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
    return {aoa,h,noteCol,drCol,companyCol};
  }

  async function persistWorkbook(){
    try{
      if(!window.WB||!window.XLSX||typeof window.saveWorkbookBytes!=='function') return;
      const buf=XLSX.write(WB,{bookType:'xlsx',type:'array'});
      await saveWorkbookBytes(buf,window.WB_NAME||'delivery.xlsx');
    }catch(e){
      console.warn('Akiyama local persist skipped',e);
    }
  }

  async function applyPricing(sheetName,rowIndex,originalSave){
    if(!isAkiyama(sheetName)) return false;
    const info=rowInfo(sheetName,rowIndex);
    if(!info) return false;
    const note=info.aoa[rowIndex]?.[info.noteCol]??'';
    const end=parseEndMinutes(note);
    const prices=calcPrices(end);
    if(!prices) return false;

    setWorkbookCellDirect(sheetName,rowIndex,info.drCol,prices.driver);
    setWorkbookCellDirect(sheetName,rowIndex,info.companyCol,prices.company);

    const drAddr=XLSX.utils.encode_cell({r:rowIndex,c:info.drCol});
    const companyAddr=XLSX.utils.encode_cell({r:rowIndex,c:info.companyCol});
    await originalSave(sheetName,drAddr,[[prices.driver]]);
    await originalSave(sheetName,companyAddr,[[prices.company]]);
    await persistWorkbook();
    try{renderWorkbook();}catch(_){}

    const status=document.getElementById('workbookStatus');
    if(status){
      status.textContent=`✓ 秋山製麺：備考の終了時刻から自動計算（DR ${prices.driver.toLocaleString()}円 / 会社 ${prices.company.toLocaleString()}円）`;
    }
    return true;
  }

  function isNoteRange(sheetName,range){
    if(!isAkiyama(sheetName)||!window.WB||!window.XLSX||!WB.Sheets?.[sheetName]) return null;
    try{
      const cell=XLSX.utils.decode_cell(String(range||'').split(':')[0]);
      const info=rowInfo(sheetName,cell.r);
      if(!info||cell.c!==info.noteCol) return null;
      return cell.r;
    }catch(_){
      return null;
    }
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
        try{await applyPricing(sheetName,row,original);}catch(e){
          console.error('Akiyama pricing save failed',e);
          const status=document.getElementById('workbookStatus');
          if(status) status.textContent='秋山製麺の料金自動計算に失敗しました：'+(e?.message||e);
        }
      }
      return result;
    };
    wrapped.__akiyamaWrapped=true;
    window.saveGoogleDeliveryRange=wrapped;
    try{saveGoogleDeliveryRange=wrapped;}catch(_){}
  }

  install();
})();
