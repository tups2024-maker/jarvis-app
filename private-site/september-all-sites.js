(()=>{
'use strict';
const VERSION='2026-09-fix5';
const API='https://jarvis-api.t-ups2024.workers.dev';
const SNAP='./september-snapshot.json?v='+VERSION;
let snap=null,shiftSel='mishima',deliverySel='mishima';

const src={
 shift:{
  mishima:{label:'三島市',url:'https://docs.google.com/spreadsheets/d/1cc2b-7mvljP42SIIBZketcvyEb0TQSd9iwAm05OtVWs/edit#gid=280575530'},
  shizuoka:{label:'静岡',url:'https://docs.google.com/spreadsheets/d/19HbkZYZgpDLNVpyBfeEikhlXkmGLWb0a68hIS5EulJ4/edit#gid=788842575'},
  ichinomiya:{label:'一宮',url:'https://docs.google.com/spreadsheets/d/1P1MYU4TonLaxhzjbM8JVZBi3DR8PmDONyfcu0ARyEiM/edit#gid=83965649'},
  tsurumi:{label:'鶴見区',url:'https://docs.google.com/spreadsheets/d/1kfKxe39e9GHaIEGJV-THWVfulp6TqGVv4oL_P89wa04/edit#gid=954430544'},
  nakamura:{label:'中村区',url:'https://docs.google.com/spreadsheets/d/1Itlt2LkosrvNnvZrbAWb6PpeZlAQaW0hJf8CzwPfddI/edit#gid=1241751568'},
  shiga:{label:'滋賀',url:'https://docs.google.com/spreadsheets/d/162oC1bZ5b2na_7Kr0r-Z7FEOpEa_sycv-aKDzGP1CrE/edit#gid=821349324'},
  fuji:{label:'富士',url:'https://docs.google.com/spreadsheets/d/1r9FHCprJY8OamZzFakNPPiyYSxZBlfCvjQvvKKmLtpc/edit#gid=169402149'},
  suruga:{label:'駿河区遠州',url:'https://docs.google.com/spreadsheets/d/1r9FHCprJY8OamZzFakNPPiyYSxZBlfCvjQvvKKmLtpc/edit#gid=169402149'}
 },
 delivery:{
  mishima:{label:'三島市',url:'https://docs.google.com/spreadsheets/d/1Itlt2LkosrvNnvZrbAWb6PpeZlAQaW0hJf8CzwPfddI/edit#gid=283632455'},
  shizuoka:{label:'静岡',url:'https://docs.google.com/spreadsheets/d/1Itlt2LkosrvNnvZrbAWb6PpeZlAQaW0hJf8CzwPfddI/edit#gid=2051049705'},
  ichinomiya:{label:'一宮',url:'https://docs.google.com/spreadsheets/d/1Itlt2LkosrvNnvZrbAWb6PpeZlAQaW0hJf8CzwPfddI/edit#gid=902048376'},
  tsurumi:{label:'鶴見区',url:'https://docs.google.com/spreadsheets/d/1Itlt2LkosrvNnvZrbAWb6PpeZlAQaW0hJf8CzwPfddI/edit#gid=107675747'},
  nakamura:{label:'中村区',url:'https://docs.google.com/spreadsheets/d/1Itlt2LkosrvNnvZrbAWb6PpeZlAQaW0hJf8CzwPfddI/edit#gid=1241751568'},
  shiga:{label:'滋賀',url:'https://docs.google.com/spreadsheets/d/162oC1bZ5b2na_7Kr0r-Z7FEOpEa_sycv-aKDzGP1CrE/edit#gid=821349324'},
  fuji:{label:'富士',url:'https://docs.google.com/spreadsheets/d/1r9FHCprJY8OamZzFakNPPiyYSxZBlfCvjQvvKKmLtpc/edit#gid=169402149'},
  suruga:{label:'駿河区遠州',url:'https://docs.google.com/spreadsheets/d/1r9FHCprJY8OamZzFakNPPiyYSxZBlfCvjQvvKKmLtpc/edit#gid=169402149'},
  rocket:{label:'名古屋R',url:'https://docs.google.com/spreadsheets/d/1cc2b-7mvljP42SIIBZketcvyEb0TQSd9iwAm05OtVWs/edit#gid=280575530'},
  sakae:{label:'お酒 / サカエ',url:'https://docs.google.com/spreadsheets/d/1Itlt2LkosrvNnvZrbAWb6PpeZlAQaW0hJf8CzwPfddI/edit#gid=306319410'},
  akiyama:{label:'AM / 秋山製麺',url:'https://docs.google.com/spreadsheets/d/1Itlt2LkosrvNnvZrbAWb6PpeZlAQaW0hJf8CzwPfddI/edit#gid=350367810'}
 }
};
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

function trimGrid(rows,maxRows=90,maxCols=40){
 let rr=(rows||[]).slice(0,maxRows).map(r=>(r||[]).slice(0,maxCols));
 while(rr.length&&rr[rr.length-1].every(v=>String(v??'').trim()===''))rr.pop();
 let last=0;for(const r of rr)for(let i=0;i<r.length;i++)if(String(r[i]??'').trim()!=='')last=Math.max(last,i+1);
 return rr.map(r=>r.slice(0,last||1));
}
function table(rows){
 const g=trimGrid(rows);
 if(!g.length)return'<div class="j9-empty">データがありません。</div>';
 return '<div class="j9-scroll"><table class="j9-table"><tbody>'+g.map((r,ri)=>'<tr>'+r.map((v,ci)=>`<${ri<3?'th':'td'}>${esc(v)}</${ri<3?'th':'td'}>`).join('')+'</tr>').join('')+'</tbody></table></div>';
}
function style(){
 if(document.getElementById('j9style'))return;
 const s=document.createElement('style');s.id='j9style';s.textContent=`
 .j9{margin-top:14px;padding:14px;border:1px solid rgba(82,225,255,.3);border-radius:16px;background:#03131e}
 .j9-head{display:flex;align-items:center;justify-content:space-between;gap:10px}.j9-head h3{margin:0}.j9-head small{color:#75e5f6}
 .j9-tabs{display:flex;gap:7px;overflow:auto;padding:10px 0}.j9-tab{flex:0 0 auto;border:1px solid #296679;border-radius:999px;background:#06202c;color:#b8dce4;padding:8px 11px;font-weight:800;cursor:pointer}.j9-tab.on{background:#0b4560;border-color:#58e9ff;color:#fff}
 .j9-scroll{overflow:auto;max-height:62vh;border:1px solid #17404c;border-radius:12px;background:#fff}.j9-table{border-collapse:separate;border-spacing:0;min-width:max-content;width:100%;color:#122;background:#fff}.j9-table th,.j9-table td{padding:7px 8px;border-right:1px solid #ccd8dc;border-bottom:1px solid #ccd8dc;font-size:11px;white-space:nowrap}.j9-table th{position:sticky;top:0;background:#e9f7fa;z-index:2;font-weight:800}.j9-table td:first-child,.j9-table th:first-child{position:sticky;left:0;background:#f4fbfc;z-index:1}.j9-table th:first-child{z-index:3}
 .j9-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:9px 0}.j9-open{display:inline-flex;padding:8px 11px;border:1px solid #2d7687;border-radius:9px;background:#082b39;color:#effcff;text-decoration:none;font-weight:800}.j9-note{color:#8eb6c0;font-size:11px}.j9-empty{padding:24px;text-align:center;color:#9abdc5}
 `;document.head.appendChild(s)
}
function buildShizuokaGion(){
 if(!snap?.shift?.master?.rows)return null;
 const rows=snap.shift.master.rows;
 const header=rows[2]||[];
 const dayStart=3, dayEnd=33;
 const out=[
   ['静岡GION','2026年9月',...header.slice(dayStart,dayEnd)],
   ['DR名','所属',...Array.from({length:30},()=> '')]
 ];
 for(const r of rows.slice(4)){
   const name=String(r?.[1]||'').trim();
   if(!name)continue;
   const days=(r||[]).slice(dayStart,dayEnd);
   const has=days.some(v=>String(v||'').trim()==='静岡');
   if(!has)continue;
   out.push([name,"UP's",...days.map(v=>String(v||'').trim()==='静岡'?'静岡':'')]);
 }
 return {title:'静岡GION / UP\'s DAシフト正本から抽出',rows:out};
}
function sheetData(area){
 if(!snap)return null;
 if(area==='shizuoka')return buildShizuokaGion();
 if(area==='ichinomiya')return snap.shift.ichinomiya;
 if(area==='tsurumi')return snap.shift.tsurumi;
 if(area==='shiga')return snap.shift.shiga;
 if(area==='fuji'||area==='suruga')return snap.shift.enshu;
 if(area==='nakamura'){
   const x=snap.delivery?.core?.['2026年9月 中村区  '];return x?{title:'中村区 9月（配送管理反映）',rows:x.rows,gid:x.gid}:null;
 }
 return null;
}
function deliveryData(area){
 if(!snap)return null;
 const c=snap.delivery?.core||{};
 if(area==='mishima')return c['2026年9月 三島 '];
 if(area==='shizuoka')return c['2026年9月 静岡 '];
 if(area==='ichinomiya')return c['2026年9月 一宮  '];
 if(area==='tsurumi')return c['2026年9月 鶴見 '];
 if(area==='nakamura')return c['2026年9月 中村区  '];
 if(area==='sakae')return c['2026年9月 株式会社サカエ '];
 if(area==='akiyama')return c['2026年9月 秋山製麺所 '];
 if(area==='shiga')return snap.delivery.shiga;
 if(area==='fuji'||area==='suruga')return snap.delivery.enshu;
 if(area==='rocket')return snap.delivery.rocketnow;
 return null;
}
async function mishimaShift(){
 try{
  const r=await fetch(API+'/shift?t='+Date.now(),{cache:'no-store'}),j=await r.json();
  return j?.data?.values||[];
 }catch(e){return[]}
}
function bodyFor(data){
 if(!data)return'<div class="j9-empty">読込データを確認できませんでした。</div>';
 if(data.multi)return data.multi.map(x=>'<div class="j9-note" style="margin:8px 0"><b>'+esc(x.title)+'</b></div>'+table(x.rows)).join('');
 return '<div class="j9-note" style="margin:8px 0"><b>'+esc(data.title||'9月正本')+'</b></div>'+table(data.rows);
}
function mountShift(){
 const target=document.querySelector('#shift')||document.querySelector('#ops');if(!target)return;
 const old=document.getElementById('upsSiteShift');if(old)old.style.display='none';
 let box=document.getElementById('j9Shift');if(!box){box=document.createElement('section');box.id='j9Shift';box.className='j9';target.appendChild(box)}
 const tabs=['mishima','shizuoka','ichinomiya','tsurumi','nakamura','shiga','fuji','suruga'];
 box.innerHTML='<div class="j9-head"><div><small>SEPTEMBER FIXED VIEW</small><h3>配送・シフト 9月</h3></div><span class="j9-note">三島と同じJARVIS内表示</span></div><div class="j9-tabs">'+tabs.map(k=>`<button class="j9-tab${shiftSel===k?' on':''}" data-j9-shift="${k}">${src.shift[k].label}</button>`).join('')+'</div><div class="j9-tools"><a class="j9-open" href="'+src.shift[shiftSel].url+'" target="_blank" rel="noopener">正本を開く</a><span class="j9-note">9月分 / 取得済み正本を直接表示</span></div><div id="j9ShiftBody"><div class="j9-empty">読込中…</div></div>';
 box.querySelectorAll('[data-j9-shift]').forEach(b=>b.onclick=()=>{shiftSel=b.dataset.j9Shift;mountShift();renderShift()});
 renderShift();
}
async function renderShift(){
 const b=document.getElementById('j9ShiftBody');if(!b)return;
 if(shiftSel==='mishima'){const rows=await mishimaShift();b.innerHTML=table(rows);return}
 b.innerHTML=bodyFor(sheetData(shiftSel));
}
function mountDelivery(){
 const target=document.querySelector('#delivery')||document.querySelector('#ops');if(!target)return;
 const old=document.getElementById('upsDeliverySites');if(old)old.style.display='none';
 let box=document.getElementById('j9Delivery');if(!box){box=document.createElement('section');box.id='j9Delivery';box.className='j9';target.appendChild(box)}
 const tabs=['mishima','shizuoka','ichinomiya','tsurumi','nakamura','shiga','fuji','suruga','rocket','sakae','akiyama'];
 box.innerHTML='<div class="j9-head"><div><small>SEPTEMBER DELIVERY FIXED VIEW</small><h3>配送管理 9月</h3></div><span class="j9-note">拠点別正本</span></div><div class="j9-tabs">'+tabs.map(k=>`<button class="j9-tab${deliverySel===k?' on':''}" data-j9-delivery="${k}">${src.delivery[k].label}</button>`).join('')+'</div><div class="j9-tools"><a class="j9-open" href="'+src.delivery[deliverySel].url+'" target="_blank" rel="noopener">正本を開く</a><span class="j9-note">三島以外も同じ画面内で確認できます</span></div><div id="j9DeliveryBody">'+bodyFor(deliveryData(deliverySel))+'</div>';
 box.querySelectorAll('[data-j9-delivery]').forEach(b=>b.onclick=()=>{deliverySel=b.dataset.j9Delivery;mountDelivery()});
}
async function init(){
 style();
 try{snap=await fetch(SNAP,{cache:'no-store'}).then(r=>r.json())}catch(e){snap=null}
 mountShift();mountDelivery();
 window.JARVIS_SEPTEMBER_FIX={showShift:k=>{shiftSel=k;mountShift()},showDelivery:k=>{deliverySel=k;mountDelivery()}};
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();