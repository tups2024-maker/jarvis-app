/* JARVIS 税込売上 + 前月比 */
(function(){
  'use strict';
  const TAX=1.10;
  const CONFIG={
    mishima11:18200,mishima5:7900,mishima6:7900,alcohol:20000,noodle:10000,
    ichinomiya:19300,nakamura:19580,shizuoka:18700,tsurumi:20158
  };
  const money=v=>{const n=Number(String(v??'').replace(/[¥￥,\s円]/g,''));return Number.isFinite(n)?n:0};
  const norm=v=>String(v??'').replace(/\u3000/g,' ').replace(/\s+/g,' ').trim();
  const monthParts=()=>{const p=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit'}).formatToParts(new Date());const o=Object.fromEntries(p.map(x=>[x.type,x.value]));return {y:+o.year,m:+o.month}};
  const label=(y,m)=>`${y}年${m}月`;
  const prev=(y,m)=>m===1?{y:y-1,m:12}:{y,m:m-1};
  function values(sheet){try{return window.XLSX?.utils?.sheet_to_json?XLSX.utils.sheet_to_json(sheet,{header:1,defval:'',raw:false}):[]}catch(e){return[]}}
  function header(rows){for(let i=0;i<Math.min(15,rows.length);i++){const r=(rows[i]||[]).map(norm);if(r.includes('走行日')&&r.some(x=>x==='DR'||x.includes('ドライバー')))return {i,r}}return null}
  function ix(h,names){for(const n of names){const i=h.findIndex(x=>x===n||x.includes(n));if(i>=0)return i}return-1}
  function unit(sheetName,biz){const t=norm(sheetName+' '+biz);if(/秋山製麺/.test(t))return CONFIG.noodle;if(/株式会社サカエ|お酒|酒配送/.test(t))return CONFIG.alcohol;if(/三島5h/.test(t))return CONFIG.mishima5;if(/三島6h/.test(t))return CONFIG.mishima6;if(/三島11h|三島Amazon/.test(t))return CONFIG.mishima11;if(/一宮/.test(t))return CONFIG.ichinomiya;if(/中村区/.test(t))return CONFIG.nakamura;if(/鶴見/.test(t))return CONFIG.tsurumi;if(/静岡/.test(t))return CONFIG.shizuoka;return 0}
  function calc(target){const wb=window.WB;if(!wb?.SheetNames||!wb?.Sheets)return null;let ex=0,driver=0,runs=0,sheets=0;for(const name of wb.SheetNames){if(!norm(name).startsWith(label(target.y,target.m)))continue;const rows=values(wb.Sheets[name]);const hd=header(rows);if(!hd)continue;sheets++;const bizI=ix(hd.r,['業務名','案件名']),drI=ix(hd.r,['DR金額','ドライバー金額']),actI=ix(hd.r,['実績','稼働実績']);let salesI=ix(hd.r,['売上金額','請求金額','卸金額','会社金額']);for(let r=hd.i+1;r<rows.length;r++){const row=rows[r]||[];const biz=norm(row[bizI]);const a=actI>=0?money(row[actI]):0;if(!(a>0))continue;runs+=a;driver+=drI>=0?money(row[drI]):0;if(salesI>=0){ex+=money(row[salesI]);}else{ex+=unit(name,biz)*a;}}}return {ex,inc:Math.round(ex*TAX),driver,runs,sheets};}
  const yen=v=>'¥ '+Math.round(v||0).toLocaleString('ja-JP');
  function pct(cur,old){if(!old)return '—';const v=(cur-old)/old*100;return `${v>=0?'+':''}${v.toFixed(1)}%`;}
  function mount(){const now=monthParts(),p=prev(now.y,now.m),cur=calc(now),old=calc(p);if(!cur||!old)return false;window.JARVIS_TAX_INCLUDED_SALES={current:cur,previous:old,month:label(now.y,now.m),previousMonth:label(p.y,p.m),mom:pct(cur.inc,old.inc)};
    const sales=document.getElementById('cmdSales');if(sales){sales.textContent=yen(cur.inc);sales.title='税込売上';}
    const gross=document.getElementById('cmdGross');if(gross&&cur.inc){gross.textContent=yen(cur.inc-cur.driver);gross.title='税込売上−DR支払';}
    let box=document.getElementById('jarvisTaxMomBox');if(!box){box=document.createElement('section');box.id='jarvisTaxMomBox';box.style.cssText='margin:12px 0;padding:13px 15px;border:1px solid rgba(78,223,255,.28);border-radius:14px;background:rgba(4,27,40,.72);display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px';const page=document.getElementById('page-dashboard')||document.querySelector('main');page?.prepend(box);}if(box)box.innerHTML=`<div><small style="color:#78a7b6">${label(now.y,now.m)} 売上（税込）</small><b style="display:block;font-size:20px;color:#eaffff">${yen(cur.inc)}</b></div><div><small style="color:#78a7b6">${label(p.y,p.m)} 売上（税込）</small><b style="display:block;font-size:20px;color:#eaffff">${yen(old.inc)}</b></div><div><small style="color:#78a7b6">前月比</small><b style="display:block;font-size:20px;color:#6eeaff">${pct(cur.inc,old.inc)}</b></div>`;return true;}
  let tries=0;function start(){if(mount()||tries++>20)return;setTimeout(start,1500)}
  window.addEventListener('jarvis-delivery-synced',()=>setTimeout(mount,200));
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
