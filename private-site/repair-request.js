(()=>{
'use strict';
const KEY='ups_repair_requests_v1';
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function load(){try{return JSON.parse(localStorage.getItem(KEY)||'[]')}catch{return[]}}
function save(v){localStorage.setItem(KEY,JSON.stringify(v))}
function addStyle(){
 if(document.getElementById('upsRepairStyle'))return;
 const s=document.createElement('style');s.id='upsRepairStyle';s.textContent=`
 #upsRepairFab{position:fixed;right:18px;bottom:18px;z-index:2147482000;border:1px solid #55e6ff;border-radius:999px;background:linear-gradient(180deg,#0a4f6d,#073247);color:#effcff;padding:12px 17px;font-weight:900;box-shadow:0 0 25px rgba(50,220,255,.28);cursor:pointer}
 #upsRepairModal{position:fixed;inset:0;z-index:2147482500;display:none;background:rgba(0,7,14,.78);backdrop-filter:blur(8px);padding:18px}
 #upsRepairModal.open{display:grid;place-items:center}
 .ups-repair-panel{width:min(94vw,620px);max-height:90vh;overflow:auto;border:1px solid rgba(82,226,255,.35);border-radius:22px;background:linear-gradient(180deg,#061d2b,#02101a);padding:18px;color:#effcff;box-shadow:0 30px 90px #0009}
 .ups-repair-head{display:flex;justify-content:space-between;align-items:center;gap:12px}.ups-repair-head h2{margin:0;font-size:20px}.ups-repair-close{width:40px;height:40px;border:1px solid #2d6c7d;border-radius:12px;background:#082534;color:#fff;font-size:20px;cursor:pointer}
 .ups-repair-grid{display:grid;gap:10px;margin-top:14px}.ups-repair-grid label{font-size:12px;color:#8fdff0}.ups-repair-grid select,.ups-repair-grid textarea{width:100%;margin-top:5px;border:1px solid #286779;border-radius:12px;background:#03141e;color:#fff;padding:12px;font:inherit}
 .ups-repair-grid textarea{min-height:120px;resize:vertical}.ups-repair-submit{min-height:48px;border:1px solid #4ae2ff;border-radius:12px;background:#0a4965;color:#fff;font-weight:900;cursor:pointer}
 .ups-repair-list{margin-top:16px;border-top:1px solid #17404c;padding-top:12px}.ups-repair-item{padding:10px 11px;border:1px solid #17404c;border-radius:12px;background:#041722;margin-top:8px}.ups-repair-item b{display:block}.ups-repair-item small{display:block;color:#83aab4;margin-top:3px}.ups-repair-status{color:#ffd082!important}
 @media(max-width:700px){#upsRepairFab{right:12px;bottom:82px;padding:11px 14px}.ups-repair-panel{padding:15px}}
 `;document.head.appendChild(s)
}
function renderList(){
 const box=document.getElementById('upsRepairList');if(!box)return;
 const rows=load().slice().reverse();
 box.innerHTML=rows.length?rows.map(x=>`<div class="ups-repair-item"><b>${esc(x.target)} / ${esc(x.site||'全体')}</b><small>${esc(x.text)}</small><small class="ups-repair-status">承認待ち</small><small>${esc(x.time)}</small></div>`).join(''):'<div style="color:#779ba5;font-size:12px">修正依頼はまだありません。</div>';
}
function mount(){
 addStyle();
 if(!document.getElementById('upsRepairFab')){
   const b=document.createElement('button');b.id='upsRepairFab';b.type='button';b.textContent='修正依頼';document.body.appendChild(b);
 }
 if(!document.getElementById('upsRepairModal')){
   const m=document.createElement('div');m.id='upsRepairModal';m.innerHTML=`
   <div class="ups-repair-panel" role="dialog" aria-modal="true">
    <div class="ups-repair-head"><div><small style="color:#6fe7ff">株式会社UP's 社内システム版</small><h2>修正依頼</h2></div><button class="ups-repair-close" type="button">×</button></div>
    <div class="ups-repair-grid">
      <label>対象<select id="upsRepairTarget"><option>配送・シフト</option><option>配送管理</option><option>売上・利益</option><option>ドライバー</option><option>社内システム画面</option><option>その他</option></select></label>
      <label>拠点<select id="upsRepairSite"><option>全体</option><option>三島市</option><option>静岡</option><option>一宮</option><option>鶴見区</option><option>中村区</option><option>滋賀</option><option>富士</option><option>駿河区遠州</option><option>名古屋R</option><option>お酒 / サカエ</option><option>AM / 秋山製麺</option></select></label>
      <label>修正内容<textarea id="upsRepairText" placeholder="例：静岡の9月シフトに中島・中村・宇野が表示されていない"></textarea></label>
      <button class="ups-repair-submit" id="upsRepairSubmit" type="button">修正依頼を送る</button>
    </div>
    <div class="ups-repair-list"><b>修正依頼履歴</b><div id="upsRepairList"></div></div>
   </div>`;document.body.appendChild(m);
 }
 const modal=document.getElementById('upsRepairModal');
 document.getElementById('upsRepairFab').onclick=()=>{modal.classList.add('open');renderList()};
 modal.querySelector('.ups-repair-close').onclick=()=>modal.classList.remove('open');
 modal.onclick=e=>{if(e.target===modal)modal.classList.remove('open')};
 document.getElementById('upsRepairSubmit').onclick=()=>{
   const target=document.getElementById('upsRepairTarget').value;
   const site=document.getElementById('upsRepairSite').value;
   const text=document.getElementById('upsRepairText').value.trim();
   if(!text){alert('修正内容を入力してください。');return}
   const rows=load();rows.push({id:'REQ-'+Date.now(),target,site,text,status:'pending',time:new Intl.DateTimeFormat('ja-JP',{dateStyle:'short',timeStyle:'short'}).format(new Date())});save(rows);
   document.getElementById('upsRepairText').value='';
   renderList();
   alert('修正依頼を承認待ちで保存しました。');
 };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();