(()=>{
  'use strict';
  const API='https://jarvis-api.t-ups2024.workers.dev';
  const AREAS=[['all','全拠点'],['mishima','三島'],['shizuoka','静岡・駿河'],['fuji','富士'],['ichinomiya','一宮'],['nakamura','中村区'],['yasu','野洲'],['rocket','ロケットナウ']];
  const state={area:localStorage.getItem('ups-shift-area')||'all',data:null,month:'',start:3,days:31};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const norm=v=>String(v??'').replace(/[\s　]/g,'').trim();
  const isOff=v=>/^(休|休み|×|欠車|-|－)$/.test(norm(v));

  function classify(raw){
    const v=norm(raw);if(!v||isOff(v))return[];
    const a=[];
    if(/ロケット|R$/.test(v))a.push('rocket');
    if(/一宮/.test(v))a.push('ichinomiya');
    if(/静岡|駿河/.test(v))a.push('shizuoka');
    if(/富士/.test(v))a.push('fuji');
    if(/野洲|滋賀/.test(v))a.push('yasu');
    if(/中村|名古屋/.test(v)&&!/R$/.test(v))a.push('nakamura');
    if(!a.length&&/^(〇|○|O|A|AM|CX|MX|研|研修|お酒|製麺|下田|卸)/.test(v))a.push('mishima');
    if(/三島|秋山|サカエ/.test(v))a.push('mishima');
    return[...new Set(a)];
  }

  function findMonth(values){
    const h=values?.[0]||[];let best={start:3,len:0};
    for(let c=3;c<h.length;c++){
      if(Number(h[c])!==1)continue;
      let len=1;while(c+len<h.length&&Number(h[c+len])===len+1)len++;
      if(len>best.len)best={start:c,len};
    }
    const m=String(state.data?.sheetName||'').match(/(20\d{2})年(\d{1,2})月/);
    state.month=m?`${m[1]}年${Number(m[2])}月`:'';state.start=best.start;state.days=Math.min(best.len||31,31);
  }

  function rowsFor(area){
    return(state.data?.values||[]).slice(5).map(row=>{
      const name=String(row?.[2]||'').trim();if(!name)return null;
      const shifts=Array.from({length:state.days},(_,d)=>{
        const raw=String(row?.[state.start+d]??'').trim();
        return area==='all'?raw:(classify(raw).includes(area)?raw:'');
      });
      return shifts.some(v=>v&&!isOff(v))?{name,shifts}:null;
    }).filter(Boolean);
  }

  function addStyle(){
    if(document.getElementById('ups-shift-sites-style'))return;
    const s=document.createElement('style');s.id='ups-shift-sites-style';
    s.textContent='.ups-site-shift{margin-top:14px;border:1px solid rgba(83,226,255,.28);border-radius:16px;background:#03131e;padding:13px;overflow:hidden}.ups-site-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}.ups-site-head h3{margin:0;font-size:16px}.ups-site-head small{color:#7bdff1}.ups-site-tabs{display:flex;gap:7px;overflow-x:auto;padding:2px 0 9px}.ups-site-tab{flex:0 0 auto;border:1px solid #275e6d;border-radius:999px;background:#061d28;color:#a9d7df;padding:8px 12px;font-weight:750;cursor:pointer}.ups-site-tab.active{border-color:#50e5ff;background:#0b3b51;color:#fff}.ups-shift-scroll{overflow:auto;border:1px solid #17404c;border-radius:12px;max-height:58vh}.ups-shift-table{border-collapse:separate;border-spacing:0;min-width:max-content;width:100%;background:#021018}.ups-shift-table th,.ups-shift-table td{padding:7px 8px;border-right:1px solid #143a46;border-bottom:1px solid #143a46;text-align:center;font-size:11px;min-width:39px}.ups-shift-table th{position:sticky;top:0;background:#082633;color:#82e9fa;z-index:2}.ups-shift-table th:first-child,.ups-shift-table td:first-child{position:sticky;left:0;min-width:104px;text-align:left;background:#061c27;z-index:1}.ups-shift-table th:first-child{z-index:3}.ups-shift-on{color:#eaffff;background:#083247}.ups-shift-empty{padding:22px;text-align:center;color:#8fb5bf}.ups-site-foot{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:9px;color:#7ea6b0;font-size:11px}.ups-shift-refresh{border:1px solid #286778;border-radius:9px;background:#082735;color:#ddfaff;padding:7px 10px;cursor:pointer}';
    document.head.appendChild(s);
  }

  function mount(){
    const target=document.querySelector('#shift')||document.querySelector('#ops');
    if(!target)return null;let box=document.getElementById('upsSiteShift');if(box)return box;
    box=document.createElement('div');box.id='upsSiteShift';box.className='ups-site-shift';
    box.innerHTML='<div class="ups-site-head"><div><small>GOOGLE SHIFT / LIVE</small><h3>拠点別シフト</h3></div><button class="ups-shift-refresh" type="button">再読込</button></div><div class="ups-site-tabs"></div><div class="ups-shift-body"><div class="ups-shift-empty">シフトを読み込み中です…</div></div><div class="ups-site-foot"><span>Google正本から自動取得</span><span class="ups-shift-updated">—</span></div>';
    target.appendChild(box);box.querySelector('.ups-shift-refresh').onclick=load;return box;
  }

  function render(){
    const box=mount();if(!box)return;
    const tabs=box.querySelector('.ups-site-tabs');
    tabs.innerHTML=AREAS.map(([id,label])=>`<button class="ups-site-tab${state.area===id?' active':''}" data-area="${id}" type="button">${label}</button>`).join('');
    tabs.querySelectorAll('[data-area]').forEach(b=>b.onclick=()=>selectArea(b.dataset.area));
    const rows=rowsFor(state.area),label=AREAS.find(x=>x[0]===state.area)?.[1]||'全拠点';
    box.querySelector('.ups-shift-body').innerHTML=rows.length?`<div class="ups-shift-scroll"><table class="ups-shift-table"><thead><tr><th>${esc(label)}</th>${Array.from({length:state.days},(_,i)=>`<th>${i+1}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.name)}</td>${r.shifts.map(v=>`<td class="${v&&!isOff(v)?'ups-shift-on':''}">${esc(v||'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:'<div class="ups-shift-empty">この拠点のシフトはありません。</div>';
    box.querySelector('.ups-shift-updated').textContent=`${state.month} / ${new Intl.DateTimeFormat('ja-JP',{hour:'2-digit',minute:'2-digit'}).format(new Date())}更新`;
  }

  function selectArea(area){
    if(!AREAS.some(x=>x[0]===area))area='all';state.area=area;localStorage.setItem('ups-shift-area',area);render();
    document.querySelector('#shift,#ops')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  async function load(){
    const box=mount();if(!box)return;box.querySelector('.ups-shift-body').innerHTML='<div class="ups-shift-empty">シフトを読み込み中です…</div>';
    try{
      const res=await fetch(`${API}/shift?t=${Date.now()}`,{cache:'no-store'}),json=await res.json();
      if(!res.ok||!json.success||!json.data?.values)throw new Error(json?.error||'取得失敗');
      state.data=json.data;findMonth(json.data.values);render();
    }catch(e){box.querySelector('.ups-shift-body').innerHTML='<div class="ups-shift-empty">シフトを取得できませんでした。再読込してください。</div>'}
  }

  window.UPS_SHIFT_SITES={load,selectArea,show(area='all'){
    const id=document.querySelector('#shift')?'shift':'ops';
    const nav=document.querySelector(`[data-go="${id}"]`);if(nav)nav.click();selectArea(area);load();
  }};
  function init(){addStyle();mount();load()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
