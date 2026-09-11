(()=>{
  const VERSION='V7.2.0';
  const KEY='ups_ai_spec_v1';
  const DEFAULTS={
    assistantName:'アップズ君',
    responseStyle:'short',
    customInstructions:'',
    autoMode:'safe'
  };
  function load(){try{return {...DEFAULTS,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch{return {...DEFAULTS}}}
  function save(v){localStorage.setItem(KEY,JSON.stringify(v));window.dispatchEvent(new CustomEvent('ups-spec-changed',{detail:v}));return v}
  function prompt(){
    const s=load();
    const style=s.responseStyle==='detailed'?'必要に応じて詳しく説明する':s.responseStyle==='balanced'?'簡潔さと詳しさをバランスする':'結論を先に短く自然に答える';
    const auto=s.autoMode==='proposal'?'内部作業も提案中心で、実行前に確認を優先する':'安全な内部処理・分析・下書きは自動で進め、外部送信・公開・金銭確定・契約・シフト最終確定・削除など重要操作だけ承認待ちにする';
    return `【JARVIS内ユーザー設定】\n呼称:${s.assistantName}\n応答:${style}\n運用:${auto}${s.customInstructions?`\n追加仕様:${s.customInstructions}`:''}\n※この設定は既存の安全・承認ルールを弱めない。`;
  }
  function css(){
    const st=document.createElement('style');st.textContent=`
#upsSpecBtn{position:fixed;right:18px;top:74px;z-index:99998;width:44px;height:44px;border-radius:14px;border:1px solid #2b7182;background:#061925;color:#bff8ff;font-size:20px;box-shadow:0 0 18px rgba(77,231,255,.18);cursor:pointer}
#upsSpecMask{position:fixed;inset:0;z-index:99999;background:rgba(0,6,12,.78);display:none;align-items:flex-end;justify-content:center;padding:14px;box-sizing:border-box}
#upsSpecPanel{width:min(680px,100%);max-height:86vh;overflow:auto;background:#071721;border:1px solid #2a7183;border-radius:24px;padding:18px;color:#e7fbff;box-shadow:0 0 40px rgba(50,220,255,.22);font-family:system-ui,sans-serif}
#upsSpecPanel h3{margin:0 0 6px;font-size:20px}#upsSpecPanel p{margin:0 0 14px;color:#8dc6d2;font-size:12px;line-height:1.6}
.upsSpecField{display:block;margin:12px 0}.upsSpecField span{display:block;font-size:12px;color:#9bdce8;margin-bottom:6px}.upsSpecField input,.upsSpecField select,.upsSpecField textarea{width:100%;box-sizing:border-box;background:#03101a;color:#e9fcff;border:1px solid #24596a;border-radius:12px;padding:11px;font-size:16px}.upsSpecField textarea{min-height:130px;resize:vertical}
.upsSpecActions{display:flex;gap:10px;position:sticky;bottom:0;background:#071721;padding-top:12px}.upsSpecActions button{flex:1;border-radius:12px;padding:12px;border:1px solid #2b7182;background:#0a2835;color:#dffbff;font-weight:800}.upsSpecActions .primary{background:#0d6174;border-color:#56e7ff}
#upsSpecSaved{font-size:12px;color:#77f3c1;min-height:18px;margin-top:8px}
@media(min-width:800px){#upsSpecMask{align-items:center}}
`;document.head.appendChild(st)
  }
  function mount(){
    if(document.getElementById('upsSpecBtn'))return;
    css();
    const btn=document.createElement('button');btn.id='upsSpecBtn';btn.type='button';btn.title='アップズ君 仕様設定';btn.textContent='⚙';document.body.appendChild(btn);
    const mask=document.createElement('div');mask.id='upsSpecMask';mask.innerHTML=`<div id="upsSpecPanel"><h3>UP'S AI 仕様設定 <small style="font-size:11px;color:#67d8ee">${VERSION}</small></h3><p>アップズ君の応答や運用方針をJARVIS内から変更できます。重要操作の承認ルールは維持されます。</p><label class="upsSpecField"><span>呼称</span><input id="upsSpecName" maxlength="40"></label><label class="upsSpecField"><span>回答スタイル</span><select id="upsSpecStyle"><option value="short">短く・結論優先</option><option value="balanced">バランス</option><option value="detailed">詳しく</option></select></label><label class="upsSpecField"><span>自動運用</span><select id="upsSpecAuto"><option value="safe">安全な内部作業は自動／重要操作のみ承認</option><option value="proposal">提案中心／実行前確認を多めに</option></select></label><label class="upsSpecField"><span>追加仕様</span><textarea id="upsSpecCustom" maxlength="3000" placeholder="例：売上・粗利は会社データを優先。欠車時は休みのドライバー候補から提案。回答は運転中でも聞き取りやすく。"></textarea></label><div id="upsSpecSaved"></div><div class="upsSpecActions"><button id="upsSpecClose">閉じる</button><button id="upsSpecReset">初期化</button><button class="primary" id="upsSpecSave">保存して反映</button></div></div>`;document.body.appendChild(mask);
    const $=id=>document.getElementById(id);
    function fill(){const s=load();$('upsSpecName').value=s.assistantName;$('upsSpecStyle').value=s.responseStyle;$('upsSpecAuto').value=s.autoMode;$('upsSpecCustom').value=s.customInstructions||'';$('upsSpecSaved').textContent=''}
    function open(){fill();mask.style.display='flex'}function close(){mask.style.display='none'}
    btn.onclick=open;$('upsSpecClose').onclick=close;mask.addEventListener('click',e=>{if(e.target===mask)close()});
    $('upsSpecSave').onclick=()=>{const s=save({assistantName:$('upsSpecName').value.trim()||DEFAULTS.assistantName,responseStyle:$('upsSpecStyle').value,autoMode:$('upsSpecAuto').value,customInstructions:$('upsSpecCustom').value.trim()});$('upsSpecSaved').textContent='保存しました。次の会話から反映します。';setTimeout(close,700);return s};
    $('upsSpecReset').onclick=()=>{save({...DEFAULTS});fill();$('upsSpecSaved').textContent='初期設定に戻しました。'};
    document.querySelectorAll('body *').forEach(el=>{if(el.childElementCount===0&&el.textContent.trim()==='V7.0.21')el.textContent=VERSION});
  }
  window.upsGetSpec=load;window.upsSpecPrompt=prompt;window.upsSaveSpec=save;
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,120),{once:true});else setTimeout(mount,120);
})();