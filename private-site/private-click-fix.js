(()=>{
'use strict';
function pages(){return [...document.querySelectorAll('.page,.section')]}
function resolve(id){
 const map={ops:['ops','shift','delivery'],sales:['sales'],drivers:['drivers','people'],people:['people','drivers'],jobs:['jobs','people'],market:['market'],business:['market'],ai:['ai'],home:['home']};
 for(const x of (map[id]||[id])) if(document.getElementById(x)) return x;
 return id;
}
function show(raw){
 const id=resolve(raw);
 const all=pages();
 all.forEach(p=>{
   const on=p.id===id;
   p.classList.toggle('active',on);
   p.style.display=on?'block':'none';
 });
 document.querySelectorAll('[data-go]').forEach(b=>b.classList.toggle('active',resolve(b.dataset.go)===id));
 const office=document.getElementById('aiOffice');
 if(office) office.style.display=(id==='home')?'block':'none';
 history.replaceState(null,'','#'+id);
 try{window.scrollTo({top:0,behavior:'auto'})}catch(e){window.scrollTo(0,0)}
}
document.addEventListener('click',e=>{
 const route=e.target.closest('[data-ups-go],[data-go]');
 if(route){
   e.preventDefault();
   e.stopPropagation();
   e.stopImmediatePropagation();
   show(route.dataset.upsGo||route.dataset.go);
   return;
 }
 const close=e.target.closest('[data-ups-close]');
 if(close){
   const d=document.getElementById('upsMenuDrawer');
   if(d){d.classList.remove('open');d.setAttribute('aria-hidden','true')}
 }
},true);
document.addEventListener('touchend',e=>{
 const route=e.target.closest?.('[data-ups-go],[data-go]');
 if(route){e.preventDefault();show(route.dataset.upsGo||route.dataset.go)}
},{capture:true,passive:false});
const style=document.createElement('style');
style.textContent='.ups-halo,.ups-orbit,.ups-ring,.ups-ring2,.ups-ring3,.ups-sweep,.ups-particle{pointer-events:none!important}';
document.head.appendChild(style);
window.JARVIS_PRIVATE_SHOW=show;
setTimeout(()=>{const h=location.hash.slice(1);if(h&&document.getElementById(resolve(h)))show(h)},500);
})();