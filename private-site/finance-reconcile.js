(()=>{
const VERSION='V7.3.18-DAILY-FRESHNESS';
const SRC='./finance-status.json';
const yen=n=>Number.isFinite(Number(n))?'¥'+Number(n).toLocaleString('ja-JP'):'—';
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const fmtDate=d=>{const m=String(d||'').match(/(?:\d{4}-)?(\d{1,2})-(\d{1,2})$/);return m?`${Number(m[1])}/${Number(m[2])}`:'確認日'};
const localToday=()=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date());const o=Object.fromEntries(p.map(x=>[x.type,x.value]));return `${o.year}-${o.month}-${o.day}`};
const daysBehind=(cutoff,today)=>{const a=Date.parse(`${cutoff}T00:00:00+09:00`),b=Date.parse(`${today}T00:00:00+09:00`);return Number.isFinite(a)&&Number.isFinite(b)?Math.max(0,Math.round((b-a)/86400000)):null};
function reconcile(f){
  const sites=Array.isArray(f?.siteBreakdown)?f.siteBreakdown:[];
  const hasSites=sites.length>0;
  const siteRevenue=sites.reduce((a,x)=>a+num(x?.revenue),0);
  const siteDriver=sites.reduce((a,x)=>a+num(x?.driverCost),0);
  const siteGross=sites.reduce((a,x)=>a+num(x?.grossProfit),0);
  const monthRevenue=hasSites?siteRevenue:num(f?.monthRevenue);
  const monthDriverCost=hasSites?siteDriver:num(f?.monthDriverCost);
  const confirmedGrossProfit=hasSites?siteGross:num(f?.confirmedGrossProfit);
  const diffs={
    revenue:monthRevenue-num(f?.monthRevenue),
    driver:monthDriverCost-num(f?.monthDriverCost),
    gross:confirmedGrossProfit-num(f?.confirmedGrossProfit)
  };
  return {monthRevenue,monthDriverCost,confirmedGrossProfit,diffs,unknown:num(f?.unknownCount),cutoff:f?.actualsCutoff||f?.latestActualDate||'',todayRevenue:num(f?.todayRevenue)};
}
function diffText(d){const parts=[];if(d.revenue)parts.push(`売上 ${d.revenue>0?'+':''}${yen(d.revenue)}`);if(d.driver)parts.push(`DR ${d.driver>0?'+':''}${yen(d.driver)}`);if(d.gross)parts.push(`粗利 ${d.gross>0?'+':''}${yen(d.gross)}`);return parts.join(' / ')}
function apply(f){
  const root=document.getElementById('aiOffice');if(!root)return;
  const r=reconcile(f),cards=[...root.querySelectorAll('.ups-kpi')];if(cards.length<4)return;
  const today=localToday(),todayLabel=fmtDate(today),asof=fmtDate(r.cutoff),isToday=String(r.cutoff)===today,lag=daysBehind(r.cutoff,today);
  cards[0].innerHTML=`<span>▥ 今月売上</span><b>${yen(r.monthRevenue)}</b><small>${asof}確定 / ${todayLabel}自動確認</small>`;
  cards[1].innerHTML=`<span>● 確認済み粗利</span><b>${yen(r.confirmedGrossProfit)}</b><small>${asof}確定${r.unknown?` / 未確認${r.unknown}件`:''}</small>`;
  cards[2].innerHTML=`<span>♟ DR支払</span><b>${yen(r.monthDriverCost)}</b><small>${asof}確定 / ${todayLabel}自動確認</small>`;
  cards[3].innerHTML=`<span>▣ ${isToday?'今日の売上':`${asof}実績売上`}</span><b>${yen(r.todayRevenue)}</b><small>${isToday?'本日同期済み':`${todayLabel}確認 / ${lag==null?'未同期':`${lag}日分未反映`}`}</small>`;
  let audit=root.querySelector('.ups-fin-audit');
  if(!audit){audit=document.createElement('div');audit.className='ups-fin-audit';audit.style.cssText='margin-top:10px;padding:9px 11px;border:1px solid rgba(56,219,255,.18);border-radius:11px;background:rgba(3,28,43,.72);color:#9fdce8;font-size:9px;line-height:1.55';const note=root.querySelector('.ups-note');(note||root).before(audit)}
  const dt=diffText(r.diffs);
  audit.style.borderColor=isToday?'rgba(76,239,170,.24)':'rgba(255,184,75,.34)';
  audit.style.color=isToday?'#9fe8cd':'#ffd39b';
  audit.textContent=isToday?(dt?`本日${todayLabel} 自動同期済み。拠点別合計との差異を補正しました（${dt}）。`:`本日${todayLabel} 自動同期済み。売上・DR支払・確認済み粗利は拠点別合計と一致しています。`):`本日${todayLabel} 自動確認済み。売上の確定データは${asof}までです。${lag==null?'最新実績の取得待ちです。':`${lag}日分は配送管理表から売上へ未反映です。`} 古い金額を今日の実績として表示しません。`;
  root.dataset.financeReconciled=VERSION;
}
async function run(){try{const q=await fetch(`${SRC}?reconcile=${Date.now()}`,{cache:'no-store'});if(!q.ok)return;apply(await q.json())}catch(e){}}
setTimeout(run,900);setInterval(run,15000);
})();
