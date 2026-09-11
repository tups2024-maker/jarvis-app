(() => {
  const VERSION='V7.0.20';
  const isNum=n=>n!==null&&n!==''&&Number.isFinite(Number(n));
  const fmtYen=n=>isNum(n)?new Intl.NumberFormat('ja-JP',{style:'currency',currency:'JPY',maximumFractionDigits:0}).format(Number(n)):'—';
  const fmtPct=n=>isNum(n)?`${(Number(n)*100).toFixed(1)}%`:'—';
  const card=(label,value,sub,extra='')=>`<div class="jf-card ${extra}"><span>${label}</span><b>${value}</b>${sub?`<small>${sub}</small>`:''}</div>`;

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
    s.textContent=`.jf-wrap{margin:14px 0}.jf-title{font-size:12px;color:#6fe7fb;letter-spacing:.08em;margin:0 0 8px}.jf-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.jf-card{border:1px solid rgba(87,226,255,.24);background:linear-gradient(180deg,#061e2c,#03111a);border-radius:14px;padding:12px}.jf-card span{display:block;color:#82a4ae;font-size:11px}.jf-card b{display:block;margin-top:5px;font-size:18px;color:#eafcff}.jf-card small{display:block;margin-top:5px;color:#789aa5;font-size:10px;line-height:1.35}.jf-warn{border-color:#8c6436;background:#21170c}.jf-warn b{color:#ffd9a3}.jf-ok b{color:#78f0b6}.jf-note{margin-top:8px;padding:10px 12px;border-radius:12px;background:#061822;color:#9bc4cf;font-size:11px;line-height:1.5}.jf-link{display:inline-flex;margin-top:9px;min-height:44px;padding:0 13px;align-items:center;justify-content:center;border:1px solid rgba(87,227,255,.33);border-radius:12px;background:#072434;color:#f2fdff;text-decoration:none;font-weight:800;font-size:12px}.jf-table{width:100%;border-collapse:collapse;margin-top:10px}.jf-table th,.jf-table td{padding:8px;border-bottom:1px solid #17404c;text-align:left;font-size:11px}.jf-table th{color:#7fdff0}.jf-status{white-space:nowrap}.jf-muted{color:#7c9da6}@media(max-width:900px){.jf-grid{grid-template-columns:1fr 1fr}.jf-card b{font-size:15px}.jf-table{display:block;overflow-x:auto;white-space:nowrap}}`;
    document.head.appendChild(s);
  }

  function breakdownTable(d){
    const rows=(d.siteBreakdown||[]).map(x=>`<tr><td>${x.site}</td><td>${fmtYen(x.revenue)}</td><td>${fmtYen(x.driverCost)}</td><td>${fmtYen(x.grossProfit)}</td><td class="jf-status">${x.status||'—'}</td></tr>`).join('');
    return rows?`<table class="jf-table"><thead><tr><th>拠点</th><th>売上</th><th>DR支払</th><th>粗利</th><th>状態</th></tr></thead><tbody>${rows}</tbody></table>`:'';
  }

  function renderHome(d){
    const home=document.getElementById('home');if(!home||document.getElementById('jarvis-finance-home'))return;
    const target=home.querySelector('.core-wrap,.corebox')||home.firstElementChild;
    const wrap=document.createElement('div');wrap.id='jarvis-finance-home';wrap.className='jf-wrap';
    wrap.innerHTML=`<div class="jf-title">AI経理部 / 売上・利益（${d.scope||'確認済み分'}）</div><div class="jf-grid">${card('今日の売上',fmtYen(d.todayRevenue),d.todayRevenueScope||'日次連携済み分のみ','jf-ok')}${card('今月売上',fmtYen(d.monthRevenue),'確認済み拠点の合計')}${card('DR支払',fmtYen(d.monthDriverCost),'確認済み・登録済み分')}${card('確定粗利',fmtYen(d.confirmedGrossProfit),'確認できた分のみ')}${card('粗利率',fmtPct(d.confirmedGrossMargin),'未連携拠点があるため未確定')}${card('未確認',`${d.unknownCount??'—'}件`,`売上単価 ${d.unknownRevenueRate??'—'} / DR金額 ${d.unknownDriverCost??'—'}`,Number(d.unknownCount)>0?'jf-warn':'jf-ok')}</div>${breakdownTable(d)}<div class="jf-note">${VERSION} ／ 最新実績日: ${d.latestActualDate||'—'} ／ 未確認・未連携は全社利益に確定計上していません。</div>`;
    target?.parentNode?target.parentNode.insertBefore(wrap,target):home.appendChild(wrap);
  }

  function renderSales(d){
    const sales=document.getElementById('sales');if(!sales||document.getElementById('jarvis-finance-sales'))return;
    const wrap=document.createElement('div');wrap.id='jarvis-finance-sales';wrap.className='jf-wrap';
    wrap.innerHTML=`<div class="jf-title">JARVIS売上利益 / ${VERSION}</div><div class="jf-grid">${card('今日売上',fmtYen(d.todayRevenue),d.todayRevenueScope||'日次連携済み分')}${card('今月売上',fmtYen(d.monthRevenue),'確認済み拠点合計')}${card('DR支払',fmtYen(d.monthDriverCost),'確認済み・登録済み分')}${card('確定粗利',fmtYen(d.confirmedGrossProfit),'未確認分は除外','jf-ok')}${card('粗利率',fmtPct(d.confirmedGrossMargin),'全社率は未確定')}${card('未確認',`${d.unknownCount??'—'}件`,`売上単価 ${d.unknownRevenueRate??'—'}件 / DR ${d.unknownDriverCost??'—'}件`,Number(d.unknownCount)>0?'jf-warn':'jf-ok')}</div>${breakdownTable(d)}<div class="jf-note">対象: ${d.scope||'確認済み分'} ／ 更新: ${d.updatedAt||'—'}。三島には秋山製麺・お酒配送を含むため別加算していません。</div><a class="jf-link" href="https://docs.google.com/spreadsheets/d/1Itlt2LkosrvNnvZrbAWb6PpeZlAQaW0hJf8CzwPfddI/edit#gid=539293015" target="_blank" rel="noopener">JARVIS売上利益シートを開く</a>`;
    const old=sales.querySelector('.notice.alert');if(old){old.textContent='配送実績から売上・利益集計を拡張中。三島＋静岡を反映済み。未連携拠点は推測せず表示します。';old.parentNode.insertBefore(wrap,old)}else sales.appendChild(wrap);
  }

  async function load(){
    setVersion();injectStyles();
    try{const r=await fetch(`./finance-status.json?v=${Date.now()}`,{cache:'no-store'});if(!r.ok)throw new Error(`HTTP ${r.status}`);const d=await r.json();if(!d||d.enabled===false)return;renderHome(d);renderSales(d)}catch(e){console.warn('JARVIS finance dashboard load failed',e)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',load,{once:true});else load();
})();
