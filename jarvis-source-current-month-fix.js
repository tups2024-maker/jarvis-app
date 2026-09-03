/* JARVIS V7.0.8 source dashboard current-month filter */
(function(){
  'use strict';

  const TZ='Asia/Tokyo';
  const norm=v=>String(v??'').replace(/\u3000/g,' ').replace(/\s+/g,' ').trim();
  const money=v=>{if(typeof v==='number'&&Number.isFinite(v))return v;const n=Number(String(v??'').replace(/[¥￥,\s円]/g,''));return Number.isFinite(n)?n:0;};
  const fmtYen=v=>'¥ '+Math.round(v||0).toLocaleString('ja-JP');
  const fmtPct=v=>Number.isFinite(v)?`${Math.round(v)}%`:'—';
  const ymNow=()=>{
    if(window.JARVIS_CURRENT_YM) return window.JARVIS_CURRENT_YM;
    const p=Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:TZ,year:'numeric',month:'2-digit'}).formatToParts(new Date()).map(x=>[x.type,x.value]));
    return `${p.year}-${p.month}`;
  };
  const sheetYM=name=>{const m=String(name||'').match(/(\d{4})年\s*(\d{1,2})月/);return m?`${m[1]}-${String(Number(m[2])).padStart(2,'0')}`:'';};
  const dateYM=v=>{
    const s=norm(v); let m=s.match(/^(\d{4})[-\/](\d{1,2})[-\/]/); if(m)return `${m[1]}-${String(Number(m[2])).padStart(2,'0')}`;
    m=s.match(/^(\d{1,2})月\d{1,2}日/); if(m){const y=ymNow().slice(0,4);return `${y}-${String(Number(m[1])).padStart(2,'0')}`;}
    return '';
  };
  function values(sheet){try{return window.XLSX?.utils?.sheet_to_json?XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false}):[]}catch{return [];}}
  function header(v){for(let i=0;i<Math.min(v.length,15);i++){const r=(v[i]||[]).map(norm);if(r.includes('走行日')&&r.includes('DR'))return {i,r};}return null;}
  function idx(r,names){for(const n of names){const i=r.findIndex(h=>h===n||h.includes(n));if(i>=0)return i;}return -1;}
  function sourceFor(sheet,business){const t=norm(sheet+' '+business);if(/秋山製麺|製麺/.test(t))return '製麺配達';if(/株式会社サカエ|サカエ|お酒|酒配達/.test(t))return '酒配達';if(/Amazon|アマゾン|鶴見|中村区|一宮|静岡|三島|野洲|富士|駿河|遠州トラック|ギオン/.test(t))return 'Amazon配達';return 'その他';}
  function aggregate(){
    const out=new Map();
    const wb=window.WB,target=ymNow();
    if(!wb?.SheetNames||!wb?.Sheets)return out;
    wb.SheetNames.forEach(name=>{
      const sy=sheetYM(name); if(sy&&sy!==target)return;
      const v=values(wb.Sheets[name]),h=header(v); if(!h)return;
      const di=idx(h.r,['走行日','日付']),dri=idx(h.r,['DR','ドライバー']),bi=idx(h.r,['業務名','案件名']),dpi=idx(h.r,['DR金額','ドライバー金額']),ai=idx(h.r,['実績','稼働実績']);
      let si=idx(h.r,['売上金額','請求金額','卸金額','会社金額']);if(si<0)si=h.r.findIndex((x,i)=>x==='金額'&&i!==dpi);
      for(let r=h.i+1;r<v.length;r++){
        const row=v[r]||[],dy=di>=0?dateYM(row[di]):'';if(dy&&dy!==target)continue;
        const dr=norm(row[dri]),biz=norm(row[bi]);if(!dr&&!biz)continue;
        const key=sourceFor(name,biz),d=out.get(key)||{sales:0,cost:0,active:0,drivers:new Set(),sheets:new Set(),rows:0};
        const a=ai>=0?money(row[ai]):1; if(a>0)d.active+=a;
        d.sales+=si>=0?money(row[si]):0;d.cost+=dpi>=0?money(row[dpi]):0;if(dr)d.drivers.add(dr);d.sheets.add(name);d.rows++;out.set(key,d);
      }
    });
    return out;
  }
  function apply(){
    const page=document.getElementById('page-sourcebreakdown');if(!page)return;
    const data=aggregate();
    page.querySelectorAll('.source-card').forEach(card=>{
      const label=norm(card.querySelector('h3')?.textContent),d=data.get(label)||{sales:0,cost:0,active:0,drivers:new Set(),sheets:new Set(),rows:0};
      const metrics=card.querySelectorAll('.source-metric b');
      if(metrics[0])metrics[0].textContent=fmtYen(d.sales);
      if(metrics[1])metrics[1].textContent=fmtYen(d.sales-d.cost);
      const reg=Array.isArray(window.JARVIS_SOURCE_DRIVER_REGISTRY?.[label])?window.JARVIS_SOURCE_DRIVER_REGISTRY[label].length:d.drivers.size;
      const util=reg>0?d.active/reg*100:NaN;if(metrics[2])metrics[2].textContent=fmtPct(util);
      const small=card.querySelector('.source-metric.wide small');if(small)small.textContent=`稼働 ${d.active||0} / 登録DR ${reg||0}`;
      const sheetSmall=card.querySelector('.source-card-top > small');if(sheetSmall)sheetSmall.textContent=`${d.sheets.size||0} SHEETS`;
      card.classList.toggle('source-empty',!d.rows);
    });
    const month=document.getElementById('sourceMonth');if(month){const [y,m]=ymNow().split('-');month.textContent=`${y}年${Number(m)}月`;}
  }
  function boot(){setTimeout(apply,1000);new MutationObserver(()=>{const p=document.getElementById('page-sourcebreakdown');if(p?.classList.contains('active'))setTimeout(apply,0);}).observe(document.documentElement,{childList:true,subtree:true,attributes:true,attributeFilter:['class']});window.addEventListener('jarvis-delivery-synced',()=>setTimeout(apply,0));}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
  window.JARVIS_SOURCE_MONTH_FIX={refresh:apply};
})();
