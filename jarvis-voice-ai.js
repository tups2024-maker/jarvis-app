/* JARVIS voice -> AI chat -> action/navigation -> spoken response */
(function(){
  'use strict';

  const SpeechRecognition=window.SpeechRecognition||window.webkitSpeechRecognition;
  const synth=window.speechSynthesis;
  let recognition=null;
  let listening=false;
  let wakeMode=false;
  let awaitingCommand=false;
  let speaking=false;
  let restartTimer=null;
  let commandTimer=null;
  let lastSpoken='';

  const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
  const setStatus=t=>{ const el=document.getElementById('voiceStatus')||document.getElementById('wakeStatus'); if(el) el.textContent=t; };
  const clearRestart=()=>{ if(restartTimer){ clearTimeout(restartTimer); restartTimer=null; } };
  const clearCommandTimer=()=>{ if(commandTimer){ clearTimeout(commandTimer); commandTimer=null; } };
  const armCommandWindow=()=>{
    awaitingCommand=true;
    clearCommandTimer();
    commandTimer=setTimeout(()=>{
      commandTimer=null;
      awaitingCommand=false;
      if(wakeMode) setStatus('「はい、JARVIS」を待っています');
    },12000);
  };
  const scheduleRestart=(delay=450)=>{
    clearRestart();
    if(!wakeMode||speaking) return;
    restartTimer=setTimeout(()=>{ restartTimer=null; start(); },delay);
  };

  function speak(text){
    const t=norm(text);
    if(!t||!synth||t===lastSpoken) return;
    lastSpoken=t;
    try{
      speaking=true;
      clearRestart();
      if(recognition&&listening){ try{ recognition.stop(); }catch(e){} }
      synth.cancel();
      const u=new SpeechSynthesisUtterance(t.slice(0,500));
      u.lang='ja-JP';
      u.rate=1.03;
      u.onstart=()=>{ speaking=true; setStatus('JARVISが応答しています…'); };
      const finish=()=>{
        speaking=false;
        setStatus(awaitingCommand?'ご用件をどうぞ':(wakeMode?'「はい、JARVIS」を待っています':'JARVIS 音声待機'));
        scheduleRestart(600);
      };
      u.onend=finish;
      u.onerror=finish;
      synth.speak(u);
    }catch(e){
      speaking=false;
      console.warn('[JARVIS VOICE] speech synthesis failed',e);
      scheduleRestart();
    }
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
    awaitingCommand=false;
    clearCommandTimer();
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
    if(!recognition||listening||speaking) return;
    clearRestart();
    try{ recognition.start(); }catch(e){}
  }
  function stop(preserveWake=false){
    if(!recognition) return;
    clearRestart();
    clearCommandTimer();
    awaitingCommand=false;
    if(!preserveWake) wakeMode=false;
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
    recognition.onstart=()=>{
      listening=true;
      setStatus(awaitingCommand?'ご用件をどうぞ':(wakeMode?'「はい、JARVIS」を待っています':'音声を聞いています…'));
    };
    recognition.onend=()=>{
      listening=false;
      if(wakeMode&&!speaking) scheduleRestart();
      else if(!speaking) setStatus('JARVIS 音声待機');
    };
    recognition.onerror=e=>{
      listening=false;
      const code=e.error||'error';
      if(code==='not-allowed'||code==='service-not-allowed'){
        wakeMode=false;
        awaitingCommand=false;
        clearRestart();
        clearCommandTimer();
        setStatus('マイク許可が必要です');
        const wake=document.getElementById('wakeBtn');
        if(wake) wake.textContent='○ 呼びかけ待機 OFF';
        return;
      }
      setStatus(`音声認識: ${code}`);
      if(wakeMode&&!speaking&&code!=='aborted') scheduleRestart(800);
    };
    recognition.onresult=e=>{
      const text=norm(e.results?.[e.results.length-1]?.[0]?.transcript);
      if(!text||speaking) return;
      const wake=/^(はい[,、 ]*)?(JARVIS|ジャービス)/i.test(text);
      const cleaned=text.replace(/^(はい[,、 ]*)?(JARVIS|ジャービス)[,、 ]*/i,'').trim();

      if(awaitingCommand&&!wake){
        sendToJarvis(text);
        return;
      }
      if(wakeMode&&!wake){
        setStatus('「はい、JARVIS」で呼び出してください');
        return;
      }
      if(wake&&!cleaned){
        armCommandWindow();
        speak('はい。どうぞ。');
        return;
      }
      if(wake&&cleaned){
        sendToJarvis(cleaned);
        return;
      }
      sendToJarvis(text);
    };
  }

  function wireButtons(){
    const voice=document.getElementById('voiceBtn');
    if(voice&&!voice.dataset.jarvisVoiceBound){
      voice.dataset.jarvisVoiceBound='1';
      voice.addEventListener('click',()=>{ wakeMode=false; awaitingCommand=false; clearCommandTimer(); start(); });
    }
    const wake=document.getElementById('wakeBtn');
    if(wake&&!wake.dataset.jarvisVoiceBound){
      wake.dataset.jarvisVoiceBound='1';
      wake.addEventListener('click',()=>{
        wakeMode=!wakeMode;
        awaitingCommand=false;
        clearCommandTimer();
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