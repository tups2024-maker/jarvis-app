/* JARVIS current month + previous month KPI patch */
(function(){
  'use strict';

  const TZ='Asia/Tokyo';
  const nowParts=()=>{
    const parts=new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());
    const v=Object.fromEntries(parts.map(p=>[p.type,p.value]));
    return {year:Number(v.year),month:Number(v.month),day:Number(v.day)};
  };
  const ym=(y,m)=>`${y}-${String(m).padStart(2,'0')}`;
  const currentYM=()=>{const p=nowParts();return ym(p.year,p.month)};
  const previousYM=()=>{const p=nowParts();let y=p.year,m=p.month-1;if(m<1){m=12;y--;}return ym(y,m)};
  const jpMonth=s=>{const [y,m]=s.split('-').map(Number);return `${y}年${m}月`};
  const norm=v=>String(v??'').replace(/\u3000/g,' ').replace(/\s+/g,' ').trim();
  const money=v=>{const n=Number(String(v??'').replace(/[¥￥,\s円]/g,''));return Number.isFinite(n)?n:0};
  const pct=(curr,prev)=> prev===0 ? (curr===0?0:null) : ((curr-prev)/Math.abs(prev))*100;
  const signedYen=n=>`${n>=0?'+':'-'}¥${Math.abs(Math.round(n)).toLocaleString('ja-JP')}`;
  const signedPct=n=>n===null?'—':`${n>=0?'+':''}${n.toFixed(1)}%`;

  window.JARVIS_ACTIVE_YEARMONTH=jpMonth(currentYM());
  window.JARVIS_CURRENT_YM=currentYM();
  window.JARVIS_PREVIOUS_YM=previousYM();

  function setShiftMonth(){
    const sel=document.getElementById('shiftMonth');
    if(!sel) return;
    const target=currentYM();
    let option=[...sel.options].find(o=>o.value===target);
    if(!option){
      option=document.createElement('option');
      option.value=target;
      option.textContent=jpMonth(target);
      sel.appendChild(option);
    }
    if(sel.value!==target){
      sel.value=target;
      sel.dispatchEvent(new Event('change',{bubbles:true}));
    }
  }

  // app-v7.js has a hard-coded August month counter. Replace it at runtime with active-month logic.
  try{
    window.driverMonthDays=function(d){
      const target=currentYM();
      const list=Array.isArray(window.ATT)?window.ATT:[];
      const name=norm(d?.name);
      const days=new Set(list.filter(a=>norm(a.driver)===name&&a.status==='出勤'&&String(a.date||'').startsWith(target)).map(a=>a.date));
      return days.size;
    };
  }catch(e){console.warn('[JARVIS MONTH] driverMonthDays override skipped',e)}

  function dateYM(v){
    if(v instanceof Date&&!isNaN(v)) return ym(v.getFullYear(),v.getMonth()+1);
    const s=norm(v);
    let m=s.match(/^(\d{4})[-\/]([01]?\d)[-\/]/); if(m) return ym(Number(m[1]),Number(m[2]));
    m=s.match(/^(\d{1,2})月(\d{1,2})日/); if(m){const p=nowParts(); return ym(p.year,Number(m[1]));}
    return '';
  }
  function sheetMonth(name){const m=String(name||'').match(/(\d{4})年\s*(\d{1,2})月/);return m?ym(Number(m[1]),Number(m[2])):''}
  function sheetValues(ws){
    try{return window.XLSX?.utils?.sheet_to_json?XLSX.utils.sheet_to_json(ws,{header:1,defval:'',raw:false}):[]}catch{return []}
  }
  function findHeader(values){
    for(let i=0;i<Math.min(values.length,15);i++){const row=(values[i]||[]).map(norm);if(row.includes('走行日')&&row.includes('DR'))return {i,row}}
    return null;
  }
  function col(row,names){for(const n of names){const i=row.findIndex(h=>h===n||h.includes(n));if(i>=0)return i}return -1}

  function workbookStats(targetYM){
    const wb=window.WB;
    const out={sales:0,gross:0,active:0};
    if(!wb?.SheetNames||!wb?.Sheets) return out;
    wb.SheetNames.filter(n=>sheetMonth(n)===targetYM).forEach(name=>{
      const values=sheetValues(wb.Sheets[name]); const h=findHeader(values); if(!h)return;
      const di=col(h.row,['走行日','日付']), dri=col(h.row,['DR','ドライバー']), bi=col(h.row,['業務名','案件名']);
      const dpi=col(h.row,['DR金額','ドライバー金額']); let si=col(h.row,['売上金額','請求金額','卸金額','会社金額']);
      if(si<0) si=h.row.findIndex((x,i)=>x==='金額'&&i!==dpi);
      const ai=col(h.row,['実績','稼働実績']);
      for(let r=h.i+1;r<values.length;r++){
        const row=values[r]||[]; if(di>=0&&dateYM(row[di])&&dateYM(row[di])!==targetYM)continue;
        if(!norm(row[dri])&&!norm(row[bi]))continue;
        const actual=ai>=0?money(row[ai]):1;
        if(actual>0) out.active+=actual;
        const sales=si>=0?money(row[si]):0, pay=dpi>=0?money(row[dpi]):0;
        out.sales+=sales; out.gross+=sales-pay;
      }
    });
    return out;
  }
  function absenceCount(targetYM){
    const list=Array.isArray(window.ATT)?window.ATT:[];
    return list.filter(a=>String(a.date||'').startsWith(targetYM)&&(a.status==='欠車'||norm(a.work)==='×')).length;
  }

  function ensureDelta(id,label,curr,prev,formatter){
    const el=document.getElementById(id); const card=el?.closest('article'); if(!card)return;
    let d=card.querySelector('.jarvis-month-delta');
    if(!d){d=document.createElement('small');d.className='jarvis-month-delta';d.style.cssText='display:block;margin-top:5px;font-size:10px;color:#8ddfee;line-height:1.45';card.appendChild(d)}
    const diff=curr-prev, rate=pct(curr,prev);
    d.textContent=`前月比 ${formatter(diff)} / ${signedPct(rate)} (${label})`;
  }
  function renderDeltas(){
    const c=workbookStats(currentYM()), p=workbookStats(previousYM());
    ensureDelta('cmdSales','売上',c.sales,p.sales,signedYen);
    ensureDelta('cmdGross','粗利',c.gross,p.gross,signedYen);
    ensureDelta('cmdActive','稼働',c.active,p.active,n=>`${n>=0?'+':''}${Math.round(n)}台`);
    const ca=absenceCount(currentYM()), pa=absenceCount(previousYM());
    ensureDelta('cmdAbsence','欠車',ca,pa,n=>`${n>=0?'+':''}${Math.round(n)}件`);
  }

  function updateMonthLabels(){
    const label=`${nowParts().month}月`;
    [['cmdSales','売上'],['cmdGross','粗利'],['kpiSales','累計売上'],['kpiGross','粗利']].forEach(([id,suffix])=>{
      const el=document.getElementById(id), title=el?.previousElementSibling;
      if(title&&/\d+月/.test(title.textContent)) title.textContent=title.textContent.replace(/\d+月/,label);
    });
  }

  function tick(){setShiftMonth();updateMonthLabels();renderDeltas()}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(tick,600)); else setTimeout(tick,600);
  setInterval(tick,15000);
  new MutationObserver(()=>{setShiftMonth();updateMonthLabels()}).observe(document.documentElement,{childList:true,subtree:true});

  window.JARVIS_MONTH_SYNC={currentYM,previousYM,refresh:tick,workbookStats};
})();