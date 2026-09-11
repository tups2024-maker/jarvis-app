(() => {
  const VERSION='V7.0.21';
  const isNum=n=>n!==null&&n!==''&&Number.isFinite(Number(n));
  const fmtYen=n=>isNum(n)?new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY',maximumFractionDigits:0}).format(Number(n)):'—';
  const fmtPct=n=>isNum(n)?`${(Number(n)*100).toFixed(1)}%`:'—';
  const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

  function setVersion(){
    document.title=`JARVIS ${VERSION}`;
    const badge=document.querySelector('.badge,.pill');
    if(badge) badge.textContent=VERSION;
    const brand=document.querySelector('.brand small');
    if(brand && !brand.textContent.includes(VERSION)) brand.textContent=`${brand.textContent} / ${VERSION}`;
  }

  function injectStyles(){
    if(document.getElementById('jarvis-finance-style'))return;
    const s=document.createElement('style');s.id='jarvis-finance-style';
    s.textContent=`
    .jf-wrap{margin:16px 0 22px;font-family:Inter,system-ui,-apple-system,"Segoe UI",sans-serif;color:#eafcff}
    .jf-shell{position:relative;overflow:hidden;border:1px solid rgba(91,225,255,.20);border-radius:24px;padding:18px;background:radial-gradient(circle at 85% 0%,rgba(28,197,255,.14),transparent 32%),linear-gradient(155deg,rgba(6,25,39,.97),rgba(2,8,16,.99));box-shadow:0 20px 60px rgba(0,0,0,.35),inset 0 1px rgba(255,255,255,.03)}
    .jf-shell:before{content:"";position:absolute;inset:0;pointer-events:none;background:linear-gradient(rgba(92,223,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(92,223,255,.025) 1px,transparent 1px);background-size:34px 34px;mask-image:linear-gradient(to bottom,#000,transparent 75%)}
    .jf-head{position:relative;display:flex;align-items:flex-start;justify-content:space-between;gap:16px;margin-bottom:15px}
    .jf-eyebrow{font-size:10px;letter-spacing:.22em;color:#63e9ff;text-transform:uppercase;font-weight:800}
    .jf-head h2{margin:4px 0 2px;font-size:22px;letter-spacing:.02em;color:#f1fdff}.jf-head p{margin:0;color:#7197a4;font-size:11px}
    .jf-live{display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(85,240,177,.28);border-radius:999px;padding:7px 10px;background:rgba(18,80,57,.20);font-size:10px;font-weight:800;color:#79f4b5;white-space:nowrap}.jf-live:before{content:"";width:7px;height:7px;border-radius:50%;background:#60f0ad;box-shadow:0 0 14px #60f0ad}
    .jf-kpis{position:relative;display:grid;grid-template-columns:1.25fr repeat(3,1fr);gap:10px}.jf-kpi{min-height:108px;border:1px solid rgba(90,219,246,.14);border-radius:17px;padding:14px;background:linear-gradient(180deg,rgba(8,31,45,.86),rgba(5,17,27,.86));box-shadow:inset 0 1px rgba(255,255,255,.025)}
    .jf-kpi.primary{background:radial-gradient(circle at 100% 0%,rgba(0,220,255,.18),transparent 45%),linear-gradient(180deg,#082838,#05131f);border-color:rgba(90,225,255,.32)}
    .jf-label{font-size:10px;color:#7598a4;letter-spacing:.08em}.jf-value{display:block;margin-top:7px;font-size:25px;font-weight:900;letter-spacing:-.03em;color:#f3fdff}.jf-kpi.primary .jf-value{font-size:31px;color:#8cf3ff;text-shadow:0 0 22px rgba(71,224,255,.20)}
    .jf-sub{display:block;margin-top:7px;color:#63838e;font-size:9.5px;line-height:1.4}.jf-positive{color:#78f0b6!important}.jf-warning{color:#ffd598!important}
    .jf-middle{position:relative;display:grid;grid-template-columns:minmax(0,1.65fr) minmax(240px,.75fr);gap:12px;margin-top:12px}
    .jf-panel{border:1px solid rgba(91,225,255,.14);border-radius:18px;background:rgba(4,17,27,.78);padding:14px;min-width:0}.jf-panel-title{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:12px}.jf-panel-title b{font-size:12px;letter-spacing:.05em}.jf-panel-title span{font-size:9px;color:#638692}
    .jf-site{display:grid;grid-template-columns:72px 1fr auto;gap:10px;align-items:center;padding:8px 0;border-top:1px solid rgba(104,206,229,.08)}.jf-site:first-child{border-top:0}.jf-site-name{font-size:11px;font-weight:800}.jf-track{height:7px;border-radius:999px;background:#0c2833;overflow:hidden}.jf-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#16bce0,#75f0ff);box-shadow:0 0 12px rgba(45,214,246,.24)}.jf-site-money{text-align:right;font-size:10px;font-weight:800;color:#c9f7ff}.jf-site-status{grid-column:2/4;font-size:8.8px;color:#668994;margin-top:-5px}
    .jf-ring-wrap{display:flex;align-items:center;justify-content:center;min-height:144px}.jf-ring{--p:0;position:relative;width:122px;height:122px;border-radius:50%;display:grid;place-items:center;background:conic-gradient(#5cecff calc(var(--p)*1%),#0b2a36 0);box-shadow:0 0 28px rgba(49,220,250,.08)}.jf-ring:after{content:"";position:absolute;width:91px;height:91px;border-radius:50%;background:#06151f;border:1px solid rgba(97,218,242,.11)}.jf-ring-inner{position:relative;z-index:1;text-align:center}.jf-ring-inner b{display:block;font-size:24px}.jf-ring-inner span{font-size:9px;color:#6d94a0}
    .jf-mini-grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.jf-mini{border:1px solid rgba(90,220,246,.11);border-radius:13px;padding:10px;background:#061923}.jf-mini span{display:block;font-size:9px;color:#6b909b}.jf-mini b{display:block;margin-top:4px;font-size:15px}
    .jf-approval{position:relative;margin-top:12px;border:1px solid rgba(255,181,87,.30);background:linear-gradient(180deg,rgba(70,43,13,.54),rgba(31,21,10,.66));border-radius:16px;padding:12px}.jf-approval.ok{border-color:rgba(84,239,177,.22);background:rgba(13,56,42,.28)}.jf-approval h4{margin:0 0 8px;color:#ffd59b;font-size:12px}.jf-approval.ok h4{color:#7cf2b8}.jf-approval-item{padding:8px 0;border-top:1px solid rgba(255,199,116,.12);font-size:10px;line-height:1.5}.jf-approval-item:first-of-type{border-top:0}
    .jf-footer{position:relative;display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:11px;color:#5d7e89;font-size:9px}.jf-link{display:inline-flex;min-height:38px;padding:0 12px;align-items:center;justify-content:center;border:1px solid rgba(86,225,255,.28);border-radius:11px;background:#082431;color:#eefdff;text-decoration:none;font-weight:800;font-size:10px}
    @media(max-width:1000px){.jf-kpis{grid-template-columns:1fr 1fr}.jf-middle{grid-template-columns:1fr}.jf-kpi.primary .jf-value{font-size:25px}}
    @media(max-width:620px){.jf-shell{padding:13px;border-radius:20px}.jf-head h2{font-size:18px}.jf-kpis{grid-template-columns:1fr 1fr;gap:8px}.jf-kpi{min-height:92px;padding:11px}.jf-value{font-size:18px}.jf-kpi.primary .jf-value{font-size:21px}.jf-head{align-items:center}.jf-live{padding:6px 8px}.jf-site{grid-template-columns:58px 1fr auto}.jf-footer{align-items:flex-start;flex-direction:column}.jf-link{width:100%;box-sizing:border-box}}
    `;
    document.head.appendChild(s);
  }

  function sitePerformance(d){
    const rows=(d.siteBreakdown||[]).filter(x=>isNum(x.revenue));
    const max=Math.max(1,...rows.map(x=>Number(x.revenue)||0));
    if(!rows.length)return '<div class="jf-sub">拠点データなし</div>';
    return rows.map(x=>{
      const pct=Math.max(2,Math.round((Number(x.revenue||0)/max)*100));
      return `<div class="jf-site"><div class="jf-site-name">${esc(x.site)}</div><div class="jf-track"><div class="jf-fill" style="width:${pct}%"></div></div><div class="jf-site-money">${fmtYen(x.revenue)}</div><div class="jf-site-status">${esc(x.status||'')}</div></div>`;
    }).join('');
  }

  function approvalPanel(d){
    const q=d.approvalQueue||[];
    if(!q.length)return '<div class="jf-approval ok"><h4>✓ 承認待ち 0件</h4><div class="jf-sub">現在、確認が必要な項目はありません。</div></div>';
    return `<div class="jf-approval"><h4>⚠ 承認待ち ${q.length}件</h4>${q.map(x=>`<div class="jf-approval-item"><b>${esc(x.date||'')} ${esc(x.site||'')} ${esc(x.business||'')}</b><br>${esc(x.question||'')}</div>`).join('')}</div>`;
  }

  function executiveDashboard(d,withLink=false){
    const margin=isNum(d.confirmedGrossMargin)?Number(d.confirmedGrossMargin):0;
    const ring=Math.min(100,Math.max(0,margin*100));
    return `<div class="jf-shell">
      <div class="jf-head"><div><div class="jf-eyebrow">JARVIS EXECUTIVE CONTROL</div><h2>経営ダッシュボード</h2><p>${esc(d.scope||'確認済み実績')} / 最新実績 ${esc(d.latestActualDate||'—')}</p></div><div class="jf-live">LIVE DATA</div></div>
      <div class="jf-kpis">
        <div class="jf-kpi primary"><span class="jf-label">MONTHLY REVENUE</span><b class="jf-value">${fmtYen(d.monthRevenue)}</b><span class="jf-sub">今月売上・確認済み全拠点</span></div>
        <div class="jf-kpi"><span class="jf-label">GROSS PROFIT</span><b class="jf-value jf-positive">${fmtYen(d.confirmedGrossProfit)}</b><span class="jf-sub">両方確定分のみ</span></div>
        <div class="jf-kpi"><span class="jf-label">DR PAYMENT</span><b class="jf-value">${fmtYen(d.monthDriverCost)}</b><span class="jf-sub">登録済み支払額</span></div>
        <div class="jf-kpi"><span class="jf-label">TODAY REVENUE</span><b class="jf-value">${fmtYen(d.todayRevenue)}</b><span class="jf-sub">${esc(d.todayRevenueScope||'日次確認済み分')}</span></div>
      </div>
      <div class="jf-middle">
        <div class="jf-panel"><div class="jf-panel-title"><b>拠点別パフォーマンス</b><span>売上規模</span></div>${sitePerformance(d)}</div>
        <div class="jf-panel"><div class="jf-panel-title"><b>利益コンディション</b><span>CONFIRMED</span></div><div class="jf-ring-wrap"><div class="jf-ring" style="--p:${ring}"><div class="jf-ring-inner"><b>${fmtPct(margin)}</b><span>粗利率</span></div></div></div><div class="jf-mini-grid"><div class="jf-mini"><span>承認待ち</span><b class="${(d.approvalQueue||[]).length?'jf-warning':'jf-positive'}">${(d.approvalQueue||[]).length}件</b></div><div class="jf-mini"><span>未確認</span><b>${Number(d.unknownCount||0)}件</b></div></div></div>
      </div>
      ${approvalPanel(d)}
      <div class="jf-footer"><span>${VERSION} / 更新 ${esc(d.updatedAt||'—')} / 未確認・未連携は確定利益に含めません。</span>${withLink?'<a class="jf-link" href="https://docs.google.com/spreadsheets/d/1Itlt2LkosrvNnvZrbAWb6PpeZlAQaW0hJf8CzwPfddI/edit#gid=539293015" target="_blank" rel="noopener">売上利益シートを開く</a>':''}</div>
    </div>`;
  }

  function renderHome(d){
    const home=document.getElementById('home');if(!home||document.getElementById('jarvis-finance-home'))return;
    const target=home.querySelector('.core-wrap,.corebox')||home.firstElementChild;
    const wrap=document.createElement('div');wrap.id='jarvis-finance-home';wrap.className='jf-wrap';wrap.innerHTML=executiveDashboard(d,false);
    target?.parentNode?target.parentNode.insertBefore(wrap,target):home.appendChild(wrap);
  }

  function renderSales(d){
    const sales=document.getElementById('sales');if(!sales||document.getElementById('jarvis-finance-sales'))return;
    const wrap=document.createElement('div');wrap.id='jarvis-finance-sales';wrap.className='jf-wrap';wrap.innerHTML=executiveDashboard(d,true);
    const old=sales.querySelector('.notice.alert');if(old){old.textContent='配送実績から売上・利益を更新。未確定事項だけ承認待ちに表示します。';old.parentNode.insertBefore(wrap,old)}else sales.appendChild(wrap);
  }

  async function load(){
    setVersion();injectStyles();
    try{const r=await fetch(`./finance-status.json?v=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);const d=await r.json();if(!d||d.enabled===false)return;renderHome(d);renderSales(d)}catch(e){console.warn('JARVIS finance dashboard load failed',e)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
