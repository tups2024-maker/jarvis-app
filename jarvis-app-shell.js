/* JARVIS V7.0.15 iPhone global tap rescue */
(function(){
'use strict';
function css(){
 if(document.getElementById('jarvis-app-shell-style'))return;
 const s=document.createElement('style');s.id='jarvis-app-shell-style';s.textContent=`
 html,body{background:#020711;min-height:100%;overscroll-behavior:none}
 button,a,input,textarea,select,[role="button"]{touch-action:manipulation;pointer-events:auto!important}
 .overlay:not(.show):not(.active),.modal-backdrop:not(.show),[aria-hidden="true"]{pointer-events:none!important}
 .jarvis-bottom-nav{display:none;pointer-events:auto!important}
 .jarvis-bottom-nav,.jarvis-bottom-nav *{pointer-events:auto!important}
 @media(max-width:900px){main{padding-bottom:105px!important}.sidebar{padding-bottom:105px!important}.jarvis-bottom-nav{position:fixed;left:8px;right:8px;bottom:max(8px,env(safe-area-inset-bottom));z-index:2147483647;display:grid;grid-template-columns:repeat(5,1fr);gap:5px;padding:7px;border:1px solid rgba(70,220,255,.32);border-radius:20px;background:rgba(2,14,24,.97);box-shadow:0 16px 42px #000b}.jarvis-bottom-nav button{border:0;border-radius:13px;background:transparent;color:#7fa7b6;padding:10px 3px 8px;font:inherit;font-size:10px}.jarvis-bottom-nav button b{display:block;color:#dffbff;font-size:17px;margin-bottom:3px}.jarvis-bottom-nav button.active{background:rgba(22,189,226,.18);color:#7eefff;box-shadow:inset 0 0 0 1px rgba(82,227,255,.28)}}`;
 document.head.appendChild(s);
}
function activate(target,button){
 document.querySelectorAll('#jarvisBottomNav button').forEach(b=>b.classList.remove('active'));button&&button.classList.add('active');
 const src=document.querySelector(`.nav-item[data-page="${target}"],[data-page="${target}"]`);
 if(src){src.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true,view:window}));return;}
 const p=document.getElementById('page-'+target);
 if(p){document.querySelectorAll('main .page.active').forEach(x=>x.classList.remove('active'));p.classList.add('active');window.scrollTo(0,0);}
}
function makeBtn(label,icon,target){const b=document.createElement('button');b.type='button';b.dataset.target=target;b.innerHTML=`<b>${icon}</b><span>${label}</span>`;b.onclick=e=>{e.preventDefault();e.stopPropagation();activate(target,b)};return b;}
function mount(){
 let nav=document.getElementById('jarvisBottomNav');if(nav)return nav;
 nav=document.createElement('nav');nav.id='jarvisBottomNav';nav.className='jarvis-bottom-nav';
 [['ホーム','⌂','dashboard'],['シフト','▦','shift'],['配送','⇄','workbook'],['売上','¥','sourcebreakdown'],['AI','J','ai']].forEach((x,i)=>{const b=makeBtn(...x);if(i===0)b.classList.add('active');nav.appendChild(b)});
 document.body.appendChild(nav);return nav;
}
function killBlockers(){
 const vw=innerWidth||1,vh=innerHeight||1;
 document.querySelectorAll('body *').forEach(el=>{
  if(el.id==='jarvisBottomNav'||el.closest('#jarvisBottomNav'))return;
  const n=((el.id||'')+' '+String(el.className||'')).toLowerCase();
  const cs=getComputedStyle(el),r=el.getBoundingClientRect();
  const huge=r.width>vw*.9&&r.height>vh*.7;
  const hidden=cs.visibility==='hidden'||parseFloat(cs.opacity||1)<.05;
  if((/overlay|backdrop|blocker|mask|loading/.test(n)&&!/show|active|open/.test(n))||(huge&&hidden))el.style.pointerEvents='none';
 });
}
function globalTapRescue(){
 let down=null,guard=false;
 window.addEventListener('touchstart',e=>{const t=e.touches&&e.touches[0];if(t)down={x:t.clientX,y:t.clientY};},{capture:true,passive:true});
 window.addEventListener('touchend',e=>{
  if(guard)return; const t=e.changedTouches&&e.changedTouches[0]; if(!t)return;
  if(down&&Math.hypot(t.clientX-down.x,t.clientY-down.y)>18)return;
  const x=t.clientX,y=t.clientY; const nav=document.getElementById('jarvisBottomNav');
  if(nav){for(const b of nav.querySelectorAll('button')){const r=b.getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom){e.preventDefault();e.stopImmediatePropagation();activate(b.dataset.target,b);return;}}}
  const stack=document.elementsFromPoint(x,y);
  const interactive=stack.find(el=>el.matches?.('button,a,input,textarea,select,[role="button"],.nav-item,[data-page]'));
  if(interactive&&interactive!==e.target){guard=true;e.preventDefault();e.stopImmediatePropagation();try{interactive.focus?.({preventScroll:true});interactive.click?.();}finally{setTimeout(()=>guard=false,80)}}
 },{capture:true,passive:false});
}
async function register(){if(!('serviceWorker'in navigator))return;try{const r=await navigator.serviceWorker.register('./sw.js?v=20260905-1805',{scope:'./'});r.update().catch(()=>{});}catch(e){}}
function boot(){css();mount();killBlockers();globalTapRescue();register();setTimeout(killBlockers,500);setTimeout(killBlockers,1800);document.documentElement.dataset.jarvisApp='tap-rescue';}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,200),{once:true});else setTimeout(boot,200);
})();