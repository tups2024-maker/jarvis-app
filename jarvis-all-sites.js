(function(){
  'use strict';

  const CORE_MASTER='1Itlt2LkosrvNnvZrbAWb6PpeZlAQaW0hJf8CzwPfddI';
  const ENSHU_MASTER='1z6cSUsEdu929JHRbqPjp-rjDbfSOuLVATKhf6hPJHoQ';
  const TABS=['すべて','ギオン','遠州トラック','お酒','秋山製麺'];

  function tokyoParts(){
    const parts=new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'numeric'}).formatToParts(new Date());
    return {year:Number(parts.find(p=>p.type==='year')?.value||0),month:Number(parts.find(p=>p.type==='month')?.value||0)};
  }
  function monthLabel(){const p=tokyoParts();return `${p.year}年${p.month}月`;}
  function baseUrl(id){return `https://docs.google.com/spreadsheets/d/${id}/edit`;}
  function sites(){
    const label=monthLabel();
    return {
      'ギオン':[
        {label:'鶴見',group:'ギオン',master:'core',sheet:`${label} 鶴見`},
        {label:'中村区',group:'ギオン',master:'core',sheet:`${label} 中村区`},
        {label:'一宮',group:'ギオン',master:'core',sheet:`${label} 一宮`},
        {label:'静岡',group:'ギオン',master:'core',sheet:`${label} 静岡`},
        {label:'三島',group:'ギオン',master:'core',sheet:`${label} 三島`}
      ],
      '遠州トラック':[
        {label:'滋賀県野洲市',group:'遠州トラック',master:'enshu',sheet:`${label} 遠州トラック 野洲市`},
        {label:'静岡市駿河区',group:'遠州トラック',master:'enshu',sheet:`${label} 遠州トラック 駿河区`},
        {label:'富士市',group:'遠州トラック',master:'enshu',sheet:`${label} 遠州トラック 富士市`}
      ],
      'お酒':[{label:'お酒（株式会社サカエ）',group:'お酒',master:'core',sheet:`${label} 株式会社サカエ`}],
      '秋山製麺':[{label:'秋山製麺',group:'秋山製麺',master:'core',sheet:`${label} 秋山製麺所`}]
    };
  }
  function sheetUrl(site){return baseUrl(site.master==='enshu'?ENSHU_MASTER:CORE_MASTER);}

  function styles(){
    if(document.getElementById('jarvis-all-sites-style')) return;
    const style=document.createElement('style');
    style.id='jarvis-all-sites-style';
    style.textContent=`
      .jarvis-all-sites{margin:14px 0 18px;padding:14px;border:1px solid rgba(95,225,255,.34);border-radius:14px;background:rgba(4,25,39,.62);box-shadow:0 0 24px rgba(0,210,255,.08)}
      .jarvis-all-sites-head{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:10px}
      .jarvis-all-sites-head b{font-size:15px;letter-spacing:.03em;color:#dffcff}.jarvis-all-sites-head small{display:block;color:#8fb9c8;margin-top:3px}
      .jarvis-month-badge{border:1px solid rgba(95,225,255,.4);border-radius:999px;padding:7px 11px;color:#e8fbff;background:#071b27;font-weight:700}
      .jarvis-site-tabs{display:flex;gap:7px;overflow-x:auto;padding:2px 0 11px;scrollbar-width:thin}.jarvis-site-tab{white-space:nowrap;border:1px solid rgba(71,212,244,.38);background:rgba(6,38,51,.82);color:#a9dbe8;border-radius:999px;padding:8px 12px;font:inherit;font-weight:700;cursor:pointer}.jarvis-site-tab.active{background:rgba(0,165,205,.2);border-color:#66e9ff;color:#effdff;box-shadow:0 0 14px rgba(0,217,255,.16)}
      .jarvis-all-sites-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px}.jarvis-site-btn{display:flex;flex-direction:column;gap:3px;align-items:center;justify-content:center;min-height:52px;padding:9px 10px;border:1px solid rgba(66,220,255,.44);border-radius:10px;background:linear-gradient(180deg,rgba(9,66,86,.82),rgba(4,35,49,.82));color:#e9fcff;text-decoration:none;font-weight:700;text-align:center;cursor:pointer}.jarvis-site-btn small{font-size:10px;font-weight:500;color:#8fb9c8}.jarvis-site-btn:hover{border-color:#7defff;box-shadow:0 0 16px rgba(0,217,255,.18)}
      .jarvis-sync-note{grid-column:1/-1;margin-top:3px;padding:10px;border:1px dashed rgba(95,225,255,.24);border-radius:10px;color:#9bc6d3;font-size:12px;line-height:1.55}@media(max-width:640px){.jarvis-all-sites-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.jarvis-site-btn{font-size:13px}}
    `;
    document.head.appendChild(style);
  }
  function sitesFor(tab){const map=sites();return tab==='すべて'?Object.values(map).flat():(map[tab]||[]);}
  function renderButtons(panel,tab){
    const grid=panel.querySelector('.jarvis-all-sites-grid'); if(!grid)return; grid.innerHTML='';
    sitesFor(tab).forEach(site=>{
      const a=document.createElement('a');a.className='jarvis-site-btn';a.href=sheetUrl(site);a.target='_blank';a.rel='noopener noreferrer';
      a.innerHTML=`<span>${site.label}</span><small>${site.group} / ${monthLabel()}正本</small>`;a.title=`${site.sheet} を含むGoogle配送管理表を開く`;grid.appendChild(a);
    });
    const note=document.createElement('div');note.className='jarvis-sync-note';note.textContent=`${monthLabel()}を表示中。Google Sheetsを正本として、対象月タブが存在する場合はその正式版を使用します。`;grid.appendChild(note);
  }
  function setActiveTab(panel,tab){panel.dataset.activeTab=tab;panel.querySelectorAll('.jarvis-site-tab').forEach(btn=>btn.classList.toggle('active',btn.dataset.tab===tab));renderButtons(panel,tab);}
  function refreshLabels(panel){
    const label=monthLabel();const title=panel.querySelector('.jarvis-all-sites-head b'),sub=panel.querySelector('.jarvis-all-sites-head small'),badge=panel.querySelector('.jarvis-month-badge');
    if(title)title.textContent=`${label} 全配送管理表`;if(sub)sub.textContent='会社別正本 / Google Sheets連動';if(badge)badge.textContent=label;
    renderButtons(panel,panel.dataset.activeTab||'すべて');
  }
  function mount(){
    styles();const page=document.getElementById('page-workbook');if(!page)return;let panel=document.getElementById('jarvisAllSites');
    if(!panel){panel=document.createElement('section');panel.id='jarvisAllSites';panel.className='jarvis-all-sites';panel.dataset.activeTab='すべて';panel.innerHTML=`<div class="jarvis-all-sites-head"><div><b></b><small></small></div><div class="jarvis-month-badge"></div></div><div class="jarvis-site-tabs"></div><div class="jarvis-all-sites-grid"></div>`;const tabs=panel.querySelector('.jarvis-site-tabs');TABS.forEach(tab=>{const btn=document.createElement('button');btn.type='button';btn.className='jarvis-site-tab';btn.dataset.tab=tab;btn.textContent=tab;btn.addEventListener('click',()=>setActiveTab(panel,tab));tabs.appendChild(btn)});const anchor=page.querySelector('.section-head, h2, h3');if(anchor?.parentNode)anchor.parentNode.insertBefore(panel,anchor.nextSibling);else page.insertBefore(panel,page.firstChild);setActiveTab(panel,'すべて');}
    refreshLabels(panel);
  }
  const observer=new MutationObserver(()=>mount());function start(){mount();observer.observe(document.documentElement,{subtree:true,childList:true});setInterval(()=>{const p=document.getElementById('jarvisAllSites');if(p)refreshLabels(p)},60000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start,{once:true});else start();
})();
