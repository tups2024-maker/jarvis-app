(()=>{
  const API='https://jarvis-api.t-ups2024.workers.dev/api/chat';
  const KEY_ID='ups_chat_response_id';
  const KEY_LOG='ups_chat_log_v1';
  let previousResponseId=localStorage.getItem(KEY_ID)||'';
  let busy=false;

  function logEl(){return document.getElementById('chatlog')}
  function setStatus(t){const s=document.getElementById('status');if(s)s.textContent=t}
  function add(text,cls,save=true){
    const log=logEl(); if(!log)return;
    const d=document.createElement('div'); d.className='msg '+cls; d.textContent=text; log.appendChild(d); log.scrollTop=log.scrollHeight;
    if(save){
      const arr=loadLog(); arr.push({text,cls,at:Date.now()}); localStorage.setItem(KEY_LOG,JSON.stringify(arr.slice(-40)));
    }
  }
  function loadLog(){try{return JSON.parse(localStorage.getItem(KEY_LOG)||'[]')}catch{return[]}}
  function restore(){
    const log=logEl(); if(!log)return;
    const arr=loadLog(); if(!arr.length)return;
    log.innerHTML=''; arr.forEach(x=>add(x.text,x.cls,false));
  }
  function speak(text){
    if(!('speechSynthesis' in window)||!text)return;
    try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='ja-JP';u.rate=1.04;u.pitch=1;u.onstart=()=>setStatus('アップズ君が話しています…');u.onend=()=>setStatus('UP’s AI READY');speechSynthesis.speak(u)}catch(e){}
  }
  async function chat(message,{voice=false}={}){
    message=String(message||'').trim(); if(!message||busy)return;
    if(typeof window.show==='function')window.show('ai');
    add(message,'me'); busy=true; setStatus('アップズ君が考えています…');
    const send=document.getElementById('send'); if(send)send.disabled=true;
    try{
      const payload={message}; if(previousResponseId)payload.previousResponseId=previousResponseId;
      const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const j=await r.json();
      if(!r.ok||!j.success)throw new Error(j.error||'AI response error');
      const reply=j.reply||'回答を取得できませんでした';
      add(reply,'ai');
      if(j.responseId){previousResponseId=j.responseId;localStorage.setItem(KEY_ID,previousResponseId)}
      setStatus('UP’s AI READY');
      if(voice)speak(reply);
      return reply;
    }catch(e){
      add('通信に失敗しました。もう一度お試しください。','ai'); setStatus('ERROR');
    }finally{busy=false;if(send)send.disabled=false}
  }
  function resetChat(){
    previousResponseId=''; localStorage.removeItem(KEY_ID); localStorage.removeItem(KEY_LOG);
    const log=logEl(); if(log)log.innerHTML='<div class="msg ai">アップズ君です。新しい会話を始めます。</div>';
    setStatus('NEW CHAT');
  }
  function enhanceUi(){
    restore();
    const input=document.getElementById('chat'),send=document.getElementById('send');
    if(input){input.placeholder='アップズ君にメッセージ';input.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();const t=input.value;input.value='';chat(t)}}}
    if(send)send.onclick=()=>{const t=input?.value||'';if(input)input.value='';chat(t)};
    const card=logEl()?.parentElement;
    if(card&&!document.getElementById('upsNewChat')){
      const b=document.createElement('button');b.id='upsNewChat';b.type='button';b.textContent='＋ 新しい会話';b.style.cssText='margin:8px 0 0;padding:8px 12px;border:1px solid #286b7b;border-radius:999px;background:#051d29;color:#aef8ff;font-weight:800;cursor:pointer';b.onclick=resetChat;
      const h=card.querySelector('h2'); if(h)h.insertAdjacentElement('afterend',b); else card.prepend(b);
    }
    setStatus(previousResponseId?'CONTEXT READY':'UP’s AI READY');
  }

  window.upsChat=chat;
  window.go=async function(textOverride){
    const input=document.getElementById('chat');
    const message=String(textOverride||input?.value||'').trim();
    if(input&&!textOverride)input.value='';
    return chat(message,{voice:!!textOverride});
  };

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(enhanceUi,50),{once:true});else setTimeout(enhanceUi,50);
})();