(()=>{
  const VERSION='V7.3.13-VOICE1';
  let starting=false;

  function friendlyError(value){
    const message=String(value||'').trim();
    if(/NotAllowedError|Permission denied|permission/i.test(message))return 'マイクを「許可」にしてください';
    if(/NotFoundError|Requested device not found/i.test(message))return '使用できるマイクが見つかりません';
    if(/AbortError|タイムアウト|timeout/i.test(message))return '接続がタイムアウトしました';
    if(/WebRTC.*disconnected|WebRTC.*failed/i.test(message))return '音声通信が切断されました';
    return message?message.slice(0,90):'接続を再試行します';
  }

  function setLocal(state,label,error=''){
    const core=document.querySelector('#aiOffice .ups-core,#aiOffice .aio-core');
    const talk=document.querySelector('#aiOffice .ups-talk,#aiOffice .aio-voice');
    if(core){
      core.classList.toggle('busy',state==='connecting'||state==='listening'||state==='speaking');
      const s=core.querySelector('small');
      if(s)s.textContent=label||'READY';
    }
    if(talk){
      if(state==='connecting')talk.innerHTML='<span>🎙</span><div>接続中…<small>少しお待ちください</small></div>';
      else if(state==='listening')talk.innerHTML='<span>🎙</span><div>聞いています<small>そのまま話してください</small></div>';
      else if(state==='speaking')talk.innerHTML='<span>🔊</span><div>アップズ君が応答中<small>途中で話しかけてもOK</small></div>';
      else if(state==='error'){
        talk.innerHTML='<span>↻</span><div>もう一度話しかける<small></small></div>';
        const detail=talk.querySelector('small');
        if(detail)detail.textContent=friendlyError(error);
      }
      else talk.innerHTML='<span>🎙</span><div>アップズ君に話しかける<small>はい、アップズ君</small></div>';
    }
  }

  async function start(ev){
    if(ev){ev.preventDefault();ev.stopPropagation();ev.stopImmediatePropagation?.()}
    if(starting)return;
    if(typeof window.upsLiveStart!=='function'){
      setLocal('error','VOICE UNAVAILABLE');
      return;
    }
    starting=true;
    setLocal('connecting','CONNECTING');
    try{
      const ok=await window.upsLiveStart();
      if(ok)setLocal('listening','LIVE / LISTENING');
      else setLocal('error','RETRY',typeof window.upsLiveLastError==='function'?window.upsLiveLastError():'');
    }catch(e){
      console.warn('UPs voice entry failed',e);
      setLocal('error','RETRY',e?.message||e);
    }finally{starting=false}
  }

  document.addEventListener('click',e=>{
    const t=e.target.closest?.('#aiOffice .ups-core,#aiOffice .ups-talk,#aiOffice .aio-core,#aiOffice .aio-voice');
    if(t)start(e);
  },true);

  document.addEventListener('keydown',e=>{
    const t=e.target.closest?.('#aiOffice .ups-core,#aiOffice .aio-core');
    if(t&&(e.key==='Enter'||e.key===' '))start(e);
  },true);

  window.addEventListener('ups-live-state',e=>{
    const st=e.detail?.state||'idle',label=e.detail?.label;
    if(st==='connecting')setLocal(st,label||'CONNECTING');
    else if(st==='listening')setLocal(st,label||'LIVE / LISTENING');
    else if(st==='speaking')setLocal(st,label||'SPEAKING');
    else if(st==='error')setLocal(st,'RETRY');
    else if(st==='idle')setLocal(st,label||'READY');
  });

  window.addEventListener('ups-live-unavailable',e=>{
    setLocal('error','RETRY',e.detail?.error||'');
  });

  window.upsVoiceEntryFix={version:VERSION,start};
})();
