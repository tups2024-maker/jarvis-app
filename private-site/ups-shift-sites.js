(()=>{
  'use strict';

  const API='https://jarvis-api.t-ups2024.workers.dev';
  const CORE='1Itlt2LkosrvNnvZrbAWb6PpeZlAQaW0hJf8CzwPfddI';
  const ENSHU='1r9FHCprJY8OamZzFakNPPiyYSxZBlfCvjQvvKKmLtpc';
  const SHIGA='162oC1bZ5b2na_7Kr0r-Z7FEOpEa_sycv-aKDzGP1CrE';
  const ICHINOMIYA='1P1MYU4TonLaxhzjbM8JVZBi3DR8PmDONyfcu0ARyEiM';
  const SURUGA='19HbkZYZgpDLNVpyBfeEikhlXkmGLWb0a68hIS5EulJ4';
  const TSURUMI='1kfKxe39e9GHaIEGJV-THWVfulp6TqGVv4oL_P89wa04';
  const SHIFT_MASTER='1cc2b-7mvljP42SIIBZketcvyEb0TQSd9iwAm05OtVWs';
  const MASTER_UPS_GID='280575530';

  const SITES=[
    {id:'all',label:'全拠点',group:'一覧'},
    {id:'mishima',label:'三島市',group:'GION',mode:'api'},
    {id:'shizuoka',label:'静岡',group:'GION',book:SURUGA,gid:'458098367',nextGid:'788842575',switchOn:'2026-09-18',tab:'シフト入力8/1~',nextTab:'DCJ3(9/18~)',caption:'静岡駿河DS DAシフト表'},
    {id:'ichinomiya',label:'一宮',group:'GION',book:ICHINOMIYA,gid:'83965649',tab:'2026年9月 一宮  ',caption:'愛知 一宮シフト 新'},
    {id:'tsurumi',label:'鶴見区',group:'GION',book:TSURUMI,gid:'954430544',tab:'2026年9月(鶴見区) ',caption:'鶴見DSシフト'},
    {id:'nakamura',label:'中村区',group:'GION',book:CORE,gid:'1241751568',tab:'2026年9月 中村区  ',caption:'配送管理表 正本（シフト反映）'},
    {id:'enshu-yasu',label:'滋賀',group:'遠州トラック',book:SHIGA,gid:'821349324',tab:'2026年9月(野洲) 遠州  ',caption:'滋賀 スプレッド正本'},
    {id:'enshu-fuji',label:'富士',group:'遠州トラック',book:ENSHU,gid:'169402149',tab:'2026年9月(富士・駿河) 遠州 ',caption:'遠州トラック正本 / 富士'},
    {id:'enshu-suruga',label:'駿河区遠州',group:'遠州トラック',book:ENSHU,gid:'169402149',tab:'2026年9月(富士・駿河) 遠州 ',caption:'遠州トラック正本 / 駿河区'}
  ];

  const DELIVERY_SITES=[
    {label:'三島市',group:'GION',book:CORE,gid:'283632455',tab:'2026年9月 三島 '},
    {label:'静岡',group:'GION',book:CORE,gid:'2051049705',tab:'2026年9月 静岡 '},
    {label:'一宮',group:'GION',book:CORE,gid:'902048376',tab:'2026年9月 一宮  '},
    {label:'鶴見区',group:'GION',book:CORE,gid:'107675747',tab:'2026年9月 鶴見 '},
    {label:'中村区',group:'GION',book:CORE,gid:'1241751568',tab:'2026年9月 中村区  '},
    {label:'滋賀',group:'遠州トラック',book:SHIGA,gid:'821349324',tab:'2026年9月(野洲) 遠州  ',note:'シフト正本から配送管理へ反映'},
    {label:'富士',group:'遠州トラック',book:ENSHU,gid:'169402149',tab:'2026年9月(富士・駿河) 遠州 ',note:'富士セクションを使用'},
    {label:'駿河区遠州',group:'遠州トラック',book:ENSHU,gid:'169402149',tab:'2026年9月(富士・駿河) 遠州 ',note:'遠州トラック駿河DSセクションを使用'},
    {label:'名古屋R',group:'ロケットナウ',book:SHIFT_MASTER,gid:MASTER_UPS_GID,tab:'UPs',note:'名古屋 / R の案件コードだけをロケットナウとして仕分け'},
    {label:'お酒',group:'株式会社サカエ',book:CORE,gid:'306319410',tab:'2026年9月 株式会社サカエ '},
    {label:'AM',group:'秋山製麺',book:CORE,gid:'350367810',tab:'2026年9月 秋山製麺所 '}
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
    s.textContent='.ups-site-shift,.ups-delivery-sites{margin-top:14px;border:1px solid rgba(83,226,255,.28);border-radius:16px;background:#03131e;padding:13px;overflow:hidden}.ups-site-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:9px}.ups-site-head h3{margin:0;font-size:16px}.ups-site-head small{color:#7bdff1}.ups-site-tabs{display:flex;gap:7px;overflow-x:auto;padding:2px 0 9px}.ups-site-tab{flex:0 0 auto;border:1px solid #275e6d;border-radius:999px;background:#061d28;color:#a9d7df;padding:8px 12px;font-weight:750;cursor:pointer}.ups-site-tab.active{border-color:#50e5ff;background:#0b3b51;color:#fff}.ups-shift-scroll{overflow:auto;border:1px solid #17404c;border-radius:12px;max-height:58vh}.ups-shift-table{border-collapse:separate;border-spacing:0;min-width:max-content;width:100%;background:#021018}.ups-shift-table th,.ups-shift-table td{padding:7px 8px;border-right:1px solid #143a46;border-bottom:1px solid #143a46;text-align:center;font-size:11px;min-width:39px}.ups-shift-table th{position:sticky;top:0;background:#082633;color:#82e9fa;z-index:2}.ups-shift-table th:first-child,.ups-shift-table td:first-child{position:sticky;left:0;min-width:104px;text-align:left;background:#061c27;z-index:1}.ups-shift-table th:first-child{z-index:3}.ups-shift-on{color:#eaffff;background:#083247}.ups-shift-empty{padding:22px;text-align:center;color:#8fb5bf}.ups-site-foot{display:flex;justify-content:space-between;gap:8px;align-items:center;margin-top:9px;color:#7ea6b0;font-size:11px}.ups-shift-refresh,.ups-sheet-open{border:1px solid #286778;border-radius:9px;background:#082735;color:#ddfaff;padding:7px 10px;cursor:pointer;text-decoration:none;font-weight:700}.ups-sheet-open.primary{display:flex;min-height:70px;align-items:center;justify-content:center;text-align:center;border-color:#50e5ff;background:linear-gradient(135deg,#075675,#0a2d62);font-size:15px}.ups-shift-source-head{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 1px}.ups-shift-source-head b{display:block;color:#eaffff}.ups-shift-source-head small{color:#7ea6b0}.ups-source-frame{height:56vh;min-height:420px;border:1px solid #17404c;border-radius:12px;overflow:hidden;background:#fff}.ups-source-frame iframe{width:100%;height:100%;border:0;background:#fff}.ups-source-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:9px}.ups-site-groups{display:grid;gap:12px}.ups-site-group{border:1px solid #17404c;border-radius:13px;padding:11px;background:#041923}.ups-site-group h4{margin:0 0 9px;color:#72e7f8}.ups-site-cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(135px,1fr));gap:8px}.ups-site-card{border:1px solid #275e6d;border-radius:11px;background:#072330;color:#eaffff;padding:12px;text-align:left;cursor:pointer;text-decoration:none}.ups-site-card b,.ups-site-card small{display:block}.ups-site-card small{margin-top:4px;color:#7ea6b0}.ups-site-note{padding:8px 2px;color:#8fb5bf;font-size:11px}';
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
    const groups=['GION','遠州トラック'];
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
    return `<div class="ups-shift-source-head"><div><b>${esc(r.group)} / ${esc(r.label)}</b><small>${esc(r.caption)}・${esc(r.tab)}</small></div><span>正本LIVE</span></div>
      <div class="ups-source-frame"><iframe src="${sheetUrl(r,true)}" title="${esc(r.label)} シフト正本" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe></div>
      <div class="ups-source-actions"><a class="ups-sheet-open" href="${sheetUrl(r)}" target="_blank" rel="noopener">正本を別画面で開く</a><span class="ups-site-note">JARVIS内で三島市と同じ画面から確認できます。表示できない場合だけ正本を別画面で開いてください。</span></div>`;
  }

  function deliveryUrl(s){return`https://docs.google.com/spreadsheets/d/${s.book}/edit#gid=${encodeURIComponent(s.gid)}`}
  function renderDeliveryGroup(group){
    const rows=DELIVERY_SITES.filter(s=>s.group===group);
    return`<section class="ups-site-group"><h4>${esc(group)}</h4><div class="ups-site-cards">${rows.map(s=>`<a class="ups-site-card" href="${deliveryUrl(s)}" target="_blank" rel="noopener"><b>${esc(s.label)}</b><small>${esc(s.tab)}</small>${s.note?`<small>${esc(s.note)}</small>`:''}</a>`).join('')}</div></section>`;
  }
  function mountDelivery(){
    const target=document.querySelector('#delivery')||document.querySelector('#ops');if(!target)return;
    let box=document.getElementById('upsDeliverySites');if(box)return;
    box=document.createElement('section');box.id='upsDeliverySites';box.className='ups-delivery-sites';
    box.innerHTML=`<div class="ups-site-head"><div><small>DELIVERY ROUTING / SOURCE OF TRUTH</small><h3>配送管理表の仕分け</h3></div></div>
<div class="ups-source-actions" style="margin-bottom:12px">
  <a class="ups-sheet-open primary" href="https://docs.google.com/spreadsheets/d/${CORE}/edit" target="_blank" rel="noopener">配送管理表 正本を開く</a>
  <a class="ups-sheet-open" href="https://docs.google.com/spreadsheets/d/${SHIFT_MASTER}/edit#gid=${MASTER_UPS_GID}" target="_blank" rel="noopener">9月DAシフト正本を開く</a>
  <a class="ups-sheet-open" href="https://docs.google.com/spreadsheets/d/${CORE}/edit#gid=208595120" target="_blank" rel="noopener">2026年8月 三島</a>
  <a class="ups-sheet-open" href="https://docs.google.com/spreadsheets/d/${CORE}/edit#gid=442837635" target="_blank" rel="noopener">2026年7月 三島</a>
</div>
<div class="ups-site-note" style="margin-bottom:10px">配送管理表の過去月データは正本内に残っています。2026年8月・7月・6月…2023年8月まで確認できます。</div>
<div class="ups-site-groups">${renderDeliveryGroup('GION')}${renderDeliveryGroup('遠州トラック')}${renderDeliveryGroup('ロケットナウ')}${renderDeliveryGroup('株式会社サカエ')}${renderDeliveryGroup('秋山製麺')}</div>
<div class="ups-site-note">仕分け固定：GION＝三島市・静岡・一宮・鶴見区・中村区 / 遠州トラック＝滋賀・富士・駿河区遠州 / 名古屋R＝ロケットナウ / お酒＝株式会社サカエ / AM＝秋山製麺。拠点名・案件元を先に判定し、文字の部分一致だけでは分類しません。</div>`;
    target.appendChild(box);
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

  function init(){addStyle();mount();mountDelivery();render();load()}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
