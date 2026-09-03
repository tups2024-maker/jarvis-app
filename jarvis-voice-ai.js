/* JARVIS voice -> AI chat -> action/navigation -> spoken response */
(function(){
  'use strict';

  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  const synth=window.speechSynthesis;
  let recognition=null;
  let listening=false;
  let wakeMode=false;
  let lastSpoken='';

  const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
  const setStatus=t=>{ const el=document.getElementById('voiceStatus')||document.getElementById('wakeStatus'); if(el) el.textContent=t; };

  function speak(text){
    const t=norm(text);
    if(!t||!synth||t===lastSpoken) return;
    lastSpoken=t;
    try{
      synth.cancel();
      const u=new SpeechSynthesisUtterance(t.slice(0,500));
      u.lang='ja-JP';
      u.rate=1.03;
      synth.speak(u);
    }catch(e){ console.warn('[JARVIS VOICE] speech synthesis failed',e); }
  }

  function pageCommand(text){
    const t=norm(text);
    const rules=[
      [/配送管理|管理表/, 'workbook'],
      [/シフト/, 'shiftboard'],
      [/売上|粗利|利益/, 'sales'],
      [/メール|Gmail|カレンダー/, 'googlehub'],
      [/Slack|スラック/i, 'slackhub'],
      [/営業|案件獲得/, 'salescrm'],
      [/求人/, 'jobs'],
      [/収益|記事|note|SNS/, 'monetize'],
      [/T[_\- ]?Express|ホームページ/i, 'texpress']
    ];
    for(const [re,page] of rules){
      if(re.test(t)){
        const btn=document.querySelector(`[data-page="${page}"]`);
        if(btn){ btn.click(); return true; }
      }
    }
    return false;
  }

  function setInputValue(input,text){
    if(!input) return;
    input.focus?.();
    input.value=text;
    input.dispatchEvent(new Event('input',{bubbles:true}));
    input.dispatchEvent(new Event('change',{bubbles:true}));
  }

  function findAiSend(ai){
    if(!ai) return null;
    const scopes=[ai.parentElement,ai.closest('form'),ai.closest('.ai-chat-input'),ai.closest('.chat-input'),ai.closest('.composer')].filter(Boolean);
    for(const scope of scopes){
      const buttons=[...scope.querySelectorAll('button')];
      const found=buttons.find(b=>/send|送信|submit/i.test(`${b.id||''} ${b.className||''} ${norm(b.textContent)}`));
      if(found) return found;
    }
    return document.getElementById('aiChatSend')||document.getElementById('aiSend')||null;
  }

  function sendToJarvis(text){
    const t=norm(text);
    if(!t) return;
    pageCommand(t);

    const ai=document.getElementById('aiChatText');
    if(ai){
      setInputValue(ai,t);
      const aiSend=findAiSend(ai);
      if(aiSend){
        aiSend.click();
      }else{
        ai.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true,cancelable:true}));
        ai.dispatchEvent(new KeyboardEvent('keyup',{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true,cancelable:true}));
      }
      setStatus('JARVISが処理中…');
      return;
    }

    const bridge=document.getElementById('voiceText');
    if(bridge){
      setInputValue(bridge,t);
      const send=document.getElementById('voiceSend');
      if(send){ send.click(); setStatus('JARVISが処理中…'); }
      else setStatus('音声を文字入力しました');
    }
  }

  function start(){
    if(!recognition||listening) return;
    try{ recognition.start(); }catch(e){}
  }
  function stop(){
    if(!recognition) return;
    wakeMode=false;
    try{ recognition.stop(); }catch(e){}
  }

  function setupRecognition(){
    if(!SpeechRecognition){
      setStatus('このブラウザは音声認識に未対応です');
      return;
    }
    recognition=new SpeechRecognition();
    recognition.lang='ja-JP';
    recognition.interimResults=false;
    recognition.continuous=false;
    recognition.onstart=()=>{ listening=true; setStatus('音声を聞いています…'); };
    recognition.onend=()=>{
      listening=false;
      if(wakeMode) setTimeout(start,350); else setStatus('JARVIS 音声待機');
    };
    recognition.onerror=e=>{ listening=false; setStatus(`音声認識: ${e.error||'error'}`); };
    recognition.onresult=e=>{
      const text=norm(e.results?.[e.results.length-1]?.[0]?.transcript);
      if(!text) return;
      const wake=/^(はい[,、 ]*)?(JARVIS|ジャービス)/i.test(text);
      if(wakeMode&&!wake){ setStatus('「はい、JARVIS」で呼び出してください'); return; }
      const cleaned=text.replace(/^(はい[,、 ]*)?(JARVIS|ジャービス)[,、 ]*/i,'').trim();
      if(!cleaned){ speak('はい。どうぞ。'); return; }
      sendToJarvis(cleaned);
    };
  }

  function wireButtons(){
    const voice=document.getElementById('voiceBtn');
    if(voice&&!voice.dataset.jarvisVoiceBound){
      voice.dataset.jarvisVoiceBound='1';
      voice.addEventListener('click',()=>{ wakeMode=false; start(); });
    }
    const wake=document.getElementById('wakeBtn');
    if(wake&&!wake.dataset.jarvisVoiceBound){
      wake.dataset.jarvisVoiceBound='1';
      wake.addEventListener('click',()=>{
        wakeMode=!wakeMode;
        wake.textContent=wakeMode?'● 呼びかけ待機 ON':'○ 呼びかけ待機 OFF';
        if(wakeMode) start(); else stop();
      });
    }
  }

  function speakLatest(container){
    const selectors='.msg.jarvis,.jarvis,.assistant,.ai-assistant,[data-role="assistant"]';
    const msgs=[...container.querySelectorAll(selectors)];
    const latest=msgs[msgs.length-1];
    const text=norm(latest?.innerText||latest?.textContent);
    if(text&&text!=='JARVIS ONLINE'){
      setStatus('JARVIS 応答完了');
      speak(text);
    }
  }

  function observeChat(){
    const containers=[...document.querySelectorAll('#chatLog,#aiChatLog,#aiChatMessages,.ai-chat-log,.ai-chat-messages')];
    containers.forEach(log=>{
      if(log.dataset.jarvisVoiceObserved) return;
      log.dataset.jarvisVoiceObserved='1';
      new MutationObserver(()=>speakLatest(log)).observe(log,{childList:true,subtree:true,characterData:true});
    });
  }

  function boot(){ setupRecognition(); wireButtons(); observeChat(); }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,700)); else setTimeout(boot,700);
  new MutationObserver(()=>{ wireButtons(); observeChat(); }).observe(document.documentElement,{childList:true,subtree:true});

  window.JARVIS_VOICE_AI={start,stop,send:sendToJarvis,speak};
})();
