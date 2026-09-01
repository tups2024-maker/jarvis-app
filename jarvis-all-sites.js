(function(){
  'use strict';

  const SPREADSHEET_ID='1Itlt2LkosrvNnvZrbAWb6PpeZlAQaW0hJf8CzwPfddI';
  const MONTHS={
    '2026-08':{
      label:'2026年8月',
      sites:[
        ['鶴見',1981245666],
        ['中村区',511952311],
        ['一宮',500026506],
        ['静岡',852874452],
        ['三島',208595120],
        ['株式会社サカエ',605561015],
        ['秋山製麺所',1803015733]
      ]
    },
    '2026-09':{
      label:'2026年9月',
      sites:[
        ['鶴見',107675747],
        ['中村区',1241751568],
        ['一宮',902048376],
        ['静岡',2051049705],
        ['三島',283632455],
        ['株式会社サカエ',306319410],
        ['秋山製麺所',350367810]
      ]
    }
  };

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
      .jarvis-all-sites-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(126px,1fr));gap:8px}
      .jarvis-site-btn{display:flex;align-items:center;justify-content:center;min-height:42px;padding:8px 10px;border:1px solid rgba(66,220,255,.44);border-radius:10px;background:linear-gradient(180deg,rgba(9,66,86,.82),rgba(4,35,49,.82));color:#e9fcff;text-decoration:none;font-weight:700;cursor:pointer}
      .jarvis-site-btn:hover{border-color:#7defff;box-shadow:0 0 16px rgba(0,217,255,.18)}
      @media(max-width:640px){.jarvis-all-sites-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.jarvis-site-btn{font-size:13px}}
    `;
    document.head.appendChild(style);
  }

  function renderButtons(panel,key){
    const grid=panel.querySelector('.jarvis-all-sites-grid');
    grid.innerHTML='';
    MONTHS[key].sites.forEach(([name,gid])=>{
      const a=document.createElement('a');
      a.className='jarvis-site-btn';
      a.href=sheetUrl(gid);
      a.target='_blank';
      a.rel='noopener noreferrer';
      a.textContent=name;
      a.title=name+'の配送管理表を開く';
      grid.appendChild(a);
    });
  }

  function mount(){
    styles();
    const page=document.getElementById('page-workbook');
    if(!page || document.getElementById('jarvisAllSites')) return;

    const panel=document.createElement('section');
    panel.id='jarvisAllSites';
    panel.className='jarvis-all-sites';
    panel.innerHTML=`
      <div class="jarvis-all-sites-head">
        <div><b>全拠点 配送管理表</b><small>拠点を選ぶと正本のGoogle配送管理表を開きます</small></div>
        <select id="jarvisAllSitesMonth" aria-label="配送管理表の月">
          <option value="2026-09">2026年9月</option>
          <option value="2026-08">2026年8月</option>
        </select>
      </div>
      <div class="jarvis-all-sites-grid"></div>
    `;

    const anchor=page.querySelector('.section-head, h2, h3');
    if(anchor && anchor.parentNode){
      anchor.parentNode.insertBefore(panel,anchor.nextSibling);
    }else{
      page.insertBefore(panel,page.firstChild);
    }

    const select=panel.querySelector('#jarvisAllSitesMonth');
    const now=new Date();
    const currentKey=now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0');
    if(MONTHS[currentKey]) select.value=currentKey;
    renderButtons(panel,select.value);
    select.addEventListener('change',()=>renderButtons(panel,select.value));
  }

  const observer=new MutationObserver(()=>mount());
  function start(){
    mount();
    observer.observe(document.documentElement,{subtree:true,childList:true});
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',start,{once:true});
  else start();
})();
