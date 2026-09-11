(()=>{
  const VERSION='V7.1.1';

  function relabel(){
    try{
      document.title='アップズ君 '+VERSION+' LIVE';
      const replacements=[
        ['JARVIS / CENTRAL MANAGEMENT AI','UP’S AI / CENTRAL MANAGEMENT'],
        ['JARVIS統括AI','UP’S AI 統括'],
        ['JARVIS / Conversation Core','UP’S AI / Conversation Core'],
        ['JARVIS AI','アップズ君'],
        ['JARVIS会話','アップズ君 会話'],
        ['JARVISに入力','アップズ君に入力']
      ];
      const walker=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);
      const nodes=[];
      while(walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(n=>{
        let t=n.nodeValue||'';
        replacements.forEach(([a,b])=>{t=t.split(a).join(b)});
        if(t!==n.nodeValue)n.nodeValue=t;
      });
      document.querySelectorAll('input[placeholder]').forEach(el=>{
        if((el.placeholder||'').includes('JARVIS')) el.placeholder=el.placeholder.replace(/JARVIS/g,'アップズ君');
      });
      const legacy=document.getElementById('voiceCore');
      if(legacy){
        legacy.setAttribute('aria-label','アップズ君 LIVE音声会話を開始');
      }
    }catch(e){}
  }

  function setOfficeState(label,busy=false){
    const core=document.querySelector('.aio-core');
    if(core){
      core.classList.toggle('busy',!!busy);
      const s=core.querySelector('small');
      if(s)s.textContent=label||'ONLINE';
    }
    const v=document.querySelector('.aio-voice');
    if(v&&label)v.textContent='🎙 '+label;
  }

  async function startLive(ev){
    if(ev){
      ev.preventDefault();
      ev.stopPropagation();
      if(ev.stopImmediatePropagation)ev.stopImmediatePropagation();
    }
    setOfficeState('CONNECTING',true);
    try{
      if(typeof window.upsLiveStart!=='function'){
        setOfficeState('LIVE UNAVAILABLE',false);
        return false;
      }
      const ok=await window.upsLiveStart();
      if(ok){
        setOfficeState('LIVE',true);
        return true;
      }
      setOfficeState('LIVE接続失敗',false);
      return false;
    }catch(e){
      console.error('UP’S AI LIVE start failed',e);
      setOfficeState('LIVE接続失敗',false);
      return false;
    }
  }

  document.addEventListener('click',e=>{
    const t=e.target.closest?.('.aio-core,.aio-voice');
    if(!t)return;
    startLive(e);
  },true);

  document.addEventListener('keydown',e=>{
    const t=e.target.closest?.('.aio-core');
    if(!t||!(e.key==='Enter'||e.key===' '))return;
    startLive(e);
  },true);

  window.addEventListener('ups-live-state',e=>{
    const st=e.detail?.state;
    const label=e.detail?.label;
    if(st==='connecting')setOfficeState(label||'CONNECTING',true);
    else if(st==='listening')setOfficeState(label||'LISTENING',true);
    else if(st==='speaking')setOfficeState(label||'SPEAKING',true);
    else if(st==='idle')setOfficeState(label||'ONLINE',false);
  });

  window.addEventListener('ups-live-unavailable',()=>setOfficeState('LIVE接続失敗',false));

  function boot(){
    relabel();
    const mo=new MutationObserver(()=>relabel());
    mo.observe(document.body,{childList:true,subtree:true});
    setTimeout(()=>mo.disconnect(),12000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});
  else boot();
})();