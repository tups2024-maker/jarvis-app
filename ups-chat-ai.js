(()=>{
  const VERSION='V7.2.0';
  const API='https://jarvis-api.t-ups2024.workers.dev/api/chat';
  const KEY_ID='ups_chat_response_id';
  const KEY_LOG='ups_chat_log_v1';
  let previousResponseId=localStorage.getItem(KEY_ID)||'';
  let busy=false;
  let voiceCache=[];

  function emit(name,detail){window.dispatchEvent(new CustomEvent(name,{detail}))}
  function signal(v){emit('ups-chat-busy',!!v)}
  function logEl(){return document.getElementById('chatlog')}
  function setStatus(t){const s=document.getElementById('status');if(s)s.textContent=t}
  function add(text,cls,save=true){const log=logEl();if(!log)return;const d=document.createElement('div');d.className='msg '+cls;d.textContent=text;log.appendChild(d);log.scrollTop=log.scrollHeight;if(save){const arr=loadLog();arr.push({text,cls,at:Date.now()});localStorage.setItem(KEY_LOG,JSON.stringify(arr.slice(-40)))}}
  function loadLog(){try{return JSON.parse(localStorage.getItem(KEY_LOG)||'[]')}catch{return[]}}
  function restore(){const log=logEl();if(!log)return;const arr=loadLog();if(!arr.length)return;log.innerHTML='';arr.forEach(x=>add(x.text,x.cls,false))}

  function refreshVoices(){try{voiceCache=speechSynthesis.getVoices()||[]}catch{voiceCache=[]}}
  function bestJapaneseVoice(){
    refreshVoices();
    const jp=voiceCache.filter(v=>/^ja(-|_)?/i.test(v.lang||'')||/Japanese|日本語/i.test(v.name||''));
    if(!jp.length)return null;
    const preferred=['Kyoko','Otoya','Nanami','Haruka','Ayumi','Ichiro','Google 日本語','Google Japanese','Microsoft Nanami','Microsoft Haruka'];
    const score=v=>{
      let s=0,n=v.name||'';
      preferred.forEach((p,i)=>{if(n.toLowerCase().includes(p.toLowerCase()))s+=100-i});
      if(v.localService)s+=10;
      if(/^ja-JP$/i.test(v.lang||''))s+=8;
      return s;
    };
    return jp.sort((a,b)=>score(b)-score(a))[0]||null;
  }
  if('speechSynthesis'in window){refreshVoices();speechSynthesis.onvoiceschanged=refreshVoices}

  function spokenText(text){
    return String(text||'')
      .replace(/```[\s\S]*?```/g,'コード部分は画面で確認してください。')
      .replace(/https?:\/\/\S+/g,'リンクは画面に表示しています。')
      .replace(/[*#>`_~]/g,'')
      .replace(/\n{2,}/g,'。')
      .replace(/\n/g,'、')
      .replace(/\s+/g,' ')
      .trim();
  }
  function chunks(text){
    const s=spokenText(text);
    if(!s)return[];
    const parts=s.match(/[^。！？!?]+[。！？!?]?/g)||[s];
    const out=[];let buf='';
    parts.forEach(p=>{if((buf+p).length>90&&buf){out.push(buf);buf=p}else buf+=p});
    if(buf)out.push(buf);
    return out.slice(0,12);
  }

  function speak(text){
    return new Promise(resolve=>{
      if(!('speechSynthesis'in window)||!text){emit('ups-speech-end',null);resolve();return}
      const list=chunks(text);if(!list.length){emit('ups-speech-end',null);resolve();return}
      try{
        speechSynthesis.cancel();
        const voice=bestJapaneseVoice();
        let i=0,started=false;
        const next=()=>{
          if(i>=list.length){setStatus('UP’s AI READY');emit('ups-speech-end',text);resolve();return}
          const u=new SpeechSynthesisUtterance(list[i++]);
          u.lang='ja-JP';u.rate=0.96;u.pitch=1.02;u.volume=1;
          if(voice)u.voice=voice;
          u.onstart=()=>{if(!started){started=true;setStatus('アップズ君が話しています…');emit('ups-speech-start',text)}};
          u.onend=()=>setTimeout(next,75);
          u.onerror=()=>setTimeout(next,20);
          speechSynthesis.speak(u);
        };
        next();
      }catch(e){emit('ups-speech-end',null);resolve()}
    })
  }

  async function chat(message,{voice=false}={}){
    message=String(message||'').trim();if(!message||busy)return null;
    if(typeof window.show==='function')window.show('ai');
    add(message,'me');busy=true;signal(true);setStatus('アップズ君が考えています…');
    const send=document.getElementById('send');if(send)send.disabled=true;
    try{
      const spec=typeof window.upsSpecPrompt==='function'?window.upsSpecPrompt():'';
      const effectiveMessage=spec?`${spec}\n\n【ユーザー発話】\n${message}`:message;
      const payload={message:effectiveMessage,mode:voice?'voice':'text',clientVersion:VERSION};
      if(previousResponseId)payload.previousResponseId=previousResponseId;
      const r=await fetch(API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
      const j=await r.json();if(!r.ok||!j.success)throw new Error(j.error||'AI response error');
      const reply=j.reply||'回答を取得できませんでした';
      add(reply,'ai');
      if(j.responseId){previousResponseId=j.responseId;localStorage.setItem(KEY_ID,previousResponseId)}
      emit('ups-chat-reply',{message,reply,responseId:j.responseId||null,voice});
      setStatus('UP’s AI READY');
      if(voice)await speak(reply);
      return reply;
    }catch(e){
      const reply='通信に失敗しました。もう一度お試しください。';add(reply,'ai');setStatus('ERROR');emit('ups-chat-error',{message,error:String(e)});return null
    }finally{busy=false;signal(false);if(send)send.disabled=false}
  }

  function resetChat(){previousResponseId='';localStorage.removeItem(KEY_ID);localStorage.removeItem(KEY_LOG);const log=logEl();if(log)log.innerHTML='<div class="msg ai">アップズ君です。新しい会話を始めます。</div>';setStatus('NEW CHAT');emit('ups-chat-reset',null)}
  function enhanceUi(){
    restore();
    const input=document.getElementById('chat'),send=document.getElementById('send');
    if(input){input.placeholder='アップズ君にメッセージ';input.onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();const t=input.value;input.value='';chat(t)}}}
    if(send)send.onclick=()=>{const t=input?.value||'';if(input)input.value='';chat(t)};
    const card=logEl()?.parentElement;
    if(card&&!document.getElementById('upsNewChat')){const b=document.createElement('button');b.id='upsNewChat';b.type='button';b.textContent='＋ 新しい会話';b.style.cssText='margin:8px 0 0;padding:8px 12px;border:1px solid #286b7b;border-radius:999px;background:#051d29;color:#aef8ff;font-weight:800;cursor:pointer';b.onclick=resetChat;const h=card.querySelector('h2');if(h)h.insertAdjacentElement('afterend',b);else card.prepend(b)}
    setStatus(previousResponseId?'CONTEXT READY':'UP’s AI READY')
  }
  window.upsChat=chat;window.upsSpeak=speak;window.go=async function(textOverride){const input=document.getElementById('chat');const message=String(textOverride||input?.value||'').trim();if(input&&!textOverride)input.value='';return chat(message,{voice:!!textOverride})};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(enhanceUi,50),{once:true});else setTimeout(enhanceUi,50);
})();