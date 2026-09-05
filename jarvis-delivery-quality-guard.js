/* JARVIS delivery accounting data-quality guard */
(function(){
  'use strict';

  const norm=v=>String(v??'').replace(/\u3000/g,' ').replace(/\s+/g,' ').trim();
  const tokyoParts=()=>{
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const o=Object.fromEntries(parts.map(p=>[p.type,p.value]));
    return {year:Number(o.year),month:Number(o.month),day:Number(o.day)};
  };
  const ymLabel=(y,m)=>`${y}年${m}月`;
  const currentTarget=()=>{const p=tokyoParts();return {year:p.year,month:p.month,label:ymLabel(p.year,p.month)}};
  const previousTarget=()=>{const p=tokyoParts();let y=p.year,m=p.month-1;if(m<1){m=12;y--;}return {year:y,month:m,label:ymLabel(y,m)}};
  const sheetTarget=name=>{const m=norm(name).match(/(20\d{2})年\s*(\d{1,2})月/);return m?{year:Number(m[1]),month:Number(m[2]),label:ymLabel(Number(m[1]),Number(m[2]))}:null;};
  const rowDate=v=>{
    const s=norm(v);
    let m=s.match(/^(\d{1,2})月\s*(\d{1,2})日/); if(m) return {month:Number(m[1]),day:Number(m[2])};
    m=s.match(/^20\d{2}[-\/]([01]?\d)[-\/]([0-3]?\d)/); if(m) return {month:Number(m[1]),day:Number(m[2])};
    return null;
  };
  const errorText=v=>/^(#REF!|#VALUE!|#N\/A|#DIV\/0!|#NAME\?|#NUM!|#NULL!)$/i.test(norm(v));
  const specialOwner=/カメレオン|福羅興業|sitycanvas|オーロラネクスト/i;
  const isZero=v=>{const s=norm(v).replace(/[,￥¥円]/g,'');return s!==''&&Number(s)===0;};
  const daysInMonth=(y,m)=>new Date(y,m,0).getDate();

  function findHeader(values){
    for(let i=0;i<Math.min(values.length,20);i++){
      const row=(values[i]||[]).map(norm);
      if(row.includes('走行日')&&row.some(x=>x==='DR'||x.includes('ドライバー'))) return {index:i,row};
    }
    return null;
  }
  function findCol(row,names){
    for(const name of names){const i=row.findIndex(x=>x===name||x.includes(name));if(i>=0)return i;}
    return -1;
  }

  function inspectSheet(sheet,target){
    const name=norm(sheet.sheetName||sheet.name);
    const values=Array.isArray(sheet.values)?sheet.values:[];
    const issue={sheetName:name,yearMonth:target.label,staleRows:0,formulaErrors:0,duplicateRows:0,zeroBlankFields:0,specialDrAmountViolations:0,monthEndPresent:false,dataRows:0};
    values.forEach(row=>(Array.isArray(row)?row:[]).forEach(v=>{if(errorText(v))issue.formulaErrors++;}));

    const h=findHeader(values);
    if(!h) return issue;
    const dateI=findCol(h.row,['走行日','日付']);
    const drI=findCol(h.row,['DR','ドライバー']);
    const workI=findCol(h.row,['業務名','案件名']);
    const drAmountI=findCol(h.row,['DR金額','ドライバー金額']);
    const noteI=findCol(h.row,['備考','所属']);
    const deductionCols=h.row.map((x,i)=>/天引|フォロー/.test(x)?i:-1).filter(i=>i>=0);
    const seen=new Set();
    const lastDay=daysInMonth(target.year,target.month);

    for(let r=h.index+1;r<values.length;r++){
      const row=values[r]||[];
      const dr=drI>=0?norm(row[drI]):'';
      const work=workI>=0?norm(row[workI]):'';
      if(!dr&&!work) continue;
      issue.dataRows++;
      const d=dateI>=0?rowDate(row[dateI]):null;
      if(d&&d.month!==target.month) issue.staleRows++;
      if(d&&d.month===target.month&&d.day===lastDay) issue.monthEndPresent=true;

      // Accounting duplicate rule: one date + driver + business row is unique regardless of an accidentally different actual/payment value.
      const key=[d?`${d.month}-${d.day}`:norm(row[dateI]),dr,work].join('|');
      if(seen.has(key)) issue.duplicateRows++; else seen.add(key);

      deductionCols.forEach(i=>{if(isZero(row[i]))issue.zeroBlankFields++;});
      const owner=noteI>=0?norm(row[noteI]):'';
      if(specialOwner.test(owner)&&drAmountI>=0&&norm(row[drAmountI])!=='') issue.specialDrAmountViolations++;
    }
    return issue;
  }

  function inspect(){
    const cache=Array.isArray(window.JARVIS_DELIVERY_SHEET_CACHE)?window.JARVIS_DELIVERY_SHEET_CACHE:[];
    const targets=[previousTarget(),currentTarget()];
    const reports=targets.map(target=>{
      const sheets=cache.filter(s=>sheetTarget(s.sheetName||s.name)?.label===target.label);
      const sheetIssues=sheets.map(s=>inspectSheet(s,target));
      const isClosedMonth=target.label===previousTarget().label;
      // Previous/closed month must reach the calendar month end whenever the tab has accounting rows.
      const blocking=sheetIssues.filter(x=>x.staleRows||x.formulaErrors||x.duplicateRows||x.zeroBlankFields||x.specialDrAmountViolations||(isClosedMonth&&x.dataRows>0&&!x.monthEndPresent));
      return {yearMonth:target.label,sheetCount:sheets.length,issues:blocking,details:sheetIssues,ok:sheets.length>0&&blocking.length===0};
    });

    const report={checkedAt:new Date().toISOString(),reports,ok:reports.every(r=>r.ok)};
    window.JARVIS_DELIVERY_DATA_QUALITY=report;

    const status=document.getElementById('workbookStatus');
    const bad=reports.flatMap(r=>r.issues.map(x=>({...x,yearMonth:r.yearMonth})));
    if(status&&bad.length){
      const stale=bad.reduce((n,x)=>n+x.staleRows,0);
      const errors=bad.reduce((n,x)=>n+x.formulaErrors,0);
      const dup=bad.reduce((n,x)=>n+x.duplicateRows,0);
      const zero=bad.reduce((n,x)=>n+x.zeroBlankFields,0);
      const special=bad.reduce((n,x)=>n+x.specialDrAmountViolations,0);
      const monthEnd=bad.filter(x=>x.dataRows>0&&!x.monthEndPresent).length;
      status.textContent=`⚠ 経理品質: 月外実績 ${stale} / 数式エラー ${errors} / 重複 ${dup} / 天引き・フォロー0 ${zero} / 特殊DR金額 ${special} / 月末未到達 ${monthEnd}タブ`;
    }
    if(bad.length) console.warn('[JARVIS ACCOUNTING QUALITY]',report);
    window.dispatchEvent(new CustomEvent('jarvis-accounting-quality',{detail:report}));
    return report;
  }

  window.addEventListener('jarvis-delivery-synced',()=>setTimeout(inspect,100));
  document.addEventListener('DOMContentLoaded',()=>setTimeout(inspect,2500));
  setInterval(inspect,60000);
  window.JARVIS_DELIVERY_QUALITY_GUARD={inspect};
})();