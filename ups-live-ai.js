(()=>{
  const VERSION='V7.1.0';
  const CALL_API='https://jarvis-api.t-ups2024.workers.dev/api/realtime/call';
  let pc=null,dc=null,stream=null,audio=null,connecting=false,connected=false;

  function emit(name,detail){window.dispatchEvent(new CustomEvent(name,{detail}))}
  function setStatus(t){const s=document.getElementById('status');if(s)s.textContent=t}
  function setCore(state,label){emit('ups-live-state',{state,label});const c=document.querySelector('#aiOffice .aio-core');if(c){c.classList.toggle('busy',state==='connecting'||state==='speaking');const sm=c.querySelector('small');if(sm)sm.textContent=label||'LIVE'}}
  function cleanup(){connected=false;connecting=false;try{dc&&dc.close()}catch{}try{pc&&pc.close()}catch{}try{stream&&stream.getTracks().forEach(t=>t.stop())}catch{}dc=pc=stream=null;if(audio){try{audio.srcObject=null;audio.remove()}catch{}audio=null}setStatus('UP’s AI READY');setCore('idle','TAP / VOICE');emit('ups-live-disconnected',null)}
  function addTranscript(text,cls){const log=document.getElementById('chatlog');if(!log||!text)return;const d=document.createElement('div');d.className='msg '+cls;d.textContent=text;log.appendChild(d);log.scrollTop=log.scrollHeight}
  function onEvent(raw){let e;try{e=JSON.parse(raw.data)}catch{return}
    const type=e.type||'';
    if(type==='session.created'||type==='session.updated'){connected=true;connecting=false;setStatus('アップズ君 LIVE');setCore('listening','LIVE / LISTENING');emit('ups-live-connected',e)}
    if(type.includes('input_audio_buffer.speech_started')){setCore('listening','LISTENING');emit('ups-chat-busy',false)}
    if(type.includes('response.audio')||type.includes('response.output_audio')){setCore('speaking','SPEAKING');emit('ups-chat-busy',true)}
    if(type==='response.done'){setCore('listening','YOUR TURN');emit('ups-chat-busy',false)}
    if(type==='conversation.item.input_audio_transcription.completed'){const t=e.transcript||e.item?.content?.[0]?.transcript;if(t)addTranscript(t,'me')}
    if(type==='response.audio_transcript.done'||type==='response.output_audio_transcript.done'){const t=e.transcript;if(t)addTranscript(t,'ai')}
    if(type==='error'){console.warn('UPs realtime error',e);setStatus('LIVE ERROR');setCore('error','LIVE ERROR')}
  }

  async function start(){
    if(connected)return true;
    if(connecting)return false;
    if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection){return false}
    connecting=true;setStatus('アップズ君 LIVE 接続中…');setCore('connecting','CONNECTING');
    try{
      pc=new RTCPeerConnection();
      audio=document.createElement('audio');audio.autoplay=true;audio.playsInline=true;audio.style.display='none';document.body.appendChild(audio);
      pc.ontrack=e=>{audio.srcObject=e.streams[0]||new MediaStream([e.track]);audio.play().catch(()=>{})};
      pc.onconnectionstatechange=()=>{if(['failed','closed','disconnected'].includes(pc.connectionState))cleanup()};
      stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
      stream.getTracks().forEach(t=>pc.addTrack(t,stream));
      dc=pc.createDataChannel('oai-events');dc.onmessage=onEvent;dc.onopen=()=>{connected=true;connecting=false;setStatus('アップズ君 LIVE');setCore('listening','LIVE / LISTENING')};dc.onclose=cleanup;
      const offer=await pc.createOffer();await pc.setLocalDescription(offer);
      const r=await fetch(CALL_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sdp:offer.sdp,version:VERSION})});
      if(!r.ok)throw new Error('realtime '+r.status);
      const answer=await r.text();if(!answer||!answer.startsWith('v='))throw new Error('invalid SDP');
      await pc.setRemoteDescription({type:'answer',sdp:answer});
      return true;
    }catch(e){console.warn('UPs LIVE unavailable, fallback to legacy voice',e);cleanup();emit('ups-live-unavailable',{error:String(e)});return false}
  }
  window.upsLiveStart=start;window.upsLiveStop=cleanup;window.upsLiveConnected=()=>connected;
})();