/* JARVIS Operating System: persistent policy, auto department routing, approval gate, chat memory, continuous voice follow-up */
(function(){
  'use strict';

  const POLICY_KEY='jarvis-operating-policy-v1';
  const CHAT_KEY='jarvis-chat-memory-v1';
  const MAX_CHAT=120;

  const POLICY={
    version:'1.0',
    updatedAt:'2026-09-05',
    name:'JARVIS AI社長 運用ルール',
    principle:'自動で収集・整理・分析・提案し、重要な実行と最終確認・承認は管理者が行う。',
    ownerApprovalRequired:true,
    departments:{
      ceo:{label:'Jarvis社長',role:'全体統括・意思決定支援'},
      shift:{label:'シフト・配送管理部',role:'ドライバー稼働・シフト・配車・欠車・穴埋め調整'},
      sales:{label:'営業部',role:'新規案件・取引先開拓・営業文案・商談フォロー'},
      jobs:{label:'求人部',role:'求人媒体・原稿・応募者・掲載状況管理'},
      profit:{label:'収益部',role:'案件元・拠点・ドライバー別の売上・粗利・稼働率分析'}
    },
    operation:{
      automatic:[
        'データ取得・同期','集計','異常検知','欠車リスク検知','候補者抽出','リマインド','分析','下書き作成','改善案作成','承認待ち一覧作成'
      ],
      approvalRequired:[
        'シフト確定変更','配車確定','外部へのメール・メッセージ送信','求人掲載・再掲載','単価変更','請求・支払確定','契約・重要設定変更','データ削除'
      ],
      neverAutomatic:[
        '契約締結','金銭条件の最終決定','重大な人事判断','取り返しのつかない削除や公開'
      ]
    },
    responseRule:'結論 → 現状 → 次にやること。部署指定がなければ内容から自動判定し、複数部署案件はJarvis社長が統合する。'
  };

  try{localStorage.setItem(POLICY_KEY,JSON.stringify(POLICY));}catch(e){}
  window.JARVIS_OPERATING_POLICY=POLICY;

  const norm=v=>String(v||'').replace(/\s+/g,' ').trim();

  function route(text){
    const t=norm(text);
    const scores={shift:0,sales:0,jobs:0,profit:0};
    const add=(key,re,w=1)=>{if(re.test(t))scores[key]+=w;};
    add('shift',/シフト|配送|配車|稼働|欠車|休み|出勤|ドライバー|離脱|穴埋め|代走|三島|静岡|一宮|中村区|野洲|富士|駿河/,2);
    add('sales',/営業|新規案件|案件獲得|取引先|商談|営業メール|提案|開拓|見込み/,2);
    add('jobs',/求人|応募|応募者|採用|Indeed|求人ボックス|ジモティ|募集|面接/,2);
    add('profit',/売上|粗利|収益|利益|原価|稼働率|単価|赤字|黒字|請求|支払/,2);
    const ordered=Object.entries(scores).sort((a,b)=>b[1]-a[1]);
    if(!ordered[0][1]) return 'ceo';
    const top=ordered[0][1], tied=ordered.filter(x=>x[1]===top&&top>0);
    return tied.length>1?'ceo':ordered[0][0];
  }

  function approvalFor(text){
    const t=norm(text);
    if(/送信|掲載|再掲載|確定|変更|削除|契約|承認|支払|請求|単価|保存して|反映して/.test(t)){
      return {required:true,reason:'重要な実行操作のため管理者承認が必要'};
    }
    return {required:false,reason:'情報取得・分析・提案・下書きは自動運用可能'};
  }

  window.JARVIS_ROUTE_DEPARTMENT=route;
  window.JARVIS_APPROVAL_CHECK=approvalFor;

  function readHistory(){try{return JSON.parse(localStorage.getItem(CHAT_KEY)||'[]')}catch(e){return []}}
  function saveHistory(list){try{localStorage.setItem(CHAT_KEY,JSON.stringify(list.slice(-MAX_CHAT)))}catch(e){}}
  function remember(role,text,department){
    const t=norm(text); if(!t)return;
    const list=readHistory();
    const last=list[list.length-1];
    if(last&&last.role===role&&last.text===t)return;
    list.push({time:new Date().toISOString(),role,text:t,department:department||null});
    saveHistory(list);
  }
  window.JARVIS_CHAT_MEMORY={get:readHistory,clear:()=>saveHistory([]),remember};

  function ensureBadge(){
    const log=document.getElementById('aiChatLog');
    if(!log||document.getElementById('jarvisAutoRouteBadge'))return;
    const wrap=log.parentElement||log;
    const badge=document.createElement('div');
    badge.id='jarvisAutoRouteBadge';
    badge.style.cssText='display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin:0 0 8px;padding:8px 10px;border:1px solid rgba(76,220,255,.28);border-radius:10px;background:rgba(1,22,35,.72);color:#b9f5ff;font-size:11px;letter-spacing:.03em';
    badge.innerHTML='<b>JARVIS AUTO ROUTE</b><span id="jarvisDeptBadge">Jarvis社長</span><span style="opacity:.72">重要操作は承認制</span>';
    wrap.insertBefore(badge,log);
  }

  function setDepartment(text){
    const key=route(text), dept=POLICY.departments[key]||POLICY.departments.ceo;
    window.JARVIS_ACTIVE_DEPARTMENT=key;
    const badge=document.getElementById('jarvisDeptBadge'); if(badge)badge.textContent=dept.label;
    return key;
  }

  function captureUser(){
    const input=document.getElementById('aiChatText');
    const text=norm(input?.value); if(!text)return;
    const dept=setDepartment(text);
    remember('user',text,dept);
    const approval=approvalFor(text);
    window.JARVIS_PENDING_APPROVAL_CONTEXT=approval.required?{text,department:dept,...approval}:null;
  }

  let conversationMode=false;
  let followTimer=null;
  function enableConversation(){conversationMode=true;}
  function disableConversation(){conversationMode=false;if(followTimer){clearTimeout(followTimer);followTimer=null;}}
  window.JARVIS_CONVERSATION_MODE={enable:enableConversation,disable:disableConversation,get enabled(){return conversationMode;}};

  function wire(){
    ensureBadge();
    const send=document.getElementById('aiChatSend');
    if(send&&!send.dataset.jarvisOsBound){
      send.dataset.jarvisOsBound='1';
      send.addEventListener('click',captureUser,true);
    }
    const input=document.getElementById('aiChatText');
    if(input&&!input.dataset.jarvisOsBound){
      input.dataset.jarvisOsBound='1';
      input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey)captureUser();},true);
    }
    ['voiceBtn','aiVoiceBtn','aiVoiceInline'].forEach(id=>{
      const el=document.getElementById(id);
      if(el&&!el.dataset.jarvisConversationBound){el.dataset.jarvisConversationBound='1';el.addEventListener('click',enableConversation,{capture:true});}
    });
  }

  function observeChat(){
    const log=document.getElementById('aiChatLog');
    if(!log||log.dataset.jarvisOsObserved)return;
    log.dataset.jarvisOsObserved='1';
    new MutationObserver(()=>{
      const rows=[...log.querySelectorAll('.ai-row')];
      const last=rows[rows.length-1]; if(!last)return;
      const role=last.classList.contains('jarvis')?'jarvis':'user';
      const text=norm(last.querySelector('p')?.textContent||last.textContent);
      const dept=role==='user'?setDepartment(text):(window.JARVIS_ACTIVE_DEPARTMENT||'ceo');
      remember(role,text,dept);
      if(role==='jarvis'&&conversationMode&&window.JARVIS_VOICE_AI?.start){
        clearTimeout(followTimer);
        followTimer=setTimeout(()=>{try{window.JARVIS_VOICE_AI.start();}catch(e){}},900);
      }
    }).observe(log,{childList:true,subtree:true});
  }

  function boot(){wire();observeChat();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,900));else setTimeout(boot,900);
  new MutationObserver(()=>{wire();observeChat();}).observe(document.documentElement,{childList:true,subtree:true});
})();
