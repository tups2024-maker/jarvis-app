/* JARVIS delivery accounting data-quality guard */
(function(){
  'use strict';

  const norm=v=>String(v??'').replace(/\u3000/g,' ').replace(/\s+/g,' ').trim();
  const tokyoParts=()=>{
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const o=Object.fromEntries(parts.map(p=>[p.type,p.value]));
    return {year:Number(o.year),month:Number(o.month),day:Number(o.day)};
  };
  const targetLabel=()=>{const p=tokyoParts();return `${p.year}年${p.month}月`;};
  const sheetYM=name=>{const m=norm(name).match(/(20\d{2})年\s*(\d{1,2})月/);return m?`${Number(m[1])}年${Number(m[2])}月`:'';};
  const rowMonth=v=>{
    const s=norm(v);
    let m=s.match(/^(\d{1,2})月\s*(\d{1,2})日/); if(m) return Number(m[1]);
    m=s.match(/^20\d{2}[-\/]([01]?\d)[-\/]/); if(m) return Number(m[1]);
    return null;
  };
  const errorText=v=>/^(#REF!|#VALUE!|#N\/A|#DIV\/0!|#NAME\?|#NUM!|#NULL!)$/i.test(norm(v));

  function inspect(){
    const cache=Array.isArray(window.JARVIS_DELIVERY_SHEET_CACHE)?window.JARVIS_DELIVERY_SHEET_CACHE:[];
    const label=targetLabel();
    const expectedMonth=tokyoParts().month;
    const current=cache.filter(s=>sheetYM(s.sheetName||s.name)===label);
    const issues=[];

    current.forEach(sheet=>{
      const name=norm(sheet.sheetName||sheet.name);
      const values=Array.isArray(sheet.values)?sheet.values:[];
      let staleRows=0, formulaErrors=0;
      values.forEach((row,idx)=>{
        if(!Array.isArray(row)) return;
        const m=rowMonth(row[0]);
        const hasActual=norm(row[1])||norm(row[2]);
        if(idx>=3&&m!==null&&m!==expectedMonth&&hasActual) staleRows++;
        row.forEach(v=>{if(errorText(v)) formulaErrors++;});
      });
      if(staleRows||formulaErrors) issues.push({sheetName:name,staleRows,formulaErrors});
    });

    const report={yearMonth:label,checkedAt:new Date().toISOString(),sheetCount:current.length,issues,ok:issues.length===0};
    window.JARVIS_DELIVERY_DATA_QUALITY=report;

    const status=document.getElementById('workbookStatus');
    if(status&&issues.length){
      const stale=issues.reduce((n,x)=>n+x.staleRows,0);
      const errors=issues.reduce((n,x)=>n+x.formulaErrors,0);
      status.textContent=`⚠ ${label} 経理品質チェック: 前月残骸 ${stale}行 / 数式エラー ${errors}件。Google正本を要確認`;
    }
    if(issues.length) console.warn('[JARVIS ACCOUNTING QUALITY]',report);
    window.dispatchEvent(new CustomEvent('jarvis-accounting-quality',{detail:report}));
    return report;
  }

  window.addEventListener('jarvis-delivery-synced',()=>setTimeout(inspect,100));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(inspect,2500));
  setInterval(inspect,60000);
  window.JARVIS_DELIVERY_QUALITY_GUARD={inspect};
})();
