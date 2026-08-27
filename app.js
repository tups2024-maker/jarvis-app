const meta={
 dashboard:['JARVIS','総合経営ダッシュボード'],
 delivery:['配送・シフト','拠点別の運行・配置管理'],
 absence:['欠車対応','欠車・不足台数・代走候補'],
 sales:['売上・利益','日次・月次の経営数値'],
 drivers:['ドライバー','出勤・所属・確認事項'],
 locations:['拠点別実績','拠点ごとの稼働・売上'],
 reports:['日報・報告','予定と実績の自動照合'],
 ai:['AI分析','JARVISによる経営・運行判断'],
 settings:['設定','データ連携・通知・システム']
};

function go(page){
 document.querySelectorAll('.page').forEach(x=>x.classList.remove('active'));
 document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active'));
 document.getElementById('page-'+page)?.classList.add('active');
 document.querySelector(`[data-page="${page}"]`)?.classList.add('active');
 document.getElementById('pageTitle').textContent=meta[page][0];
 document.getElementById('pageSub').textContent=meta[page][1];
 closeMenu();window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('[data-page]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.page)));
document.querySelectorAll('[data-jump]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.jump)));

const menu=document.getElementById('sideMenu'),overlay=document.getElementById('overlay');
function openMenu(){menu?.classList.add('open');overlay?.classList.add('show')}
function closeMenu(){menu?.classList.remove('open');overlay?.classList.remove('show')}
document.getElementById('openMenu')?.addEventListener('click',openMenu);
document.getElementById('closeMenu')?.addEventListener('click',closeMenu);
overlay?.addEventListener('click',closeMenu);

async function loadJarvisData(){
 try{
   const r=await fetch('./jarvis-data.json?ts='+Date.now(),{cache:'no-store'});
   const data=await r.json();
   const now=new Date();
   const day=String(now.getDate());
   const month=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
   const useDay=(month===data.month&&data.days[day])?day:'27';
   const d=data.days[useDay];
   const set=(id,text)=>{const el=document.getElementById(id);if(el)el.textContent=text};
   set('kpiActive',`${d.active} 台`);
   set('kpiAbsence',`${d.absence} 台`);
   set('kpiDrivers',`${d.drivers} 名`);

   const routeRows=document.querySelectorAll('#page-dashboard .route-list div');
   const groups=[['静岡','三島'],['一宮','中村区'],['野洲'],['富士・駿河']];
   groups.forEach((g,i)=>{
     let req=0,act=0;
     g.forEach(loc=>{const x=data.locations[loc]?.days[useDay];if(x){req+=x.requested;act+=x.active}});
     const span=routeRows[i]?.querySelector('span');
     if(span)span.textContent=`${act} / ${req} 台`;
   });

   document.querySelectorAll('#page-delivery .table-like > div:not(.thead)').forEach(row=>{
     const name=row.children[0]?.textContent.trim();
     const x=data.locations[name]?.days[useDay];
     if(x){
       row.children[1].textContent=x.requested;
       row.children[2].textContent=x.active;
       row.children[3].textContent=(x.difference>0?'+':'')+x.difference;
     }
   });

   const big=document.querySelector('#page-absence .big-number');
   if(big)big.textContent=`${d.absence} 件`;

   const ai=document.querySelector('#page-dashboard .ai-summary p');
   if(ai){
     ai.textContent=d.shortage>0
       ?`本日は稼働 ${d.active}/${d.requested} 台。拠点別不足は合計 ${d.shortage} 台、×印の欠車は ${d.absence} 件です。`
       :`本日は稼働 ${d.active}/${d.requested} 台。現時点で不足はありません。`;
   }

   document.querySelectorAll('#page-locations .location').forEach(card=>{
     const name=card.querySelector('b')?.textContent.trim();
     const x=data.locations[name]?.days[useDay];
     if(x){
       card.querySelector('span').textContent=`${x.active} / ${x.requested} 台`;
       card.querySelector('small').textContent=x.difference<0?`不足 ${Math.abs(x.difference)} 台`:x.difference>0?`余剰 ${x.difference} 台`:'充足';
     }
   });
 }catch(e){console.error(e)}
}
loadJarvisData();

if('serviceWorker'in navigator){navigator.serviceWorker.register('sw.js');}