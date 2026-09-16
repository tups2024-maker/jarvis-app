(()=>{
  'use strict';

  const API='https://jarvis-api.t-ups2024.workers.dev';
  const CORE='1Itlt2LkosrvNnvZrbAWb6PpeZlAQaW0hJf8CzwPfddI';
  const ENSHU='1z6cSUsEdu929JHRbqPjp-rjDbfSOuLVATKhf6hPJHoQ';
  const ICHINOMIYA='1cc2b-7mvljP42SIIBZketcvyEb0TQSd9iwAm05OtVWs';
  const SURUGA='19HbkZYZgpDLNVpyBfeEikhlXkmGLWb0a68hIS5EulJ4';
  const TSURUMI='1kfKxe39e9GHaIEGJV-THWVfulp6TqGVv4oL_P89wa04';

  const SITES=[
    {id:'all',label:'全拠点',group:'一覧'},
    {id:'mishima',label:'三島',group:'ギオン',mode:'api'},
    {id:'ichinomiya',label:'一宮',group:'ギオン',book:ICHINOMIYA,gid:'280575530',tab:'UPs',caption:'2026年9月DAシフト / UPs'},
    {id:'shizuoka',label:'駿河区',group:'ギオン',book:SURUGA,gid:'458098367',nextGid:'788842575',switchOn:'2026-09-18',tab:'シフト入力8/1~',nextTab:'DCJ3(9/18~)',caption:'静岡駿河DS DAシフト表'},
    {id:'tsurumi',label:'鶴見',group:'ギオン',book:TSURUMI,gid:'954430544',tab:'2026年9月(鶴見区)',caption:'鶴見DSシフト'},
    {id:'nakamura',label:'中村区',group:'ギオン',book:CORE,gid:'1241751568',tab:'2026年9月 中村区',caption:'配送管理表 正本'},
    {id:'enshu-yasu',label:'遠州野洲',group:'遠州トラック',book:ENSHU,gid:'2050990999',tab:'2026年9月 野洲市 遠州トラック',caption:'遠州トラック正本'},
    {id:'enshu-suruga',label:'遠州駿河',group:'遠州トラック',book:ENSHU,gid:'1543564420',tab:'2026年9月 静岡 遠州トラック',caption:'遠州トラック正本'},
    {id:'enshu-fuji',label:'遠州富士',group:'遠州トラック',book:ENSHU,gid:'1914323243',tab:'2026年9月 富士 遠州トラック',caption:'遠州トラック正本'}
  ];

  const state={area:localStorage.getItem('ups-shift-area-v2')||'all',data:null,month:'',start:3,days:31,loading:false};
  const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const site=id=>SITES.find(x=>x.id===id)||SITES[0];
  const isOff=v=>/^(休|休み|×|欠車|-|－)$/.test(String(v??'').replace(/[\s　]/g,''));

  function tokyoDate(){
    return new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  }

  function resolved(s){
    if(s.switchOn&&tokyoDate()>=s.switchOn)return{...s,gid:s.nextGid,tab:s.nextTab};
    return s;
  }

  function sheetUrl(s,preview=false){
    const r=resolved(s);if(!r.book)return'#';
    return preview
      ?`https://docs.google.com/spreadsheets/d/${r.book}/preview?gid=${encodeURIComponent(r.gid)}&rm=minimal&widget=true&headers=false`
      :`https://docs.google.com/spreadsheets/d/${r.book}/edit#gid=${encodeURIComponent(r.gid)}`;
  }

  function findMonth(values){
    const h=values?.[0]||[];let best={start:3,len:0};
    for(let c=3;c<h.length;c++){
      if(Number(h[c])!==1)continue;
      let len=1;while(c+len<h.length&&Number(h[c+len])===len+1)len++;
      if(len>best.len)best={start:c,len};
    }
    const m=String(state.data?.sheetName||'').match(/(20\d{2})年(\d{1,2})月/);
    state.month=m?`${m[1]}年${Number(m[2])}月`:'2026年9月';state.start=best.start;state.days=Math.min(best.len||31,31);
  }

  function mishimaRows(){
    return(state.data?.values||[]).slice(5).map(row=>{
      const name=String(row?.[2]||'').trim();if(!name)return null;
      const shifts=Array.from({length:state.days},(_,d)=>String(row?.[state.start+d]??'').trim());
      return shifts.some(v=>v&&!isOff(v))?{name,shifts}:null;
    }).filter(Boolean);
  }

  function addStyle(){
    if(document.getElementById('ups-shift-sites-style'))return;
    const s=document.createElement('style');s.id='ups-shift-sites-style';
    s.textContent='.ups-site-shift{margin-top:14px;border:1px solid rgba(83,226,255,.28);border-radius:16px;background:#03131e;padding:13px;overflow:hidden}.ups-site-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}.ups-site-head h3{margin:0;font-size:16px}.ups-site-head small{color:#7bdff1}.ups-site-tabs{display:flex;gap:7px;overflow-x:auto;padding:2px 0 9px}.ups-site-tab{flex:0 0 auto;border:1px solid #275e6d;border-radius:999px;background:#061d28;color:#a9d7df;padding:8px 12px;font-weight:750;cursor:pointer}.ups-site-tab.active{border-color:#50e5ff;background:#0b3b51;color:#fff}.ups-shift-scroll{overflow:auto;border:1px solid #17404c;border-radius:12px;max-height:58vh}.ups-shift-table{border-collapse:separate;border-spacing:0;min-width:max-content;width:100%;background:#021018}.ups-shift-table th,.ups-shift-table td{padding:7px 8px;border-right:1px solid #143a46;border-bottom:1px solid #143a46;text-align:center;font-size:11px;min-width:39px}.ups-shift-table th{position:sticky;top:0;background:#082633;color:#82e9fa;z-index:2}.ups-shift-table th:first-child,.ups-shift-table td:first-child{position:sticky;left:0;min-width:104px;text-align:left;background:#061c27;z-index:1}.ups-shift-table th:first-child{z-index:3}.ups-shift-on{color:#eaffff;background:#083247}.ups-shift-empty{padding:22px;text-align:center;color:#8fb5bf}.ups-site-foot{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:9px;color:#7ea6b0;font-size:11px}.ups-shift-refresh,.ups-sheet-open{border:1px solid #286778;border-radius:9px;background:#082735;color:#ddfaff;padding:7px 10px;cursor:pointer;text-decoration:none;font-weight:700}.ups-shift-source-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 1px}.ups-shift-source-head b{display:block;color:#eaffff}.ups-shift-source-head small{color:#7ea6b0}.ups-sheet-frame{width:100%;height:64vh;min-height:430px;border:1px solid #17404c;border-radius:12px;background:#fff}.ups-site-groups{display:grid;gap:12px}.ups-site-group{border:1px solid #17404c;border-radius:13px;padding:11px;background:#041923}.ups-site-group h4{margin:0 0 9px;color:#72e7f8}.ups-site-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px}.ups-site-card{border:1px solid #275e6d;border-radius:11px;background:#072330;color:#eaffff;padding:12px;text-align:left;cursor:pointer}.ups-site-card b,.ups-site-card small{display:block}.ups-site-card small{margin-top:4px;color:#7ea6b0}.ups-site-note{padding:8px 2px;color:#8fb5bf;font-size:11px}';
    document.head.appendChild(s);
  }

  function mount(){
    const target=document.querySelector('#shift')||document.querySelector('#ops');
    if(!target)return null;let box=document.getElementById('upsSiteShift');if(box)return box;
    box=document.createElement('div');box.id='upsSiteShift';box.className='ups-site-shift';
    box.innerHTML='<div class="ups-site-head"><div><small>GOOGLE SHIFT / LIVE</small><h3>拠点別シフト</h3></div><button class="ups-shift-refresh" type="button">再読込</button></div><div class="ups-site-tabs"></div><div class="ups-shift-body"><div class="ups-shift-empty">シフトを読み込み中です…</div></div><div class="ups-site-foot"><span>各拠点の正本を直接表示</span><span class="ups-shift-updated">—</span></div>';
    target.appendChild(box);box.querySelector('.ups-shift-refresh').onclick=load;return box;
  }

  function renderOverview(){
    const groups=['ギオン','遠州トラック'];
    return`<div class="ups-site-groups">${groups.map(group=>`<section class="ups-site-group"><h4>${esc(group)}</h4><div class="ups-site-cards">${SITES.filter(s=>s.group===group).map(s=>`<button class="ups-site-card" data-site-card="${esc(s.id)}" type="button"><b>${esc(s.label)}</b><small>${esc(s.caption||'シフト正本')}</small></button>`).join('')}</div></section>`).join('')}</div><div class="ups-site-note">拠点を選ぶと、その拠点の正本だけを表示します。</div>`;
  }

  function renderMishima(){
    if(state.loading&&!state.data)return'<div class="ups-shift-empty">三島シフトを読み込み中です…</div>';
    const rows=mishimaRows();
    if(!rows.length)return'<div class="ups-shift-empty">三島シフトを取得できませんでした。再読込してください。</div>';
    return`<div class="ups-shift-scroll"><table class="ups-shift-table"><thead><tr><th>三島</th>${Array.from({length:state.days},(_,i)=>`<th>${i+1}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr><td>${esc(r.name)}</td>${r.shifts.map(v=>`<td class="${v&&!isOff(v)?'ups-shift-on':''}">${esc(v||'')}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
  }

  function renderSource(s){
    const r=resolved(s);
    return`<div class="ups-shift-source-head"><div><b>${esc(r.group)} / ${esc(r.label)}</b><small>${esc(r.caption)}・${esc(r.tab)}</small></div><a class="ups-sheet-open" href="${sheetUrl(r)}" target="_blank" rel="noopener">正本を開く</a></div><iframe class="ups-sheet-frame" title="${esc(r.label)}シフト" src="${sheetUrl(r,true)}" loading="lazy"></iframe><div class="ups-site-note">表示されない場合は「正本を開く」を押してください。</div>`;
  }

  function render(){
    const box=mount();if(!box)return;
    if(!SITES.some(x=>x.id===state.area))state.area='all';
    const tabs=box.querySelector('.ups-site-tabs');
    tabs.innerHTML=SITES.map(s=>`<button class="ups-site-tab${state.area===s.id?' active':''}" data-area="${esc(s.id)}" type="button">${esc(s.label)}</button>`).join('');
    tabs.querySelectorAll('[data-area]').forEach(b=>b.onclick=()=>selectArea(b.dataset.area));
    const current=site(state.area),body=box.querySelector('.ups-shift-body');
    body.innerHTML=current.id==='all'?renderOverview():current.mode==='api'?renderMishima():renderSource(current);
    body.querySelectorAll('[data-site-card]').forEach(b=>b.onclick=()=>selectArea(b.dataset.siteCard));
    box.querySelector('.ups-shift-updated').textContent=`${state.month||'2026年9月'} / ${new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit'}).format(new Date())}確認`;
  }

  function selectArea(area){
    state.area=SITES.some(x=>x.id===area)?area:'all';localStorage.setItem('ups-shift-area-v2',state.area);render();
    document.querySelector('#shift,#ops')?.scrollIntoView({behavior:'smooth',block:'start'});
  }

  async function load(){
    state.loading=true;render();
    try{
      const res=await fetch(`${API}/shift?t=${Date.now()}`,{cache:'no-store'}),json=await res.json();
      if(!res.ok||!json.success||!json.data?.values)throw new Error(json?.error||'取得失敗');
      state.data=json.data;findMonth(json.data.values);
    }catch(e){state.data=null}finally{state.loading=false;render()}
  }

  window.UPS_SHIFT_SITES={load,selectArea,show(area='all'){
    const aliases={yasu:'enshu-yasu',fuji:'enshu-fuji',suruga:'shizuoka'};area=aliases[area]||area;
    const id=document.querySelector('#shift')?'shift':'ops';
    const nav=document.querySelector(`[data-go="${id}"]`);if(nav)nav.click();selectArea(area);if(area==='mishima')load();
  }};

  function init(){addStyle();mount();render();load()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
