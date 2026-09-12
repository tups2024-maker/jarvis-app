(()=>{
  const VERSION='V7.3.8';
  const KEY='ups_internal_finance_override_v1';
  const originalFetch=window.fetch.bind(window);
  const money=n=>Number.isFinite(Number(n))?'¥'+Number(n).toLocaleString('ja-JP'):'—';
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const isFinanceUrl=input=>{try{const u=typeof input==='string'?input:(input?.url||'');return /(?:^|\/)finance-status\.json(?:\?|$)/.test(u)}catch{return false}};
  function sumSites(data){const rows=Array.isArray(data?.siteBreakdown)?data.siteBreakdown:[];return{
    monthRevenue:rows.reduce((s,x)=>s+num(x?.revenue),0),
    monthDriverCost:rows.reduce((s,x)=>s+num(x?.driverCost),0),
    confirmedGrossProfit:rows.reduce((s,x)=>s+num(x?.grossProfit),0)
  }}
  function reconcile(data){if(!data||!Array.isArray(data.siteBreakdown))return{data,changed:false,diff:{}};const totals=sumSites(data);const diff={};for(const k of Object.keys(totals)){const before=num(data[k]),after=totals[k];if(before!==after)diff[k]={before,after,delta:after-before}}
    const out={...data,...totals,internalReconciledAt:new Date().toISOString(),internalReconcileVersion:VERSION};
    if(Number.isFinite(Number(out.confirmedRevenueForMargin))&&Number(out.confirmedRevenueForMargin)>0){out.confirmedGrossMargin=out.confirmedGrossProfit/Number(out.confirmedRevenueForMargin)}
    return{data:out,changed:Object.keys(diff).length>0,diff};
  }
  function save(result){try{localStorage.setItem(KEY,JSON.stringify({savedAt:Date.now(),sourceUpdatedAt:result.data?.updatedAt||'',actualsCutoff:result.data?.actualsCutoff||result.data?.latestActualDate||'',data:result.data,diff:result.diff}))}catch(e){}
  }
  async function fetchFinance(){const r=await originalFetch('./finance-status.json?internal='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('finance-status '+r.status);return await r.json()}
  function applyDom(data){const pairs=[['今月売上','monthRevenue'],['確認済み粗利','confirmedGrossProfit'],['DR支払','monthDriverCost']];document.querySelectorAll('.ups-kpi,.aio-kpi').forEach(card=>{const label=card.querySelector('span')?.textContent||'';for(const [name,key] of pairs){if(label.includes(name)){const b=card.querySelector('b');if(b)b.textContent=money(data[key])}}});}
  async function repairFinance(){const src=await fetchFinance(),result=reconcile(src);save(result);applyDom(result.data);window.dispatchEvent(new CustomEvent('ups-finance-reconciled',{detail:result}));return result}
  function criticalIntent(m){return /(単価|サーチャージ|元シート|配送管理表|原本|削除|外部送信|公開|契約|振込|支払).*(変更|修正|更新|確定|実行)|(?:変更|修正|更新|確定|実行).*(単価|サーチャージ|元シート|配送管理表|原本|削除|外部送信|公開|契約|振込|支払)/.test(m)}
  function financeIntent(m){return /(売上|粗利|利益|DR支払|経理|差異|数字).*(修正|直|再計算|整合|合わせ|確認)|(?:修正|直|再計算|整合|合わせ|確認).*(売上|粗利|利益|DR支払|経理|差異|数字)|内部修正/.test(m)}
  function diffLine(name,d){return d?`${name}: ${money(d.before)} → ${money(d.after)}（差 ${d.delta>=0?'+':''}${money(d.delta).replace('¥','¥')}）`:''}
  async function run(message){const m=String(message||'').trim();if(!m)return null;
    if(criticalIntent(m))return{handled:true,approvalRequired:true,reply:'この操作は重要変更にあたるため自動実行しません。元シート変更・単価変更・外部送信などは最終承認後に実行する設定です。'};
    if(!financeIntent(m))return null;
    try{const r=await repairFinance();const lines=[];if(r.diff.monthRevenue)lines.push(diffLine('今月売上',r.diff.monthRevenue));if(r.diff.monthDriverCost)lines.push(diffLine('DR支払',r.diff.monthDriverCost));if(r.diff.confirmedGrossProfit)lines.push(diffLine('確認済み粗利',r.diff.confirmedGrossProfit));
      const reply=r.changed?`内部の売上・粗利整合チェックを実行し、JARVIS表示を自動補正しました。\n${lines.join('\n')}\n元のGoogle Sheetsは変更していません。未確認金額は推測していません。`:`内部の売上・DR支払・確認済み粗利を再集計しました。現在のJARVIS表示と拠点別合計に差異はありません。元のGoogle Sheetsは変更していません。`;
      return{handled:true,approvalRequired:false,reply,result:r};
    }catch(e){return{handled:true,approvalRequired:false,reply:'内部整合チェックを実行できませんでした。元データは変更していません。',error:String(e)}}
  }
  const wrappedFetch=async(...args)=>{const res=await originalFetch(...args);if(!isFinanceUrl(args[0])||!res.ok)return res;try{const data=await res.clone().json(),r=reconcile(data);if(r.changed)save(r);const body=JSON.stringify(r.data);return new Response(body,{status:res.status,statusText:res.statusText,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}catch{return res}};
  window.fetch=wrappedFetch;
  window.upsInternalAction=run;
  window.upsFinanceRepair=repairFinance;
  window.addEventListener('load',()=>{setTimeout(()=>repairFinance().catch(()=>{}),900)},{once:true});
})();