/* JARVIS V7.0.8 NEON EXECUTIVE UI
   Visual-only production patch. Keeps existing shift/save/sync/voice logic intact. */
(function(){
  'use strict';
  const STYLE_ID='jarvis-neon-executive-style';

  function injectStyle(){
    if(document.getElementById(STYLE_ID)) return;
    const s=document.createElement('style');
    s.id=STYLE_ID;
    s.textContent=`
:root{
  --j-bg:#020711;--j-bg2:#05101d;--j-panel:rgba(4,20,34,.78);--j-panel2:rgba(5,27,43,.88);
  --j-cyan:#35e6ff;--j-blue:#238bff;--j-violet:#8b5cff;--j-text:#e7fbff;--j-muted:#7fa7b8;
  --j-border:rgba(74,219,255,.28);--j-glow:0 0 24px rgba(39,190,255,.14),inset 0 1px 0 rgba(255,255,255,.035)
}
html,body{background:radial-gradient(circle at 58% 18%,rgba(24,87,160,.16),transparent 31%),radial-gradient(circle at 82% 44%,rgba(102,49,187,.10),transparent 32%),linear-gradient(180deg,#020711 0%,#03101b 54%,#020711 100%)!important;color:var(--j-text)!important}
body:before{content:"";position:fixed;inset:0;pointer-events:none;z-index:-1;background-image:linear-gradient(rgba(38,157,207,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(38,157,207,.025) 1px,transparent 1px);background-size:42px 42px;mask-image:linear-gradient(to bottom,rgba(0,0,0,.7),transparent 82%)}
.scanlines{opacity:.08!important}
.app-shell{background:transparent!important}
.sidebar{background:linear-gradient(180deg,rgba(2,9,18,.98),rgba(3,13,24,.96))!important;border-right:1px solid rgba(77,191,255,.18)!important;box-shadow:18px 0 50px rgba(0,0,0,.25)!important}
.sidebar-head{padding-top:22px!important;padding-bottom:20px!important;border-bottom:1px solid rgba(73,190,255,.12)!important}
.sidebar-head .brand-orb{width:48px!important;height:48px!important;background:radial-gradient(circle at 38% 35%,#a7f8ff 0 6%,#2be5ff 7% 18%,#1670ff 42%,#351779 68%,#07111e 72%)!important;box-shadow:0 0 14px rgba(52,220,255,.65),0 0 34px rgba(38,112,255,.34)!important;border:1px solid rgba(126,240,255,.85)!important}
.sidebar-head>div:nth-child(2) b{font-size:22px!important;letter-spacing:.14em!important;color:#8deeff!important;text-shadow:0 0 12px rgba(56,213,255,.45)}
.sidebar-head small{color:#6d9aad!important;letter-spacing:.06em}
.nav-item{border:1px solid transparent!important;border-radius:11px!important;color:#a8c0cf!important;margin:3px 9px!important;transition:.18s ease!important}
.nav-item:hover{background:rgba(25,121,187,.09)!important;border-color:rgba(68,210,255,.18)!important;color:#dcf9ff!important;transform:translateX(2px)}
.nav-item.active{background:linear-gradient(90deg,rgba(18,155,222,.20),rgba(102,67,218,.18))!important;border-color:rgba(61,210,255,.48)!important;color:#eafcff!important;box-shadow:0 0 18px rgba(36,170,255,.15),inset 3px 0 0 #35e6ff!important}
.sidebar-foot{border:1px solid rgba(76,209,255,.18)!important;background:rgba(8,29,43,.50)!important;border-radius:12px!important;color:#83dff0!important}
.status-dot{box-shadow:0 0 12px #39efff!important}
main{background:transparent!important}
.topbar{background:linear-gradient(180deg,rgba(2,8,17,.92),rgba(2,8,17,.62))!important;backdrop-filter:blur(18px);border-bottom:1px solid rgba(75,201,255,.11)!important}
.title-wrap small{color:#59bad3!important;letter-spacing:.15em!important}.title-wrap h1{color:#f0fdff!important;text-shadow:0 0 18px rgba(56,211,255,.12)}.title-wrap p{color:#86a8b8!important}
.live{border:1px solid rgba(57,238,255,.28)!important;background:rgba(5,64,74,.32)!important;color:#6bfbff!important;box-shadow:0 0 14px rgba(55,235,255,.08)!important}
.quick-hub-btn{background:rgba(5,23,39,.86)!important;border:1px solid rgba(68,202,255,.23)!important;color:#ccefff!important}.quick-hub-btn.ai{background:linear-gradient(135deg,rgba(14,135,207,.30),rgba(102,63,219,.25))!important;box-shadow:0 0 16px rgba(57,185,255,.12)!important}
.command-center{position:relative}.hud-topline{border:1px solid rgba(67,208,255,.14)!important;background:rgba(5,25,39,.48)!important;border-radius:12px!important;color:#69cce3!important;letter-spacing:.09em!important}
.command-hero-v487{position:relative;overflow:hidden!important;background:linear-gradient(180deg,rgba(3,18,31,.88),rgba(3,12,23,.90))!important;border:1px solid rgba(72,211,255,.24)!important;border-radius:22px!important;box-shadow:0 22px 70px rgba(0,0,0,.32),0 0 40px rgba(31,137,255,.06)!important}
.command-hero-v487:before{content:"";position:absolute;width:740px;height:740px;left:50%;top:46%;transform:translate(-50%,-50%);pointer-events:none;background:radial-gradient(circle,rgba(33,177,255,.11) 0 19%,rgba(38,105,255,.045) 30%,transparent 61%)}
.command-hero-head{position:relative;z-index:2}.command-hero-head .eyebrow{color:#62dff4!important;letter-spacing:.13em!important}.command-hero-head h2{font-size:clamp(22px,3vw,34px)!important;letter-spacing:.08em!important;color:#eafdff!important}.core-online{border:1px solid rgba(70,237,255,.33)!important;background:rgba(9,72,78,.22)!important;color:#75fbff!important}
.command-live-strip{display:grid!important;grid-template-columns:repeat(4,minmax(0,1fr))!important;gap:12px!important;position:relative;z-index:2}
.command-live-strip article{background:linear-gradient(155deg,rgba(5,32,50,.88),rgba(3,17,31,.88))!important;border:1px solid rgba(72,210,255,.28)!important;border-radius:16px!important;padding:16px!important;min-height:118px!important;box-shadow:var(--j-glow)!important;overflow:hidden!important}
.command-live-strip article:nth-child(even){border-color:rgba(137,99,255,.28)!important}.command-live-strip article:before{content:"";position:absolute;inset:0;background:linear-gradient(110deg,transparent 58%,rgba(87,227,255,.035));pointer-events:none}.command-live-strip article span{color:#b8d8e5!important;font-size:12px!important;letter-spacing:.07em!important}.command-live-strip article b{font-size:clamp(22px,2.2vw,34px)!important;color:#bfefff!important;text-shadow:0 0 18px rgba(44,195,255,.18)!important}.command-live-strip article small{color:#6d9cad!important}
.command-stage-v489{position:relative;z-index:2;min-height:370px!important;padding:16px 0!important}.hud-side{background:linear-gradient(180deg,rgba(4,27,43,.72),rgba(2,16,28,.72))!important;border:1px solid rgba(77,204,255,.17)!important;border-radius:16px!important;box-shadow:inset 0 0 22px rgba(28,163,255,.035)!important}.hud-side span{color:#5fa8bb!important}.hud-side b{color:#9ef5ff!important;text-shadow:0 0 11px rgba(52,217,255,.22)}
.interactive-core.command-core-v487{filter:drop-shadow(0 0 22px rgba(45,196,255,.35)) drop-shadow(0 0 48px rgba(58,92,255,.18))!important;transform:scale(1.06);transition:.25s ease!important}.interactive-core.command-core-v487:hover{transform:scale(1.09)!important;filter:drop-shadow(0 0 32px rgba(54,225,255,.45)) drop-shadow(0 0 70px rgba(118,71,255,.24))!important}.command-core-v487 .ring{border-color:rgba(66,222,255,.54)!important}.command-core-v487 .r2,.command-core-v487 .r4{border-color:rgba(133,88,255,.43)!important}.core-center{background:radial-gradient(circle at 42% 35%,rgba(42,224,255,.34),rgba(14,94,194,.28) 37%,rgba(55,22,113,.36) 67%,rgba(2,9,17,.98) 72%)!important;border:1px solid rgba(120,237,255,.70)!important;box-shadow:inset 0 0 32px rgba(51,208,255,.32),0 0 25px rgba(48,218,255,.32),0 0 70px rgba(41,108,255,.22)!important}.core-center small{color:#9feeff!important;letter-spacing:.15em!important}.core-center b{font-size:clamp(30px,4vw,52px)!important;letter-spacing:.08em!important;color:#e7fdff!important;text-shadow:0 0 18px rgba(91,229,255,.65)!important}.core-center em{color:#8db8c8!important}.core-center strong{color:#abf8ff!important}
.voice-dock-v487{position:relative;z-index:2;background:linear-gradient(90deg,rgba(3,26,43,.88),rgba(19,18,49,.78))!important;border:1px solid rgba(80,210,255,.24)!important;border-radius:16px!important;box-shadow:var(--j-glow)!important}.voice-dock-v487 b{color:#ddfaff!important}.voice-dock-v487 span{color:#85aabd!important}.command-mic{background:radial-gradient(circle,#61f0ff 0 7%,#168cd8 24%,#3549c8 50%,#4d1e90 72%,#071421 76%)!important;border:1px solid rgba(144,239,255,.82)!important;box-shadow:0 0 18px rgba(48,218,255,.54),0 0 34px rgba(113,62,255,.28)!important}.open-ai-v487,.command-quick-links button{border:1px solid rgba(70,205,255,.24)!important;background:rgba(4,26,42,.78)!important;color:#cbedf7!important;border-radius:10px!important}.open-ai-v487:hover,.command-quick-links button:hover{border-color:rgba(76,229,255,.55)!important;box-shadow:0 0 17px rgba(45,197,255,.12)!important}
.glass,.card,.panel,.settings-card,.sales-card,.workbook-card{background:linear-gradient(160deg,rgba(5,27,43,.84),rgba(3,16,29,.88))!important;border-color:rgba(70,199,255,.20)!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.025),0 12px 38px rgba(0,0,0,.18)!important}
button,input,select,textarea{font-family:inherit}input,select,textarea{background:rgba(2,14,25,.88)!important;border-color:rgba(66,191,228,.26)!important;color:#e6faff!important}input:focus,select:focus,textarea:focus{outline:none!important;border-color:rgba(67,226,255,.60)!important;box-shadow:0 0 0 3px rgba(41,192,255,.08)!important}
.jarvis-neon-clock{display:flex;align-items:center;gap:9px;padding:8px 11px;border:1px solid rgba(67,197,255,.18);background:rgba(4,22,37,.62);border-radius:10px;color:#a7dfea;font-size:12px;white-space:nowrap}.jarvis-neon-clock b{color:#e7fbff;font-weight:700}.jarvis-neon-clock i{width:5px;height:5px;border-radius:50%;background:#38efff;box-shadow:0 0 10px #38efff}
.jarvis-neon-version{display:inline-flex;align-items:center;gap:6px;margin-left:8px;padding:3px 7px;border:1px solid rgba(99,213,255,.20);border-radius:999px;color:#79dff1;background:rgba(0,153,204,.07);font-size:10px;vertical-align:middle}
@media(max-width:1050px){.command-live-strip{grid-template-columns:repeat(2,minmax(0,1fr))!important}.jarvis-neon-clock{display:none}.interactive-core.command-core-v487{transform:scale(1)!important}}
@media(max-width:700px){.command-hero-v487{border-radius:16px!important}.command-live-strip{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important}.command-live-strip article{min-height:96px!important;padding:12px!important}.command-live-strip article b{font-size:20px!important}.command-stage-v489{min-height:330px!important}.hud-side{display:none!important}.interactive-core.command-core-v487{transform:scale(.94)!important}.voice-dock-v487{padding:10px!important}.sidebar-head .brand-orb{width:42px!important;height:42px!important}}
@media(max-width:430px){.command-live-strip{grid-template-columns:1fr 1fr!important}.command-hero-head h2{font-size:20px!important}.hud-topline span:nth-child(3){display:none}.command-live-strip article small{font-size:9px!important}.sidebar{box-shadow:22px 0 60px rgba(0,0,0,.5)!important}}
`;
    document.head.appendChild(s);
  }

  function enhanceBrand(){
    const h=document.querySelector('.sidebar-head');
    if(h&&h.dataset.neonDone!=='1'){
      h.dataset.neonDone='1';
      const b=h.querySelector('b'); if(b) b.textContent='JARVIS';
      const sm=h.querySelector('small'); if(sm) sm.textContent='LIGHT CARGO MANAGEMENT';
    }
    const title=document.getElementById('pageTitle');
    if(title&&!title.querySelector('.jarvis-neon-version')){
      const badge=document.createElement('span');
      badge.className='jarvis-neon-version';badge.textContent='V7.0.8 STABLE';title.appendChild(badge);
    }
  }

  function addClock(){
    const actions=document.querySelector('.top-actions');
    if(!actions||document.getElementById('jarvisNeonClock')) return;
    const el=document.createElement('div');el.id='jarvisNeonClock';el.className='jarvis-neon-clock';
    actions.prepend(el);
    const tick=()=>{
      const now=new Date();
      const date=new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short'}).format(now);
      const time=new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',hour:'2-digit',minute:'2-digit',hour12:false}).format(now);
      el.innerHTML='<i></i><span>'+date+'</span><b>'+time+'</b>';
    };
    tick();setInterval(tick,30000);
  }

  function tuneDashboard(){
    const hero=document.querySelector('.command-hero-v487');if(!hero) return;
    hero.dataset.neonExecutive='1';
    const labels=[['cmdSales','今月売上'],['cmdGross','今月粗利'],['cmdActive','本日稼働'],['cmdAbsence','欠車速報']];
    labels.forEach(([id,label])=>{const value=document.getElementById(id);const article=value?.closest('article');const span=article?.querySelector('span');if(span)span.textContent=label;});
    const core=hero.querySelector('.core-center');
    if(core){const small=core.querySelector('small');if(small)small.textContent='JARVIS CORE';const em=core.querySelector('em');if(em)em.textContent='REPORT / CONTACT / CONSULT';const strong=core.querySelector('strong');if(strong)strong.textContent='JARVISに話しかける';}
    const topline=hero.previousElementSibling?.classList?.contains('hud-topline')?hero.previousElementSibling:document.querySelector('.hud-topline');
    if(topline){const spans=topline.querySelectorAll('span');if(spans[0])spans[0].textContent='◉ JARVIS LIGHT CARGO NETWORK';if(spans[1])spans[1].textContent='JARVIS CORE: ONLINE';if(spans[2])spans[2].textContent='SECURE DATA LINK';}
  }

  function relabelNav(){
    const navMap={dashboard:'ホーム',shiftboard:'シフト管理',workbook:'配送管理表',sales:'売上・収支',salescrm:'営業リスト',jobs:'求人管理',settings:'設定'};
    Object.entries(navMap).forEach(([page,label])=>{const btn=document.querySelector('.nav-item[data-page="'+page+'"] span');if(btn)btn.textContent=label;});
  }

  function run(){injectStyle();enhanceBrand();addClock();tuneDashboard();relabelNav();}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true}); else run();
  setTimeout(run,350);setTimeout(run,1200);
  const mo=new MutationObserver(()=>{if(!document.getElementById(STYLE_ID))injectStyle();enhanceBrand();tuneDashboard();});
  mo.observe(document.documentElement,{childList:true,subtree:true});
  window.JARVIS_NEON_UI={version:'1.0.0',refresh:run};
})();
