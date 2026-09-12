(()=>{
'use strict';
const VERSION='V7.3.13';
const REMOVED=['jobs','market','business'];
let queued=false;
const setText=(el,text)=>{if(el&&el.textContent!==text)el.textContent=text};
function pruneTopMenu(){document.querySelectorAll('.ups-menu [data-ups-go]').forEach(btn=>{if(REMOVED.includes(btn.dataset.upsGo))btn.remove()})}
function pruneDrawer(){const drawer=document.getElementById('ups-command-drawer');if(!drawer)return;drawer.querySelectorAll('[data-ups-route="market"],[data-ups-route="business"]').forEach(el=>el.remove());const people=drawer.querySelector('[data-ups-route="people"]');if(people){setText(people.querySelector('b'),'ドライバー');setText(people.querySelector('small'),'台帳・稼働・評価')}setText(drawer.querySelector('.ups-drawer-foot'),`${VERSION} / MENU ACTIVE`)}
function pruneLegacyNav(){document.querySelectorAll('[data-go="jobs"],[data-go="market"],[data-go="business"],#jobs,#market,#business').forEach(el=>{if(el.style.display!=='none')el.style.display='none'})}
function simplifyPeople(){const p=document.getElementById('people');if(!p)return;const h=p.querySelector('h2');if(h&&/求人|採用/.test(h.textContent))setText(h,'ドライバー管理');p.querySelectorAll('.metrics,.linkbtn').forEach(el=>{const t=el.textContent||'';if(/求人|応募|採用|SNS/.test(t)&&el.style.display!=='none')el.style.display='none'});p.querySelectorAll('.notice').forEach(el=>{if(/求人|応募|採用|SNS/.test(el.textContent||''))setText(el,'ドライバー台帳・稼働状況の管理に使用します。')})}
function cleanCopy(){const root=document.getElementById('aiOffice');if(!root)return;root.querySelectorAll('p,.ups-note').forEach(el=>{const before=el.innerHTML;let after=before;after=after.replace('配送・売上・人材・営業・経理・AI事業まで、なんでも聞いてください。','配送・売上・ドライバー・経理を中心にサポートします。');after=after.replace('配送・売上・ドライバー・営業・経理まで、なんでも聞いてください。','配送・売上・ドライバー・経理を中心にサポートします。');after=after.replace('経理・配送・営業・採用・分析などの専門機能','経理・配送・ドライバー管理・分析などの専門機能');after=after.replace('経理・配送・営業・分析などの専門機能','経理・配送・ドライバー管理・分析などの専門機能');if(after!==before)el.innerHTML=after});setText(root.querySelector('.ups-footer span:first-child'),`UP'S AI // ${VERSION}`)}
function apply(){queued=false;pruneTopMenu();pruneDrawer();pruneLegacyNav();simplifyPeople();cleanCopy()}
function schedule(){if(queued)return;queued=true;queueMicrotask(apply)}
apply();
const obs=new MutationObserver(schedule);obs.observe(document.documentElement,{childList:true,subtree:true});
window.upsBusinessPrune={version:VERSION,removed:[...REMOVED],apply};
})();