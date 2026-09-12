(()=>{
  const VERSION='V7.3.2';
  const API='https://jarvis-api.t-ups2024.workers.dev';
  let finance=null,shift=null,delivery=null,lastRefresh=0;
  const SKILLS=[
    ['general','汎用AI','質問回答・要約・文章作成・アイデア・比較・計画・学習支援'],
    ['research','調査AI','最新情報や外部情報が必要かを判断し、利用可能な検索機能がある場合のみ調査する'],
    ['accounting','Aさん / AI経理部','売上・粗利・DR支払・請求・経理整合性'],
    ['delivery','Bさん / 配送管理部','シフト・稼働・欠車・代走候補・配送管理'],
    ['sales','Cさん / AI営業部','営業候補・企業分析・営業文案・商談フォロー'],
    ['recruiting','Dさん / AI採用部','求人原稿・応募分析・採用改善'],
    ['business','Eさん / AI事業部','note・SNS・AI商品・コンテンツ・収益化検証'],
    ['analysis','Fさん / AI分析部','拠点別利益・稼働率・傾向・異常値分析'],
    ['office','AI秘書','予定整理・タスク・連絡文面・優先順位整理'],
    ['tech','技術AI','コード・仕様整理・デバッグ・JARVIS改善案']
  ];
  const approvalRules={
    auto:'取得・読取・集計・分析・比較・検査・候補抽出・下書き・改善案・社内向け整理は自動で進める。途中確認は原則しない。',
    approval:'外部送信、公開投稿、求人掲載、契約、金銭の最終確定、単価変更、シフト/配車の最終確定、重要設定変更、データ削除は最後にまとめて承認待ちにする。',
    truth:'ツールや接続が無い操作を実行済みと表現しない。未確認データや数字を推測しない。'
  };
  const yen=v=>Number.isFinite(Number(v))?`¥${Math.round(Number(v)).toLocaleString('ja-JP')}`:'未確認';
  function pick(obj,keys){for(const k of keys){if(obj&&obj[k]!=null)return obj[k]}return null}
  function summarizeFinance(d){
    if(!d||typeof d!=='object')return '財務スナップショット:未取得';
    return `財務スナップショット: 今月売上 ${yen(pick(d,['monthRevenue','revenue','monthlyRevenue']))} / 確認済み粗利 ${yen(pick(d,['confirmedGrossProfit','grossProfit','monthGrossProfit']))} / DR支払 ${yen(pick(d,['monthDriverCost','driverCost','drPay']))} / 今日売上 ${yen(pick(d,['todayRevenue','today']))}`;
  }
  function compact(label,d){
    if(!d)return `${label}:未取得`;
    try{const s=JSON.stringify(d);return `${label}:${s.length>6500?s.slice(0,6500)+'…':s}`}catch{return `${label}:取得済み（整形不可）`}
  }
  async function getJson(url,ms=4500){
    const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);
    try{const r=await fetch(url,{cache:'no-store',signal:c.signal});if(!r.ok)return null;return await r.json()}catch{return null}finally{clearTimeout(t)}
  }
  async function refresh(force=false){
    if(!force&&Date.now()-lastRefresh<60000)return {finance,shift,delivery};
    lastRefresh=Date.now();
    const [f,s,d]=await Promise.all([
      getJson(`./finance-status.json?t=${Date.now()}`),
      getJson(`${API}/shift?t=${Date.now()}`),
      getJson(`${API}/delivery?t=${Date.now()}`)
    ]);
    if(f)finance=f;if(s)shift=s;if(d)delivery=d;
    const detail={version:VERSION,finance,shift,delivery};
    window.dispatchEvent(new CustomEvent('ups-skills-context',{detail}));
    return detail;
  }
  function prompt(){
    const skillText=SKILLS.map((x,i)=>`${i+1}. ${x[1]}: ${x[2]}`).join('\n');
    return `【UP'S AI SKILLS ${VERSION}】\nあなたはChatGPTのように幅広い相談へ対応できる汎用AIであり、同時にUP'sのAI司令塔「アップズ君」。ユーザーに部署選択を要求せず、発話内容から必要なスキルを自動選択し、複数分野なら統合して答える。\n\n【利用スキル】\n${skillText}\n\n【自動運用】\n${approvalRules.auto}\n${approvalRules.approval}\n${approvalRules.truth}\n\n【会社データ優先】\n${summarizeFinance(finance)}\n${compact('シフトAPI',shift)}\n${compact('配送API',delivery)}\n会社データがある質問では一般知識より上記JARVIS内データを優先する。API未取得・空欄・不明値は推測せず「未確認」とする。未来シフトを実績として扱わない。単価・サーチャージは確認済み情報のみ使う。\n\n【会話】\n普通の質問、相談、文章作成、企画、学習、技術相談にも自然に回答する。音声では簡潔に、文字では必要に応じて詳しくする。最新情報が必要な質問は検索機能を実際に利用できる場合だけ最新情報として回答し、利用できない場合は最新確認が必要だと明示する。`;
  }
  function approvalNeeded(text){
    const t=String(text||'');
    const direct=/(送信して|送って$|投稿して|公開して|掲載して|削除して|契約して|確定して|振り込んで|支払って|単価.*変更して|配車.*確定|シフト.*確定)/;
    const draft=/(文案|下書き|作って|考えて|分析|調べて|比較|候補|整理|改善)/;
    return direct.test(t)&&!draft.test(t);
  }
  const basePrompt=typeof window.upsSpecPrompt==='function'?window.upsSpecPrompt:null;
  window.upsSkillsPrompt=prompt;
  window.upsSpecPrompt=()=>`${basePrompt?basePrompt():''}${basePrompt?'\n\n':''}${prompt()}`;
  window.upsSkillsRefresh=refresh;
  window.upsSkillsApprovalNeeded=approvalNeeded;
  window.upsSkills={version:VERSION,list:SKILLS.map(x=>({id:x[0],name:x[1],description:x[2]})),context:()=>({finance,shift,delivery})};
  refresh(true);setInterval(()=>refresh(false),60000);
})();