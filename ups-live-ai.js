(()=>{
  const VERSION='V7.3.9';
  const CALL_API='https://jarvis-api.t-ups2024.workers.dev/api/realtime/call';
  const CONNECT_TIMEOUT_MS=15000;
  let pc=null,dc=null,stream=null,audio=null,connecting=false,connected=false,lastError='',handlingInternal=false;

  function emit(name,detail){window.dispatchEvent(new CustomEvent(name,{detail}))}
  function setStatus(t){const s=document.getElementById('status');if(s)s.textContent=t}
  function setCore(state,label){
    emit('ups-live-state',{state,label});
    const c=document.querySelector('#aiOffice .aio-core,#aiOffice .ups-core');
    if(c){
      c.classList.toggle('busy',state==='connecting'||state==='speaking'||state==='thinking');
      const sm=c.querySelector('small');
      if(sm)sm.textContent=label||'LIVE';
    }
    const v=document.querySelector('#aiOffice .aio-voice,#aiOffice .ups-talk');
    if(v){
      if(state==='error')v.textContent='⚠ '+(label||'LIVE ERROR');
      else if(state==='connecting')v.textContent='🎙 CONNECTING…';
      else if(state==='listening')v.textContent='🎙 LIVE / LISTENING';
      else if(state==='speaking')v.textContent='🔊 SPEAKING';
    }
  }
  function dispose(){
    try{if(dc){dc.onclose=null;dc.onmessage=null;dc.close()}}catch{}
    try{if(pc){pc.onconnectionstatechange=null;pc.ontrack=null;pc.close()}}catch{}
    try{stream&&stream.getTracks().forEach(t=>t.stop())}catch{}
    dc=pc=stream=null;
    if(audio){try{audio.srcObject=null;audio.remove()}catch{}audio=null}
  }
  function cleanup(label='TAP / VOICE'){
    connected=false;connecting=false;lastError='';dispose();
    setStatus('UP’s AI READY');setCore('idle',label);emit('ups-live-disconnected',null)
  }
  function fail(msg,label='LIVE ERROR'){
    connected=false;connecting=false;lastError=msg||label;dispose();
    setStatus(`LIVE ERROR: ${lastError}`);setCore('error',label);emit('ups-live-unavailable',{error:lastError})
  }
  function addTranscript(text,cls){const log=document.getElementById('chatlog');if(!log||!text)return;const d=document.createElement('div');d.className='msg '+cls;d.textContent=text;log.appendChild(d);log.scrollTop=log.scrollHeight}
  function applySpec(){
    if(!dc||dc.readyState!=='open'||typeof window.upsSpecPrompt!=='function')return;
    try{dc.send(JSON.stringify({type:'session.update',session:{type:'realtime',instructions:window.upsSpecPrompt()}}))}catch(e){console.warn('spec update failed',e)}
  }
  async function handleInternalTranscript(text){
    if(handlingInternal||typeof window.upsInternalAction!=='function'||!text)return false;
    try{
      const action=await window.upsInternalAction(text);
      if(!action?.handled)return false;
      handlingInternal=true;
      try{if(dc?.readyState==='open')dc.send(JSON.stringify({type:'response.cancel'}))}catch{}
      setCore('thinking',action.approvalRequired?'APPROVAL REQUIRED':'INTERNAL FIX');
      emit('ups-internal-action',{message:text,...action,voice:true});
      const reply=action.reply||'内部処理を実行しました。';
      addTranscript(reply,'ai');
      const tracks=stream?.getAudioTracks?.()||[];tracks.forEach(t=>t.enabled=false);
      try{if(typeof window.upsSpeak==='function')await window.upsSpeak(reply)}catch{}
      tracks.forEach(t=>t.enabled=true);
      setCore('listening','YOUR TURN');setStatus(action.approvalRequired?'最終承認が必要です':'アップズ君 LIVE');
      return true;
    }catch(e){console.warn('internal voice action failed',e);return false}
    finally{handlingInternal=false}
  }
  function onEvent(raw){let e;try{e=JSON.parse(raw.data)}catch{return}
    const type=e.type||'';
    if(type==='session.created'||type==='session.updated'){connected=true;connecting=false;lastError='';setStatus('アップズ君 LIVE');setCore('listening','LIVE / LISTENING');emit('ups-live-connected',e)}
    if(type.includes('input_audio_buffer.speech_started')){setCore('listening','LISTENING');emit('ups-chat-busy',false)}
    if(type.includes('response.audio')||type.includes('response.output_audio')){if(!handlingInternal){setCore('speaking','SPEAKING');emit('ups-chat-busy',true)}}
    if(type==='response.done'){if(!handlingInternal){setCore('listening','YOUR TURN');emit('ups-chat-busy',false)}}
    if(type==='conversation.item.input_audio_transcription.completed'){
      const t=e.transcript||e.item?.content?.[0]?.transcript;
      if(t){addTranscript(t,'me');handleInternalTranscript(t)}
    }
    if(type==='response.audio_transcript.done'||type==='response.output_audio_transcript.done'){const t=e.transcript;if(t&&!handlingInternal)addTranscript(t,'ai')}
    if(type==='error'){const msg=e.error?.message||e.message||'Realtime session error';if(/cancel/i.test(msg)&&handlingInternal)return;console.warn('UPs realtime error',e);fail(msg,'LIVE ERROR')}
  }

  async function start(){
    if(connected)return true;
    if(connecting)return false;
    lastError='';
    if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection){fail('このブラウザでは音声接続を開始できません','VOICE UNSUPPORTED');return false}
    connecting=true;setStatus('アップズ君 LIVE 接続中…');setCore('connecting','CONNECTING');
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),CONNECT_TIMEOUT_MS);
    try{
      pc=new RTCPeerConnection();
      audio=document.createElement('audio');audio.autoplay=true;audio.playsInline=true;audio.style.display='none';document.body.appendChild(audio);
      pc.ontrack=e=>{audio.srcObject=e.streams[0]||new MediaStream([e.track]);audio.play().catch(()=>{})};
      pc.onconnectionstatechange=()=>{
        const st=pc?.connectionState;
        if(st==='failed'||st==='disconnected')fail(`WebRTC ${st}`,'CONNECTION LOST');
        if(st==='closed'&&connected)cleanup('TAP / VOICE');
      };
      stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
      stream.getTracks().forEach(t=>pc.addTrack(t,stream));
      dc=pc.createDataChannel('oai-events');
      dc.onmessage=onEvent;
      dc.onopen=()=>{connected=true;connecting=false;lastError='';clearTimeout(timeout);applySpec();setStatus('アップズ君 LIVE');setCore('listening','LIVE / LISTENING')};
      dc.onclose=()=>{if(connected)cleanup('TAP / VOICE')};
      const offer=await pc.createOffer();await pc.setLocalDescription(offer);
      const spec=typeof window.upsSpecPrompt==='function'?window.upsSpecPrompt():'';
      const r=await fetch(CALL_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sdp:offer.sdp,version:VERSION,spec}),signal:controller.signal});
      const answer=await r.text();
      if(!r.ok)throw new Error(`Worker ${r.status}: ${answer.slice(0,220)}`);
      if(!answer||!answer.startsWith('v='))throw new Error(`Invalid SDP: ${answer.slice(0,180)}`);
      await pc.setRemoteDescription({type:'answer',sdp:answer});
      return true;
    }catch(e){
      clearTimeout(timeout);
      const msg=e?.name==='AbortError'?'接続タイムアウト':String(e?.message||e);
      console.warn('UPs LIVE unavailable',e);
      fail(msg,e?.name==='AbortError'?'TIMEOUT':'LIVE ERROR');
      return false;
    }
  }
  window.addEventListener('ups-spec-changed',()=>{if(connected)applySpec()});
  window.upsLiveStart=start;
  window.upsLiveStop=()=>cleanup();
  window.upsLiveConnected=()=>connected;
  window.upsLiveLastError=()=>lastError;
})();