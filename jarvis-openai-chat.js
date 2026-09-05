/* JARVIS generated-AI bridge. Uses server-side /api/chat when available and falls back to the existing local JARVIS bridge. */
(function(){
  'use strict';

  const API_BASE='https://jarvis-api.t-ups2024.workers.dev';
  const RESPONSE_KEY='jarvis-openai-previous-response-id';
  let busy=false;

  const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
  const esc=v=>String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function logEl(){return document.getElementById('aiChatLog');}
  function inputEl(){return document.getElementById('aiChatText');}
  function sendEl(){return document.getElementById('aiChatSend');}

  function addRow(role,text,meta=''){
    const log=logEl(); if(!log)return;
    const row=document.createElement('div');
    row.className='ai-row '+(role==='jarvis'?'jarvis':'user');
    row.innerHTML=`<div class="ai-avatar">${role==='jarvis'?'J':'YOU'}</div><div class="ai-bubble"><b>${role==='jarvis'?'JARVIS':'YOU'}${meta?` <small style="opacity:.66;font-weight:600">${esc(meta)}</small>`:''}</b><p>${esc(text)}</p></div>`;
    log.appendChild(row); log.scrollTop=log.scrollHeight;
    try{window.JARVIS_CHAT_MEMORY?.remember(role,text,window.JARVIS_ACTIVE_DEPARTMENT||'ceo');}catch(e){}
  }

  function history(){
    try{return (window.JARVIS_CHAT_MEMORY?.get?.()||[]).slice(-16).map(x=>({role:x.role==='jarvis'?'assistant':'user',content:x.text}));}
    catch(e){return []}
  }

  function legacyFallback(text){
    const main=document.getElementById('voiceText'), btn=document.getElementById('voiceSend');
    if(!main||!btn){addRow('jarvis','生成AIサーバーに接続できませんでした。少し時間をおいて再度お試しください。','LOCAL');return;}
    const chat=document.getElementById('chatLog');
    const before=chat?.querySelectorAll('.msg.jarvis p').length||0;
    main.value=text; btn.click();
    setTimeout(()=>{
      const msgs=chat?.querySelectorAll('.msg.jarvis p')||[];
      const reply=msgs.length>before?msgs[msgs.length-1].textContent:'業務データを確認しました。';
      addRow('jarvis',reply,'LOCAL FALLBACK');
    },130);
  }

  async function sendToAI(text){
    if(busy)return;
    const input=inputEl();
    text=norm(text||input?.value); if(!text)return;
    busy=true;
    if(input)input.value='';
    addRow('user',text);
    const dept=window.JARVIS_ROUTE_DEPARTMENT?.(text)||'ceo';
    const approval=window.JARVIS_APPROVAL_CHECK?.(text)||{required:false};
    try{
      const previousResponseId=localStorage.getItem(RESPONSE_KEY)||null;
      const r=await fetch(API_BASE+'/api/chat',{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify({
          message:text,
          department:dept,
          approvalRequired:!!approval.required,
          previousResponseId,
          history:history()
        })
      });
      if(!r.ok)throw new Error('AI endpoint '+r.status);
      const data=await r.json();
      if(!data?.success||!data?.reply)throw new Error(data?.error||'AI response invalid');
      if(data.responseId)localStorage.setItem(RESPONSE_KEY,data.responseId);
      addRow('jarvis',data.reply,data.departmentLabel||'GENERATIVE AI');
      if(window.JARVIS_VOICE_AI?.speak)window.JARVIS_VOICE_AI.speak(data.reply);
    }catch(e){
      console.warn('[JARVIS AI] server unavailable, using local fallback',e);
      legacyFallback(text);
    }finally{busy=false;}
  }

  function wire(){
    const send=sendEl(), input=inputEl();
    if(send&&!send.dataset.jarvisOpenAiBound){
      send.dataset.jarvisOpenAiBound='1';
      send.addEventListener('click',e=>{e.preventDefault();e.stopImmediatePropagation();sendToAI(input?.value);},true);
    }
    if(input&&!input.dataset.jarvisOpenAiBound){
      input.dataset.jarvisOpenAiBound='1';
      input.addEventListener('keydown',e=>{
        if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();e.stopImmediatePropagation();sendToAI(input.value);}
      },true);
    }
  }

  window.JARVIS_GENERATIVE_AI={send:sendToAI,resetConversation:()=>localStorage.removeItem(RESPONSE_KEY),apiBase:API_BASE};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(wire,1000));else setTimeout(wire,1000);
  new MutationObserver(wire).observe(document.documentElement,{childList:true,subtree:true});
})();
