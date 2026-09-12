(()=>{
'use strict';
const VERSION='V7.3.11';
const REMOVED=['jobs','business'];
function pruneTopMenu(){document.querySelectorAll('.ups-menu [data-ups-go]').forEach(btn=>{if(REMOVED.includes(btn.dataset.upsGo))btn.remove()})}
function pruneDrawer(){const drawer=document.getElementById('ups-command-drawer');if(!drawer)return;drawer.querySelectorAll('[data-ups-route="business"]').forEach(el=>el.remove());const people=drawer.querySelector('[data-ups-route="people"]');if(people){const b=people.querySelector('b'),s=people.querySelector('small');if(b)b.textContent='ドライバー';if(s)s.textContent='台帳・稼働・評価'}const foot=drawer.querySelector('.ups-drawer-foot');if(foot)foot.textContent=`${VERSION} / MENU ACTIVE`}
function pruneLegacyNav(){document.querySelectorAll('[data-go="jobs"],[data-go="business"],#jobs,#business').forEach(el=>el.style.display='none')}
function simplifyPeople(){const p=document.getElementById('people');if(!p)return;const h=p.querySelector('h2');if(h&&/求人|採用/.test(h.textContent))h.textContent='ドライバー管理';p.querySelectorAll('.metrics,.linkbtn').forEach(el=>{const t=el.textContent||'';if(/求人|応募|採用/.test(t))el.style.display='none'});p.querySelectorAll('.notice').forEach(el=>{if(/求人|応募|採用/.test(el.textContent||''))el.textContent='ドライバー台帳・稼働状況の管理に使用します。'})}
function cleanCopy(){const root=document.getElementById('aiOffice');if(!root)return;root.querySelectorAll('p,.ups-note').forEach(el=>{let t=el.innerHTML;t=t.replace('配送・売上・人材・営業・経理・AI事業まで、なんでも聞いてください。','配送・売上・ドライバー・営業・経理まで、なんでも聞いてください。');t=t.replace('経理・配送・営業・採用・分析などの専門機能','経理・配送・営業・分析などの専門機能');el.innerHTML=t});const footer=root.querySelector('.ups-footer span:first-child');if(footer)footer.textContent=`UP'S AI // ${VERSION}`}
function apply(){pruneTopMenu();pruneDrawer();pruneLegacyNav();simplifyPeople();cleanCopy()}
apply();const obs=new MutationObserver(apply);obs.observe(document.documentElement,{childList:true,subtree:true});window.upsBusinessPrune={version:VERSION,removed:[...REMOVED],apply};
})();