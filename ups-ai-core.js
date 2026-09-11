(()=>{
  const VERSION='V7.0.22';
  const WAKE_WORDS=['アップズ君','アップズくん','アップス君','アップスくん','ups君'];
  const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  let armed=false, wakeRec=null, speaking=false;

  function injectStyles(){
    if(document.getElementById('ups-ai-core-style')) return;
    const s=document.createElement('style'); s.id='ups-ai-core-style';
    s.textContent=`
      :root{--ups-cyan:#67efff;--ups-blue:#17bde9;--ups-mint:#73ffd7;--ups-deep:#020711}
      .ups-core-shell{position:relative;display:grid;place-items:center;min-height:280px;padding:18px 0 12px;isolation:isolate}
      .ups-core-shell:before{content:"";position:absolute;width:min(360px,75vw);height:min(360px,75vw);border-radius:50%;background:radial-gradient(circle,rgba(41,210,255,.16),rgba(41,210,255,.04) 45%,transparent 70%);filter:blur(7px);z-index:-2;animation:upsHalo 4.5s ease-in-out infinite}
      .ups-ring,.ups-ring2,.ups-ring3{position:absolute;border-radius:50%;pointer-events:none}
      .ups-ring{width:240px;height:240px;border:1px solid rgba(102,235,255,.32);box-shadow:0 0 35px rgba(47,215,255,.16);animation:upsSpin 12s linear infinite}
      .ups-ring:before,.ups-ring:after{content:"";position:absolute;inset:13px;border-radius:50%;border-top:2px solid rgba(109,244,255,.75);border-right:1px solid transparent;transform:rotate(25deg)}
      .ups-ring:after{inset:-18px;border-top-color:rgba(115,255,215,.35);transform:rotate(-60deg)}
      .ups-ring2{width:286px;height:286px;border:1px dashed rgba(89,205,255,.2);animation:upsSpinReverse 19s linear infinite}
      .ups-ring3{width:324px;height:324px;border:1px solid rgba(72,150,190,.12);animation:upsPulseRing 3s ease-in-out infinite}
      #voiceCore.ups-core{position:relative;width:190px!important;height:190px!important;border-radius:50%!important;border:1px solid rgba(120,241,255,.78)!important;background:radial-gradient(circle at 50% 44%,#8effff 0 2%,#28d4ef 3% 7%,#0e6f8a 8% 18%,#073347 19% 38%,#020b13 39% 100%)!important;box-shadow:0 0 20px rgba(72,224,255,.55),0 0 65px rgba(42,205,255,.22),inset 0 0 45px rgba(84,239,255,.2)!important;color:#effdff!important;display:grid!important;place-items:center!important;padding:0!important;overflow:hidden;cursor:pointer;transition:.25s ease;animation:upsCoreIdle 3.3s ease-in-out infinite}
      #voiceCore.ups-core:before{content:"";position:absolute;inset:17%;border-radius:50%;border:1px solid rgba(174,250,255,.45);box-shadow:inset 0 0 18px rgba(75,235,255,.18);animation:upsSpin 9s linear infinite}
      #voiceCore.ups-core:after{content:"";position:absolute;width:46%;height:3px;border-radius:999px;background:linear-gradient(90deg,transparent,var(--ups-cyan),transparent);box-shadow:0 0 12px var(--ups-cyan);animation:upsScan 2.5s ease-in-out infinite}
      .ups-core-center{position:relative;z-index:2;text-align:center;display:flex;flex-direction:column;align-items:center;gap:7px;text-shadow:0 0 18px rgba(122,244,255,.8)}
      .ups-core-dot{width:18px;height:18px;border-radius:50%;background:#b8ffff;box-shadow:0 0 10px #8effff,0 0 25px #34dcff;animation:upsDot 2s ease-in-out infinite}
      .ups-core-name{font-size:18px;font-weight:900;letter-spacing:.16em}
      .ups-core-state{font-size:9px;letter-spacing:.16em;color:#8edfed;font-weight:800}
      #voiceCore.ups-core.listening,#voiceCore.ups-core.ups-listening{transform:scale(1.035);box-shadow:0 0 28px rgba(115,255,215,.9),0 0 90px rgba(55,255,205,.38),inset 0 0 52px rgba(115,255,215,.28)!important;animation:upsListening .85s ease-in-out infinite alternate}
      #voiceCore.ups-core.ups-thinking{box-shadow:0 0 30px rgba(92,168,255,.85),0 0 92px rgba(70,108,255,.32),inset 0 0 52px rgba(80,120,255,.25)!important;animation:upsThinking 1.15s linear infinite}
      #voiceCore.ups-core.ups-speaking{box-shadow:0 0 34px rgba(118,255,216,.95),0 0 100px rgba(52,255,195,.34),inset 0 0 55px rgba(118,255,216,.28)!important;animation:upsSpeaking .55s ease-in-out infinite alternate}
      .ups-voice-caption{text-align:center;color:#79bfd0;font-size:10px;letter-spacing:.08em;margin-top:10px;line-height:1.6}.ups-voice-caption b{color:#aef8ff}
      @keyframes upsSpin{to{transform:rotate(360deg)}}@keyframes upsSpinReverse{to{transform:rotate(-360deg)}}
      @keyframes upsHalo{50%{transform:scale(1.08);opacity:.78}}@keyframes upsPulseRing{50%{transform:scale(1.04);opacity:.35}}
      @keyframes upsCoreIdle{50%{filter:brightness(1.13);transform:scale(1.012)}}@keyframes upsDot{50%{transform:scale(1.35);opacity:.7}}
      @keyframes upsScan{0%,100%{transform:translateY(-44px);opacity:.3}50%{transform:translateY(44px);opacity:1}}
      @keyframes upsListening{to{filter:brightness(1.28);transform:scale(1.055)}}@keyframes upsThinking{to{filter:hue-rotate(22deg);transform:rotate(.8deg)}}@keyframes upsSpeaking{to{filter:brightness(1.35);transform:scale(1.045)}}
      @media(max-width:900px){.ups-core-shell{min-height:250px}.ups-ring{width:215px;height:215px}.ups-ring2{width:252px;height:252px}.ups-ring3{width:282px;height:282px}#voiceCore.ups-core{width:170px!important;height:170px!important}.ups-core-name{font-size:16px}}
    `;
    document.head.appendChild(s);
  }

  function renameVisibleUi(){
    document.title=`アップズ君 ${VERSION}`;
    const brandB=document.querySelector('.brand b'); if(brandB) brandB.textContent='アップズ君';
    const brandH=document.querySelector('.brand h1'); if(brandH) brandH.textContent='アップズ君';
    const brandSmall=document.querySelector('.brand small'); if(brandSmall) brandSmall.textContent=`UP’s AI / CENTRAL MANAGEMENT ${VERSION}`;
    const badge=document.querySelector('.badge,.pill'); if(badge) badge.textContent=VERSION;
    document.querySelectorAll('h1,h2,.dept,.notice,.msg.ai').forEach(el=>{
      if(el.textContent.includes('JARVIS AI')) el.textContent=el.textContent.replace('JARVIS AI','アップズ君 AI');
      if(el.textContent.includes('JARVISです')) el.textContent=el.textContent.replace('JARVISです','アップズ君です');
      if(el.textContent.includes('JARVIS / Conversation Core')) el.textContent='UP’s AI / CONVERSATION CORE';
      if(el.textContent.includes('JARVIS統括AI')) el.textContent='アップズ君 / 統括AI';
    });
    document.querySelectorAll('input[placeholder]').forEach(el=>{if(el.placeholder.includes('JARVIS'))el.placeholder='アップズ君に入力'});
    document.querySelectorAll('[data-go="ai"]').forEach(el=>{if(el.textContent.includes('JARVIS'))el.innerHTML=el.innerHTML.replace('JARVIS','アップズ君')});
  }

  function setState(state,label){
    const core=document.getElementById('voiceCore'); if(!core)return;
    core.classList.remove('ups-listening','ups-thinking','ups-speaking');
    if(state)core.classList.add('ups-'+state);
    const st=core.querySelector('.ups-core-state'); if(st)st.textContent=label||'ONLINE';
  }

  function buildCore(){
    const core=document.getElementById('voiceCore'); if(!core)return;
    const parent=core.parentElement;
    if(parent && !parent.classList.contains('ups-core-shell')){
      parent.classList.add('ups-core-shell');
      ['ups-ring3','ups-ring2','ups-ring'].forEach(c=>{const r=document.createElement('span');r.className=c;parent.insertBefore(r,core)});
      const cap=document.createElement('div');cap.className='ups-voice-caption';cap.innerHTML='<b>UP’s AI CORE</b><br>音声アクセスを有効にすると「アップズ君」で反応';parent.appendChild(cap);
    }
    core.classList.add('ups-core');
    core.innerHTML='<span class="ups-core-center"><span class="ups-core-dot"></span><span class="ups-core-name">UP’S AI</span><span class="ups-core-state">STANDBY</span></span>';
    core.setAttribute('aria-label','アップズ君 音声コア');
    core.title='音声アクセスを開始';
  }

  function cleanTranscript(t){
    let x=(t||'').trim();
    WAKE_WORDS.forEach(w=>{x=x.replace(new RegExp(w,'gi'),'').trim()});
    return x.replace(/^[、,。\s]+/,'').trim();
  }
  function hasWake(t){return WAKE_WORDS.some(w=>(t||'').toLowerCase().includes(w.toLowerCase()))}

  async function sendVoice(text){
    const message=cleanTranscript(text);
    if(!message){
      setState('listening','YES?');
      try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance('はい');u.lang='ja-JP';u.rate=1.05;speaking=true;u.onend=()=>{speaking=false;setState(null,'STANDBY')};speechSynthesis.speak(u)}catch(e){}
      return;
    }
    setState('thinking','THINKING');
    if(typeof window.go==='function'){
      try{await window.go(message)}catch(e){}
      setState(null,'STANDBY');
      return;
    }
    try{
      const r=await fetch('https://jarvis-api.t-ups2024.workers.dev/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message})});
      const j=await r.json(); const reply=j.reply||'回答を取得できませんでした';
      const log=document.getElementById('chatlog'); if(log){const d=document.createElement('div');d.className='msg ai';d.textContent=reply;log.appendChild(d);log.scrollTop=log.scrollHeight}
      if('speechSynthesis' in window){const u=new SpeechSynthesisUtterance(reply);u.lang='ja-JP';u.rate=1.04;speaking=true;u.onstart=()=>setState('speaking','RESPONDING');u.onend=()=>{speaking=false;setState(null,'STANDBY')};speechSynthesis.speak(u)} else setState(null,'STANDBY');
    }catch(e){setState(null,'OFFLINE')}
  }

  function startWakeMode(){
    const core=document.getElementById('voiceCore'); if(!core)return;
    if(!SR){core.onclick=()=>{const ai=document.querySelector('[data-go="ai"]');ai?.click()};return}
    if(wakeRec){armed=true;try{wakeRec.start()}catch(e){};return}
    wakeRec=new SR(); wakeRec.lang='ja-JP'; wakeRec.continuous=true; wakeRec.interimResults=true;
    wakeRec.onstart=()=>{armed=true;setState(null,'VOICE READY')};
    wakeRec.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed'){armed=false;setState(null,'MIC BLOCKED')}};
    wakeRec.onresult=e=>{
      let final='';
      for(let i=e.resultIndex;i<e.results.length;i++){if(e.results[i].isFinal)final+=e.results[i][0].transcript}
      if(!final||speaking)return;
      if(hasWake(final)){setState('listening','LISTENING');sendVoice(final)}
    };
    wakeRec.onend=()=>{if(armed&&!speaking){setTimeout(()=>{try{wakeRec.start()}catch(e){}},450)}};
    try{wakeRec.start()}catch(e){}
  }

  function init(){
    injectStyles();renameVisibleUi();buildCore();
    const core=document.getElementById('voiceCore'); if(!core)return;
    core.onclick=e=>{e.preventDefault();e.stopPropagation();startWakeMode();setState(null,'VOICE READY')};
    const status=document.getElementById('status'); if(status)status.textContent='UP’s AI READY';
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(init,0),{once:true});else setTimeout(init,0);
})();