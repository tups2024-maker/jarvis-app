const meta={dashboard:['JARVIS V4.1','実績・売上・粗利・欠車を統合した経営ダッシュボード'],delivery:['配送・シフト','案件別の運行・配置管理'],absence:['欠車対応','欠車・不足案件の確認'],sales:['売上・利益','案件別売上・粗利・欠車損失'],locations:['案件別実績','案件単位の稼働状況'],ai:['AI分析','JARVISによる経営判断'],settings:['設定','単価・データ連携・システム']};
function go(page){document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));document.getElementById('page-'+page)?.classList.add('active');document.querySelector(`[data-page="${page}"]`)?.classList.add('active');document.getElementById('pageTitle').textContent=meta[page][0];document.getElementById('pageSub').textContent=meta[page][1];closeMenu()}
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));
const menu=document.getElementById('sideMenu'),overlay=document.getElementById('overlay');
function openMenu(){menu?.classList.add('open');overlay?.classList.add('show')} function closeMenu(){menu?.classList.remove('open');overlay?.classList.remove('show')}
document.getElementById('openMenu')?.addEventListener('click',openMenu);document.getElementById('closeMenu')?.addEventListener('click',closeMenu);overlay?.addEventListener('click',closeMenu);
const yen=n=>'¥'+Math.round(n).toLocaleString('ja-JP');
async function load(){
 const r=await fetch('./jarvis-v4-data.json?ts='+Date.now(),{cache:'no-store'}); const d=await r.json(); const tax=1+(d.sales_tax_rate||0);
 const active=d.projects.reduce((s,p)=>s+p.active,0),abs=d.projects.reduce((s,p)=>s+p.absence,0);
 const missing=d.projects.filter(p=>!p.unit_price||p.driver_pay==null);
 const monthSalesEx=d.projects.reduce((s,p)=>s+((d.month_actuals[p.name]||0)*(p.unit_price||0)),0);
 const monthSalesInc=monthSalesEx*tax;
 const monthDriver=d.projects.reduce((s,p)=>s+((d.month_actuals[p.name]||0)*(p.driver_pay||0)),0);
 const monthGross=monthSalesInc-monthDriver;
 const grossMargin=monthSalesInc?monthGross/monthSalesInc*100:0;
 const todaySalesEx=d.projects.reduce((s,p)=>s+(p.active*(p.unit_price||0)),0);
 const loss=d.projects.reduce((s,p)=>s+(p.absence*(p.unit_price||0)),0);
 document.getElementById('kpiActive').textContent=active+' 台';document.getElementById('kpiAbsence').textContent=abs+' 台';
 document.getElementById('kpiSales').textContent=yen(monthSalesEx);document.getElementById('kpiLoss').textContent=yen(loss);
 document.getElementById('kpiGross').textContent=yen(monthGross);
 document.getElementById('salesMonth').textContent=yen(monthSalesEx);document.getElementById('salesToday').textContent=yen(todaySalesEx);
 document.getElementById('salesLoss').textContent=yen(loss);document.getElementById('salesGross').textContent=yen(monthGross);document.getElementById('grossMargin').textContent=grossMargin.toFixed(1)+'%';
 document.getElementById('rateCoverage').textContent=Math.round((d.projects.length-missing.length)/d.projects.length*100)+'%';document.getElementById('absenceCount').textContent=abs+' 件';
 document.getElementById('projectStatus').innerHTML=d.projects.map(p=>`<div class="project-card ${p.active<p.required?'warn':'ok'}"><b>${p.name}</b><span>${p.active} / ${p.required} 台</span><small>${p.active<p.required?'不足 '+(p.required-p.active)+' 台':'充足'}</small></div>`).join('');
 document.getElementById('missingRates').innerHTML=missing.map(p=>`<div>${p.name}：単価未設定</div>`).join('')||'<div>すべて設定済み</div>';
 document.getElementById('shortageList').innerHTML=d.projects.filter(p=>p.active<p.required).map(p=>`<div>${p.name}：不足 ${p.required-p.active} 台</div>`).join('')||'<div>不足なし</div>';
 const head='<div class="thead"><span>案件</span><span>必要</span><span>稼働</span><span>差異</span><span>売上単価</span></div>';
 document.getElementById('deliveryTable').innerHTML=head+d.projects.map(p=>`<div><span>${p.name}</span><span>${p.required}</span><span>${p.active}</span><span>${p.active-p.required}</span><span>${p.unit_price?yen(p.unit_price):'未設定'}</span></div>`).join('');
 const shead='<div class="thead"><span>案件</span><span>実績</span><span>売上(税別)</span><span>粗利(税込基準)</span><span>粗利率</span></div>';
 document.getElementById('salesTable').innerHTML=shead+d.projects.map(p=>{const n=d.month_actuals[p.name]||0,si=n*(p.unit_price||0)*tax,g=si-n*(p.driver_pay||0),m=si?g/si*100:0;return `<div><span>${p.name}</span><span>${n}</span><span>${yen(n*(p.unit_price||0))}</span><span>${yen(g)}</span><span>${m.toFixed(1)}%</span></div>`}).join('');
 document.getElementById('projectCards').innerHTML=d.projects.map(p=>{const gi=(p.unit_price||0)*tax-(p.driver_pay||0);return `<article class="glass location"><b>${p.name}</b><span>${p.active} / ${p.required} 台</span><small>売上 ${yen(p.unit_price||0)} / 粗利 ${yen(gi)}/台</small></article>`}).join('');

 const profitability=d.projects.map(p=>{
   const n=d.month_actuals[p.name]||0;
   const salesEx=n*(p.unit_price||0);
   const salesInc=salesEx*tax;
   const driver=n*(p.driver_pay||0);
   const gross=salesInc-driver;
   const margin=salesInc?gross/salesInc*100:0;
   const grossPerRun=(p.unit_price||0)*tax-(p.driver_pay||0);
   return {name:p.name,n,salesEx,gross,margin,grossPerRun};
 }).sort((a,b)=>b.gross-a.gross);
 const rhead='<div class="thead"><span>順位 / 案件</span><span>実績</span><span>売上</span><span>粗利</span><span>粗利率</span></div>';
 document.getElementById('profitRanking').innerHTML=rhead+profitability.map((x,i)=>`<div><span>${i+1}位 ${x.name}</span><span>${x.n}</span><span>${yen(x.salesEx)}</span><span>${yen(x.gross)}</span><span>${x.margin.toFixed(1)}%</span></div>`).join('');

 document.getElementById('aiSummary').textContent=`本日は稼働 ${active} 台、欠車 ${abs} 件。8月粗利は ${yen(monthGross)}、粗利率 ${grossMargin.toFixed(1)}%。粗利額トップは ${profitability[0]?.name||'—'}（${yen(profitability[0]?.gross||0)}）。`;
}
load().catch(console.error);if('serviceWorker'in navigator){navigator.serviceWorker.register('sw.js');}
