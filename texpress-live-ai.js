(()=>{
  const VERSION='TEXPRESS-VOICE-1.0';
  const CALL_API='https://jarvis-api.t-ups2024.workers.dev/api/realtime/call';
  const PROMPT="あなたは個人事業 T_Express 専用AI。UP'Sの配送運営AIとは完全に独立している。T_ExpressのAI事業、採用事業、営業事業、商品開発、SNS、note、収益化を支援し、通常の質問にも自然に答える。未確認の事業数値は推測しない。日本語で簡潔に答える。";
  const TIMEOUT=15000;
  let pc=null,dc=null,stream=null,audio=null,connecting=false,connected=false;
  const $=id=>document.getElementById(id);
  function add(text,cls){const log=$('log');if(!log||!text)return;const d=document.createElement('div');d.className='msg '+cls;d.textContent=text;log.appendChild(d);log.scrollTop=log.scrollHeight}
  function setState(state,label){
    const b=$('voice'),core=$('tx-core'),st=$('tx-status');
    if(core)core.dataset.state=state;
    if(st)st.textContent=label||'';
    if(!b)return;
    if(state==='connecting')b.textContent='🎙 接続中…';
    else if(state==='listening')b.textContent='🎙 会話中・タップで終了';
    else if(state==='speaking')b.textContent='🔊 T_Express AI 応答中';
    else if(state==='error')b.textContent='⚠ 音声接続エラー';
    else b.textContent='🎙 T_Express AIと話す';
  }
  function dispose(){
    try{dc&&dc.close()}catch{}
    try{pc&&pc.close()}catch{}
    try{stream&&stream.getTracks().forEach(t=>t.stop())}catch{}
    if(audio){try{audio.srcObject=null;audio.remove()}catch{}}
    pc=dc=stream=audio=null;connecting=false;connected=false;
  }
  function stop(){dispose();setState('idle','音声待機中')}
  function fail(msg){console.warn('T_Express voice',msg);dispose();setState('error','音声接続を確認できません');add('音声接続を確認できませんでした。マイク許可を確認して、もう一度お試しください。','bot')}
  function onEvent(ev){let e;try{e=JSON.parse(ev.data)}catch{return}const t=e.type||'';
    if(t==='session.created'||t==='session.updated'){connected=true;connecting=false;setState('listening','音声会話中')}
    if(t.includes('input_audio_buffer.speech_started'))setState('listening','聞いています…');
    if(t.includes('response.audio')||t.includes('response.output_audio'))setState('speaking','返答しています…');
    if(t==='response.done')setState('listening','音声会話中');
    if(t==='conversation.item.input_audio_transcription.completed'){
      const text=e.transcript||e.item?.content?.[0]?.transcript;if(text)add(text,'user');
    }
    if(t==='response.audio_transcript.done'||t==='response.output_audio_transcript.done'){
      const text=e.transcript;if(text)add(text,'bot');
    }
    if(t==='error'){const msg=e.error?.message||e.message||'Realtime error';fail(msg)}
  }
  async function start(){
    if(connected){stop();return false}
    if(connecting)return false;
    if(!navigator.mediaDevices?.getUserMedia||!window.RTCPeerConnection){fail('unsupported');return false}
    connecting=true;setState('connecting','マイク接続中…');
    const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),TIMEOUT);
    try{
      pc=new RTCPeerConnection();
      audio=document.createElement('audio');audio.autoplay=true;audio.playsInline=true;audio.style.display='none';document.body.appendChild(audio);
      pc.ontrack=e=>{audio.srcObject=e.streams[0]||new MediaStream([e.track]);audio.play().catch(()=>{})};
      pc.onconnectionstatechange=()=>{const s=pc?.connectionState;if(s==='failed'||s==='disconnected')fail('WebRTC '+s)};
      stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});
      stream.getTracks().forEach(t=>pc.addTrack(t,stream));
      dc=pc.createDataChannel('oai-events');dc.onmessage=onEvent;
      dc.onopen=()=>{clearTimeout(timer);connected=true;connecting=false;try{dc.send(JSON.stringify({type:'session.update',session:{type:'realtime',instructions:PROMPT}}))}catch{}setState('listening','音声会話中')};
      dc.onclose=()=>{if(connected)stop()};
      const offer=await pc.createOffer();await pc.setLocalDescription(offer);
      const r=await fetch(CALL_API,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sdp:offer.sdp,version:VERSION,spec:PROMPT}),signal:controller.signal});
      const answer=await r.text();if(!r.ok)throw new Error('Worker '+r.status+': '+answer.slice(0,160));if(!answer.startsWith('v='))throw new Error('Invalid SDP');
      await pc.setRemoteDescription({type:'answer',sdp:answer});
      return true;
    }catch(e){clearTimeout(timer);fail(e?.name==='AbortError'?'timeout':e?.message||e);return false}
  }
  window.texpressLiveStart=start;window.texpressLiveStop=stop;window.texpressLiveConnected=()=>connected;
})();