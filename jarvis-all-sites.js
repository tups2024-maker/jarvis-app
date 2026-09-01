(function(){
  'use strict';

  const MAIN_ID='1Itlt2LkosrvNnvZrbAWb6PpeZlAQaW0hJf8CzwPfddI';
  const ENSHU_ID='1hHAtTH_ZbqN2pBR357_96F9wewb8owy3bjmWa56TVxM';

  const AUGUST={
    'ギオン':[
      {label:'鶴見',sheet:'2026年8月 鶴見',spreadsheetId:MAIN_ID,gid:1981245666},
      {label:'中村区',sheet:'2026年8月 中村区',spreadsheetId:MAIN_ID,gid:511952311},
      {label:'一宮',sheet:'2026年8月 一宮',spreadsheetId:MAIN_ID,gid:500026506},
      {label:'静岡',sheet:'2026年8月 静岡',spreadsheetId:MAIN_ID,gid:852874452},
      {label:'三島',sheet:'2026年8月 三島',spreadsheetId:MAIN_ID,gid:208595120}
    ],
    '遠州トラック':[
      {label:'滋賀県野洲市',sheet:'2026年8月 野洲市　遠州トラック ',spreadsheetId:ENSHU_ID,gid:225833391},
      {label:'静岡市駿河区',sheet:'2026年8月 静岡 遠州トラック  ',spreadsheetId:ENSHU_ID,gid:2049835654},
      {label:'富士市',sheet:'2026年8月 富士 遠州トラック ',spreadsheetId:ENSHU_ID,gid:255167677}
    ],
    'お酒':[
      {label:'お酒（株式会社サカエ）',sheet:'2026年8月 株式会社サカエ',spreadsheetId:MAIN_ID,gid:605561015}
    ],
    '秋山製麺':[
      {label:'秋山製麺',sheet:'2026年8月 秋山製麺所',spreadsheetId:MAIN_ID,gid:1803015733}
    ]
  };

  const TABS=['すべて','ギオン','遠州トラック','お酒','秋山製麺'];

  function sheetUrl(site){
    return 'https://docs.google.com/spreadsheets/d/'+site.spreadsheetId+'/edit#gid='+site.gid;
  }

  function styles(){
    if(document.getElementById('jarvis-all-sites-style')) return;
    const style=document.createElement('style');
    style.id='jarvis-all-sites-style';
    style.textContent=`
      .jarvis-all-sites{margin:14px 0 18px;padding:14px;border:1px solid rgba(95,225,255,.34);border-radius:14px;background:rgba(4,25,39,.62);box-shadow:0 0 24px rgba(0,210,255,.08)}
      .jarvis-all-sites-head{display:flex;gap:10px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin-bottom:10px}
      .jarvis-all-sites-head b{font-size:15px;letter-spacing:.03em;color:#dffcff}
      .jarvis-all-sites-head small{display:block;color:#8fb9c8;margin-top:3px}
      .jarvis-month-badge{border:1px solid rgba(95,225,255,.4);border-radius:999px;padding:7px 11px;color:#e8fbff;background:#071b27;font-weight:700}
      .jarvis-site-tabs{display:flex;gap:7px;overflow-x:auto;padding:2px 0 11px;scrollbar-width:thin}
      .jarvis-site-tab{white-space:nowrap;border:1px solid rgba(71,212,244,.38);background:rgba(6,38,51,.82);color:#a9dbe8;border-radius:999px;padding:8px 12px;font:inherit;font-weight:700;cursor:pointer}
      .jarvis-site-tab.active{background:rgba(0,165,205,.2);border-color:#66e9ff;color:#effdff;box-shadow:0 0 14px rgba(0,217,255,.16)}
      .jarvis-all-sites-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(145px,1fr));gap:8px}
      .jarvis-site-btn{display:flex;flex-direction:column;gap:3px;align-items:center;justify-content:center;min-height:52px;padding:9px 10px;border:1px solid rgba(66,220,255,.44);border-radius:10px;background:linear-gradient(180deg,rgba(9,66,86,.82),rgba(4,35,49,.82));color:#e9fcff;text-decoration:none;font-weight:700;text-align:center;cursor:pointer}
      .jarvis-site-btn small{font-size:10px;font-weight:500;color:#8fb9c8}
      .jarvis-site-btn:hover{border-color:#7defff;box-shadow:0 0 16px rgba(0,217,255,.18)}
      .jarvis-sync-note{grid-column:1/-1;margin-top:3px;padding:10px;border:1px dashed rgba(95,225,255,.24);border-radius:10px;color:#9bc6d3;font-size:12px;line-height:1.55}
      @media(max-width:640px){.jarvis-all-sites-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.jarvis-site-btn{font-size:13px}}
    `;
    document.head.appendChild(style);
  }

  function sitesFor(tab){
    if(tab==='すべて') return Object.entries(AUGUST).flatMap(([group,sites])=>sites.map(site=>({...site,group})));
    return (AUGUST[tab]||[]).map(site=>({...site,group:tab}));
  }

  function renderButtons(panel,tab){
    const grid=panel.querySelector('.jarvis-all-sites-grid');
    grid.innerHTML='';
    sitesFor(tab).forEach(site=>{
      const a=document.createElement('a');
      a.className='jarvis-site-btn';
      a.href=sheetUrl(site);
      a.target='_blank';
      a.rel='noopener noreferrer';
      a.innerHTML='<span>'+site.label+'</span><small>'+site.group+' / 8月正本</small>';
      a.title=site.label+'の2026年8月配送管理表を開く';
      grid.appendChild(a);
    });
    const note=document.createElement('div');
    note.className='jarvis-sync-note';
    note.textContent='表示対象は2026年8月のみ。分類は正本の請求先・案件に合わせて固定しています。';
    grid.appendChild(note);
  }

  function setActiveTab(panel,tab){
    panel.dataset.activeTab=tab;
    panel.querySelectorAll('.jarvis-site-tab').forEach(btn=>btn.classList.toggle('active',btn.dataset.tab===tab));
    renderButtons(panel,tab);
  }

  function mount(){
    styles();
    const page=document.getElementById('page-workbook');
    if(!page || document.getElementById('jarvisAllSites')) return;

    const panel=document.createElement('section');
    panel.id='jarvisAllSites';
    panel.className='jarvis-all-sites';
    panel.dataset.activeTab='すべて';
    panel.innerHTML=`
      <div class="jarvis-all-sites-head">
        <div><b>2026年8月 全配送管理表</b><small>正本の分類に合わせて固定 / 9月は表示しません</small></div>
        <div class="jarvis-month-badge">2026年8月のみ</div>
      </div>
      <div class="jarvis-site-tabs"></div>
      <div class="jarvis-all-sites-grid"></div>
    `;

    const tabs=panel.querySelector('.jarvis-site-tabs');
    TABS.forEach(tab=>{
      const btn=document.createElement('button');
      btn.type='button';
      btn.className='jarvis-site-tab';
      btn.dataset.tab=tab;
      btn.textContent=tab;
      btn.addEventListener('click',()=>setActiveTab(panel,tab));
      tabs.appendChild(btn);
    });

    const anchor=page.querySelector('.section-head, h2, h3');
    if(anchor && anchor.parentNode) anchor.parentNode.insertBefore(panel,anchor.nextSibling);
    else page.insertBefore(panel,page.firstChild);

    setActiveTab(panel,'すべて');
  }

  const observer=new MutationObserver(()=>mount());
  function start(){
    mount();
    observer.observe(document.documentElement,{subtree:true,childList:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
