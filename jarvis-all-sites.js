(function(){
  'use strict';

  const SPREADSHEET_ID='1Itlt2LkosrvNnvZrbAWb6PpeZlAQaW0hJf8CzwPfddI';
  const MONTHS={
    '2026-08':{
      label:'2026年8月',
      sites:[
        {name:'鶴見',gid:1981245666,tags:['すべて','Amazon']},
        {name:'中村区',gid:511952311,tags:['すべて','ギオン']},
        {name:'一宮',gid:500026506,tags:['すべて','ギオン']},
        {name:'静岡',gid:852874452,tags:['すべて','ギオン']},
        {name:'三島',gid:208595120,tags:['すべて','Amazon','ギオン']},
        {name:'株式会社サカエ',label:'お酒',gid:605561015,tags:['すべて','お酒']},
        {name:'秋山製麺所',label:'秋山製麺',gid:1803015733,tags:['すべて','秋山製麺']}
      ],
      enshu:[
        {name:'滋賀県野洲市',label:'野洲市 遠州トラック'},
        {name:'静岡市駿河区',label:'駿河区 遠州トラック'},
        {name:'富士市',label:'富士市 遠州トラック'}
      ]
    },
    '2026-09':{
      label:'2026年9月',
      sites:[
        {name:'鶴見',gid:107675747,tags:['すべて','Amazon']},
        {name:'中村区',gid:1241751568,tags:['すべて','ギオン']},
        {name:'一宮',gid:902048376,tags:['すべて','ギオン']},
        {name:'静岡',gid:2051049705,tags:['すべて','ギオン']},
        {name:'三島',gid:283632455,tags:['すべて','Amazon','ギオン']},
        {name:'株式会社サカエ',label:'お酒',gid:306319410,tags:['すべて','お酒']},
        {name:'秋山製麺所',label:'秋山製麺',gid:350367810,tags:['すべて','秋山製麺']}
      ],
      enshu:[
        {name:'滋賀県野洲市',label:'野洲市 遠州トラック'},
        {name:'静岡市駿河区',label:'駿河区 遠州トラック'},
        {name:'富士市',label:'富士市 遠州トラック'}
      ]
    }
  };

  const TABS=['すべて','Amazon','遠州トラック','ギオン','お酒','秋山製麺'];

  function sheetUrl(gid){
    return 'https://docs.google.com/spreadsheets/d/'+SPREADSHEET_ID+'/edit#gid='+gid;
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
      .jarvis-all-sites select{background:#071b27;color:#e8fbff;border:1px solid rgba(95,225,255,.45);border-radius:9px;padding:8px 10px;font:inherit}
      .jarvis-site-tabs{display:flex;gap:7px;overflow-x:auto;padding:2px 0 11px;scrollbar-width:thin}
      .jarvis-site-tab{white-space:nowrap;border:1px solid rgba(71,212,244,.38);background:rgba(6,38,51,.82);color:#a9dbe8;border-radius:999px;padding:8px 12px;font:inherit;font-weight:700;cursor:pointer}
      .jarvis-site-tab.active{background:rgba(0,165,205,.2);border-color:#66e9ff;color:#effdff;box-shadow:0 0 14px rgba(0,217,255,.16)}
      .jarvis-all-sites-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(126px,1fr));gap:8px}
      .jarvis-site-btn,.jarvis-site-card{display:flex;flex-direction:column;gap:2px;align-items:center;justify-content:center;min-height:48px;padding:8px 10px;border:1px solid rgba(66,220,255,.44);border-radius:10px;background:linear-gradient(180deg,rgba(9,66,86,.82),rgba(4,35,49,.82));color:#e9fcff;text-decoration:none;font-weight:700;text-align:center}
      .jarvis-site-btn{cursor:pointer}.jarvis-site-card{opacity:.72}
      .jarvis-site-btn small,.jarvis-site-card small{font-size:10px;font-weight:500;color:#8fb9c8}
      .jarvis-site-btn:hover{border-color:#7defff;box-shadow:0 0 16px rgba(0,217,255,.18)}
      .jarvis-site-empty{grid-column:1/-1;padding:14px;border:1px dashed rgba(95,225,255,.24);border-radius:10px;color:#90b8c5;text-align:center}
      @media(max-width:640px){.jarvis-all-sites-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.jarvis-site-btn,.jarvis-site-card{font-size:13px}}
    `;
    document.head.appendChild(style);
  }

  function renderButtons(panel,key,tab){
    const grid=panel.querySelector('.jarvis-all-sites-grid');
    grid.innerHTML='';

    if(tab==='遠州トラック'){
      MONTHS[key].enshu.forEach(site=>{
        const card=document.createElement('div');
        card.className='jarvis-site-card';
        card.innerHTML='<span>'+site.label+'</span><small>JARVIS内編集対応予定</small>';
        grid.appendChild(card);
      });
      return;
    }

    const sites=MONTHS[key].sites.filter(site=>site.tags.includes(tab));
    if(!sites.length){
      grid.innerHTML='<div class="jarvis-site-empty">この月は正本スプレッドシートに対象タブがありません</div>';
      return;
    }
    sites.forEach(site=>{
      const a=document.createElement('a');
      a.className='jarvis-site-btn';
      a.href=sheetUrl(site.gid);
      a.target='_blank';
      a.rel='noopener noreferrer';
      a.innerHTML='<span>'+(site.label||site.name)+'</span><small>'+site.name+'</small>';
      a.title=(site.label||site.name)+'の配送管理表を開く';
      grid.appendChild(a);
    });
  }

  function setActiveTab(panel,tab){
    panel.dataset.activeTab=tab;
    panel.querySelectorAll('.jarvis-site-tab').forEach(btn=>btn.classList.toggle('active',btn.dataset.tab===tab));
    const month=panel.querySelector('#jarvisAllSitesMonth').value;
    renderButtons(panel,month,tab);
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
        <div><b>全拠点 配送管理表</b><small>案件別に配送管理表を整理しています</small></div>
        <select id="jarvisAllSitesMonth" aria-label="配送管理表の月">
          <option value="2026-09">2026年9月</option>
          <option value="2026-08">2026年8月</option>
        </select>
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

    const select=panel.querySelector('#jarvisAllSitesMonth');
    const now=new Date();
    const currentKey=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
    if(MONTHS[currentKey]) select.value=currentKey;
    select.addEventListener('change',()=>renderButtons(panel,select.value,panel.dataset.activeTab||'すべて'));
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
