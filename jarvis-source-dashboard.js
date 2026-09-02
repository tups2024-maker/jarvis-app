/* JARVIS V7.0.8 案件元別ダッシュボード */
(function(){
  'use strict';

  const DEFAULT_SOURCES=[
    {id:'alcohol',label:'酒配達',icon:'▣',keywords:['株式会社サカエ','サカエ','お酒','酒配達']},
    {id:'amazon',label:'Amazon配達',icon:'A',keywords:['Amazon','アマゾン','鶴見','中村区','一宮','静岡','三島','野洲','富士','駿河','遠州トラック','ギオン']},
    {id:'noodle',label:'製麺配達',icon:'麺',keywords:['秋山製麺','秋山製麺所','製麺']}
  ];

  function sources(){
    const extra=Array.isArray(window.JARVIS_SOURCE_DEFINITIONS)?window.JARVIS_SOURCE_DEFINITIONS:[];
    const map=new Map();
    [...DEFAULT_SOURCES,...extra].forEach(s=>{if(s&&s.id&&s.label) map.set(s.id,s);});
    return [...map.values()];
  }
  function norm(v){return String(v??'').replace(/\u3000/g,' ').replace(/\s+/g,' ').trim();}
  function money(v){
    if(typeof v==='number'&&Number.isFinite(v)) return v;
    const n=Number(String(v??'').replace(/[¥￥,\s円]/g,''));
    return Number.isFinite(n)?n:0;
  }
  function fmtYen(v){return '¥ '+Math.round(v||0).toLocaleString('ja-JP');}
  function fmtPct(v){return Number.isFinite(v)?`${Math.round(v)}%`:'—';}
  function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

  function sheetValues(sheet){
    if(Array.isArray(sheet)) return sheet;
    try{
      if(window.XLSX?.utils?.sheet_to_json) return XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false});
    }catch(e){console.warn('source dashboard sheet convert failed',e);}
    return [];
  }
  function workbookSheets(){
    const wb=window.WB;
    if(!wb||!Array.isArray(wb.SheetNames)||!wb.Sheets) return [];
    return wb.SheetNames.map(name=>({name,values:sheetValues(wb.Sheets[name])}));
  }
  function findHeader(values){
    for(let i=0;i<Math.min(values.length,12);i++){
      const row=(values[i]||[]).map(norm);
      if(row.includes('走行日')&&row.includes('DR')) return {row:i,headers:row};
    }
    return {row:2,headers:(values[2]||[]).map(norm)};
  }
  function idx(headers,names){
    for(const n of names){const i=headers.findIndex(h=>h===n||h.includes(n));if(i>=0)return i;}
    return -1;
  }
  function classify(sheetName,businessName){
    const text=norm(sheetName+' '+businessName);
    const defs=sources();
    // Specific categories first so generic Amazon/location keywords do not swallow them.
    const ordered=[...defs].sort((a,b)=>{
      const ap=/amazon/i.test(a.id)?1:0, bp=/amazon/i.test(b.id)?1:0;
      return ap-bp;
    });
    for(const s of ordered){
      if((s.keywords||[]).some(k=>text.includes(norm(k)))) return s.id;
    }
    return 'other';
  }
  function monthLabel(){
    return window.JARVIS_ACTIVE_YEARMONTH || new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'numeric'}).format(new Date()).replace('/','年')+'月';
  }

  function aggregate(){
    const result={};
    sources().forEach(s=>result[s.id]={...s,sales:0,driverCost:0,gross:0,activeRuns:0,drivers:new Set(),sheetNames:new Set(),rows:0});
    result.other={id:'other',label:'その他',icon:'＋',sales:0,driverCost:0,gross:0,activeRuns:0,drivers:new Set(),sheetNames:new Set(),rows:0};

    workbookSheets().forEach(({name,values})=>{
      if(!values.length) return;
      const {row:hRow,headers}=findHeader(values);
      const dateI=idx(headers,['走行日','日付']);
      const drI=idx(headers,['DR','ドライバー']);
      const businessI=idx(headers,['業務名','案件名']);
      const driverI=idx(headers,['DR金額','ドライバー金額']);
      let salesI=idx(headers,['売上金額','請求金額','卸金額','会社金額']);
      if(salesI<0) salesI=headers.findIndex((h,i)=>h==='金額'&&i!==driverI);
      const actualI=idx(headers,['実績','稼働実績']);

      for(let r=hRow+1;r<values.length;r++){
        const row=values[r]||[];
        const driver=norm(row[drI]);
        const business=norm(row[businessI]);
        const date=norm(row[dateI]);
        if(!driver&&!business&&!date) continue;
        const sourceId=classify(name,business);
        const bucket=result[sourceId]||result.other;
        const actualRaw=actualI>=0?row[actualI]:'';
        const actual=money(actualRaw);
        const isActive=(actualI<0?!!driver:(actual>0||['〇','○','出勤'].includes(norm(actualRaw))));
        bucket.sales+=salesI>=0?money(row[salesI]):0;
        bucket.driverCost+=driverI>=0?money(row[driverI]):0;
        if(isActive) bucket.activeRuns+=actual>0?actual:1;
        if(driver) bucket.drivers.add(driver);
        bucket.sheetNames.add(name);
        bucket.rows++;
      }
    });

    Object.values(result).forEach(b=>{
      b.gross=b.sales-b.driverCost;
      const configured=window.JARVIS_SOURCE_DRIVER_REGISTRY?.[b.id];
      const registered=Array.isArray(configured)?configured.length:(Number(configured)||b.drivers.size);
      b.registeredDrivers=registered;
      // 稼働率は当月の稼働実績台数を登録DR数で割る。1を超える場合も業務量としてそのまま表示する。
      b.utilization=registered>0?(b.activeRuns/registered*100):NaN;
    });
    return result;
  }

  function ensureStyles(){
    if(document.getElementById('jarvis-source-dashboard-style')) return;
    const style=document.createElement('style');
    style.id='jarvis-source-dashboard-style';
    style.textContent=`
      .command-live-strip article.jarvis-drill-card{cursor:pointer;position:relative;transition:.18s ease;border-color:rgba(95,225,255,.22)}
      .command-live-strip article.jarvis-drill-card:hover,.command-live-strip article.jarvis-drill-card:active{transform:translateY(-1px);border-color:rgba(105,235,255,.62);box-shadow:0 0 20px rgba(0,210,255,.11)}
      .jarvis-drill-hint{display:block;margin-top:5px;color:#78dff3;font-size:10px;letter-spacing:.04em}
      .source-dashboard-page{padding-bottom:32px}
      .source-dash-shell{border:1px solid rgba(95,225,255,.26);border-radius:18px;padding:18px;background:linear-gradient(180deg,rgba(5,28,42,.92),rgba(2,13,23,.94));box-shadow:0 18px 48px rgba(0,0,0,.26)}
      .source-dash-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px}
      .source-dash-head h2{margin:4px 0 0;font-size:clamp(22px,4vw,34px);letter-spacing:.04em}.source-dash-head small{color:#78a9b8;letter-spacing:.08em}
      .source-back{border:1px solid rgba(95,225,255,.34);background:#071c29;color:#dffbff;border-radius:10px;padding:9px 12px;font:inherit;font-weight:700;cursor:pointer}
      .source-month{display:inline-flex;border:1px solid rgba(95,225,255,.34);border-radius:999px;padding:7px 11px;color:#bdefff;background:rgba(0,160,200,.08);font-weight:700}
      .source-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
      .source-card{border:1px solid rgba(92,220,255,.28);border-radius:15px;padding:15px;background:rgba(4,29,42,.78);min-height:178px;box-shadow:inset 0 1px 0 rgba(255,255,255,.025)}
      .source-card-top{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:14px}.source-card-icon{width:34px;height:34px;border-radius:50%;display:grid;place-items:center;border:1px solid rgba(101,231,255,.48);color:#aef4ff;background:rgba(0,190,230,.08);font-weight:800}.source-card h3{margin:0;font-size:18px}
      .source-metrics{display:grid;grid-template-columns:1fr 1fr;gap:9px}.source-metric{padding:10px;border-radius:10px;background:rgba(0,0,0,.15);border:1px solid rgba(91,202,227,.13)}.source-metric span{display:block;color:#7fa8b5;font-size:11px;margin-bottom:4px}.source-metric b{font-size:16px;color:#effdff}.source-metric.wide{grid-column:1/-1}.source-metric .util{color:#79ecff}
      .source-footnote{margin-top:14px;color:#789baa;font-size:11px;line-height:1.7}.source-empty{opacity:.65}
      @media(max-width:640px){.source-dash-shell{padding:13px}.source-grid{grid-template-columns:1fr}.source-card{min-height:0}}
    `;
    document.head.appendChild(style);
  }

  function ensurePage(){
    let page=document.getElementById('page-sourcebreakdown');
    if(page) return page;
    const main=document.querySelector('main');
    if(!main) return null;
    page=document.createElement('section');
    page.id='page-sourcebreakdown';
    page.className='page source-dashboard-page';
    page.innerHTML=`<div class="source-dash-shell">
      <div class="source-dash-head"><div><small>JARVIS / SOURCE INTELLIGENCE</small><h2>案件元別ダッシュボード</h2></div><div style="display:flex;gap:8px;align-items:center"><span class="source-month" id="sourceMonth">—</span><button type="button" class="source-back" id="sourceBack">← COMMAND CENTER</button></div></div>
      <div class="source-grid" id="sourceGrid"></div>
      <div class="source-footnote">Google配送管理表の当月データから自動集計。案件元は設定データで追加可能です。売上は会社側金額、粗利は会社側金額−DR金額で算出します。</div>
    </div>`;
    main.appendChild(page);
    page.querySelector('#sourceBack')?.addEventListener('click',()=>showDashboard());
    return page;
  }

  function render(){
    const page=ensurePage(); if(!page) return;
    const data=aggregate();
    const month=monthLabel();
    const monthEl=page.querySelector('#sourceMonth'); if(monthEl) monthEl.textContent=month;
    const grid=page.querySelector('#sourceGrid'); if(!grid) return;
    grid.innerHTML='';
    const defs=sources();
    defs.forEach(def=>{
      const d=data[def.id]||{...def,sales:0,gross:0,activeRuns:0,registeredDrivers:0,utilization:NaN,rows:0};
      const card=document.createElement('article');
      card.className='source-card'+(!d.rows?' source-empty':'');
      card.innerHTML=`<div class="source-card-top"><div style="display:flex;align-items:center;gap:9px"><span class="source-card-icon">${esc(def.icon||'◈')}</span><h3>${esc(def.label)}</h3></div><small>${d.sheetNames?.size||0} SHEETS</small></div>
        <div class="source-metrics">
          <div class="source-metric"><span>当月売上</span><b>${fmtYen(d.sales)}</b></div>
          <div class="source-metric"><span>当月粗利</span><b>${fmtYen(d.gross)}</b></div>
          <div class="source-metric wide"><span>稼働率（稼働台数 ÷ 登録DR数）</span><b class="util">${fmtPct(d.utilization)}</b><small style="display:block;color:#6f96a4;margin-top:4px">稼働 ${d.activeRuns||0} / 登録DR ${d.registeredDrivers||0}</small></div>
        </div>`;
      grid.appendChild(card);
    });
  }

  function showSourceDashboard(){
    const page=ensurePage(); if(!page) return;
    document.querySelectorAll('main .page.active').forEach(p=>p.classList.remove('active'));
    page.classList.add('active');
    const title=document.getElementById('pageTitle'), sub=document.getElementById('pageSub');
    if(title) title.textContent='案件元別ダッシュボード';
    if(sub) sub.textContent='Amazon / 酒 / 製麺 — 売上・粗利・稼働率を案件元別に確認';
    render();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function showDashboard(){
    document.getElementById('page-sourcebreakdown')?.classList.remove('active');
    const dash=document.getElementById('page-dashboard'); if(dash) dash.classList.add('active');
    const title=document.getElementById('pageTitle'), sub=document.getElementById('pageSub');
    if(title) title.textContent='JARVIS V7.0.8 安定化版';
    if(sub) sub.textContent='音声・チャット・活動報告・経営数値を統合';
    window.scrollTo({top:0,behavior:'smooth'});
  }

  function wireCards(){
    ['cmdSales','cmdGross','cmdActive','cmdAbsence'].forEach(id=>{
      const el=document.getElementById(id), card=el?.closest('article');
      if(!card||card.dataset.sourceWired==='1') return;
      card.dataset.sourceWired='1'; card.classList.add('jarvis-drill-card'); card.tabIndex=0; card.setAttribute('role','button');
      const hint=document.createElement('small'); hint.className='jarvis-drill-hint'; hint.textContent='案件元別を見る ›'; card.appendChild(hint);
      card.addEventListener('click',showSourceDashboard);
      card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();showSourceDashboard();}});
    });
    document.querySelectorAll('.nav-item,[data-page]').forEach(btn=>{
      if(btn.dataset.sourceNavWired==='1') return; btn.dataset.sourceNavWired='1';
      if(btn.dataset.page&&btn.dataset.page!=='sourcebreakdown') btn.addEventListener('click',()=>document.getElementById('page-sourcebreakdown')?.classList.remove('active'),true);
    });
  }

  function mount(){ensureStyles();ensurePage();wireCards();render();}
  const observer=new MutationObserver(()=>{wireCards();});
  function start(){mount();observer.observe(document.documentElement,{childList:true,subtree:true});}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true}); else start();
  window.addEventListener('jarvis-delivery-synced',()=>render());
  window.JARVIS_OPEN_SOURCE_DASHBOARD=showSourceDashboard;
})();
