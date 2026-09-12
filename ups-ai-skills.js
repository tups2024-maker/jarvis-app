(()=>{
  const VERSION='V7.3.13-data2';
  const API='https://jarvis-api.t-ups2024.workers.dev';
  let finance=null,shift=null,delivery=null,lastRefresh=0,refreshPromise=null;
  const SKILLS=[
    ['general','汎用AI','質問回答・要約・文章作成・アイデア・比較・計画・学習支援'],
    ['research','調査AI','最新情報や外部情報が必要かを判断し、利用可能な検索機能がある場合のみ調査する'],
    ['accounting','Aさん / AI経理部','売上・粗利・DR支払・請求・経理整合性'],
    ['delivery','Bさん / 配送管理部','シフト・稼働・欠車・代走候補・配送管理'],
    ['sales','Cさん / AI営業部','営業候補・企業分析・営業文案・商談フォロー'],
    ['analysis','Fさん / AI分析部','拠点別利益・稼働率・傾向・異常値分析'],
    ['office','AI秘書','予定整理・タスク・連絡文面・優先順位整理'],
    ['tech','技術AI','コード・仕様整理・デバッグ・JARVIS改善案']
  ];
  const approvalRules={
    auto:'取得・読取・集計・分析・比較・検査・候補抽出・下書き・改善案・社内向け整理は自動で進める。途中確認は原則しない。',
    approval:'外部送信、公開投稿、契約、金銭の最終確定、単価変更、シフト/配車の最終確定、重要設定変更、データ削除は最後にまとめて承認待ちにする。',
    truth:'ツールや接続が無い操作を実行済みと表現しない。未確認データや数字を推測しない。'
  };
  const yen=v=>Number.isFinite(Number(v))?`¥${Math.round(Number(v)).toLocaleString('ja-JP')}`:'未確認';
  function pick(obj,keys){for(const k of keys){if(obj&&obj[k]!=null)return obj[k]}return null}
  function summarizeFinance(d){if(!d||typeof d!=='object')return '財務スナップショット:未取得';return `財務スナップショット: 今月売上 ${yen(pick(d,['monthRevenue','revenue','monthlyRevenue']))} / 確認済み粗利 ${yen(pick(d,['confirmedGrossProfit','grossProfit','monthGrossProfit']))} / DR支払 ${yen(pick(d,['monthDriverCost','driverCost','drPay']))} / 今日売上 ${yen(pick(d,['todayRevenue','today']))}`}
  const jpDate=(offset=0)=>{const d=new Date(Date.now()+offset*86400000),parts=new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Tokyo',year:'numeric',month:'2-digit',day:'2-digit',weekday:'short'}).formatToParts(d),get=t=>parts.find(x=>x.type===t)?.value||'';return {key:`${get('year')}-${get('month')}-${get('day')}`,label:`${get('year')}年${Number(get('month'))}月${Number(get('day'))}日(${get('weekday')})`}};
  function summarizeShift(payload){
    const data=payload?.data||payload,values=data?.values;
    if(!Array.isArray(values)||!Array.isArray(values[0]))return 'シフトAPI:未取得';
    const match=String(data.sheetName||values[0]?.[2]||'').match(/(20\d{2})\D+(\d{1,2})月?/),baseYear=Number(match?.[1]),baseMonth=Number(match?.[2]);
    if(!baseYear||!baseMonth)return `シフトAPI:${data.sheetName||'取得済み'}（日付解析不可）`;
    const cols=[];for(let i=3;i<values[0].length;i++){const day=Number(values[0][i]);if(Number.isInteger(day)&&day>=1&&day<=31)cols.push({i,day})}
    const segments=[];for(const item of cols){const last=segments[segments.length-1];if(!last||item.day<=last[last.length-1].day)segments.push([item]);else last.push(item)}
    let baseSegment=0;segments.forEach((s,i)=>{if(s.length>segments[baseSegment].length)baseSegment=i});
    const dateColumns=new Map();segments.forEach((segment,si)=>{let y=baseYear,m=baseMonth+(si-baseSegment);while(m<1){m+=12;y--}while(m>12){m-=12;y++}segment.forEach(({i,day})=>dateColumns.set(`${y}-${String(m).padStart(2,'0')}-${String(day).padStart(2,'0')}`,i))});
    const lines=[`シフトAPI:取得済み / 対象表 ${data.sheetName||'名称不明'}`];
    for(let offset=-1;offset<=7;offset++){
      const date=jpDate(offset),col=dateColumns.get(date.key);if(col==null)continue;
      const people=[];for(let r=5;r<values.length;r++){const name=String(values[r]?.[2]||'').trim(),mark=String(values[r]?.[col]??'').trim();if(name&&mark)people.push(`${name}:${mark}`)}
      const diff=values[2]?.[col],requested=values[3]?.[col],active=values[4]?.[col];
      lines.push(`${date.label} 依頼${requested||'未確認'}台/稼働${active||'未確認'}台/差異${diff===''||diff==null?'未確認':diff}; ${people.length?people.join('、'):'個人シフト記載なし'}`);
    }
    lines.push('記号や空欄は原表どおり。空欄を休みと推測しない。');return lines.join('\n');
  }
  function summarizeDelivery(payload){
    const data=payload?.data||payload,sheets=data?.sheets;if(!Array.isArray(sheets))return '配送API:未取得';
    const lines=[`配送API:取得済み / データ月 ${data.month||'不明'} / 全${sheets.length}シート`];
    for(const sheet of sheets){
      const values=Array.isArray(sheet?.values)?sheet.values:[],drivers=new Map(),tasks=new Map();let records=0,actual=0,drPay=0,minDate='',maxDate='';
      for(let r=3;r<values.length;r++){
        const row=values[r]||[],date=String(row[0]||'').trim(),driver=String(row[1]||'').trim(),task=String(row[2]||'').trim();if(!date||!driver||!task)continue;
        records++;const n=Number(row[13]);actual+=Number.isFinite(n)?n:1;const pay=Number(row[9]);if(Number.isFinite(pay))drPay+=pay;
        drivers.set(driver,(drivers.get(driver)||0)+(Number.isFinite(n)?n:1));tasks.set(task,(tasks.get(task)||0)+(Number.isFinite(n)?n:1));
        const shown=/^\d{4}-/.test(date)?new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric',day:'numeric'}).format(new Date(date)):date;if(!minDate)minDate=shown;maxDate=shown;
      }
      const top=map=>[...map.entries()].sort((a,b)=>b[1]-a[1]).slice(0,12).map(([k,v])=>`${k}:${v}`).join('、');
      lines.push(`[${sheet.sheetName||'名称不明'}] 期間${minDate||'不明'}〜${maxDate||'不明'} / 明細${records}件 / 実績${actual} / DR金額合計${yen(drPay)} / 業務別 ${top(tasks)||'なし'} / DR別 ${top(drivers)||'なし'}`);
    }
    lines.push('配送APIのDR金額は売上ではない。売上質問は財務スナップショットを優先し、データ月が現在月と違う場合はその旨を明示する。');return lines.join('\n');
  }
  async function getJson(url,ms=4500){const c=new AbortController(),t=setTimeout(()=>c.abort(),ms);try{const r=await fetch(url,{cache:'no-store',signal:c.signal});if(!r.ok)return null;return await r.json()}catch{return null}finally{clearTimeout(t)}}
  async function refresh(force=false){
    if(refreshPromise)return refreshPromise;if(!force&&Date.now()-lastRefresh<60000)return {finance,shift,delivery};lastRefresh=Date.now();
    refreshPromise=(async()=>{const stamp=Date.now(),[f,s,d]=await Promise.all([getJson(`./finance-status.json?t=${stamp}`,5000),getJson(`${API}/shift?t=${stamp}`,60000),getJson(`${API}/delivery?t=${stamp}`,120000)]);if(f)finance=f;if(s)shift=s;if(d)delivery=d;const detail={version:VERSION,finance,shift,delivery};window.dispatchEvent(new CustomEvent('ups-skills-context',{detail}));return detail})();
    try{return await refreshPromise}finally{refreshPromise=null}
  }
  function prompt(){const skillText=SKILLS.map((x,i)=>`${i+1}. ${x[1]}: ${x[2]}`).join('\n');return `【UP'S AI SKILLS ${VERSION}】\nあなたはChatGPTのように幅広い相談へ対応できる汎用AIであり、同時にUP'sのAI司令塔「アップズ君」。ユーザーに部署選択を要求せず、発話内容から必要なスキルを自動選択し、複数分野なら統合して答える。採用事業・AI事業は現在停止中として扱い、事業メニューや専門部署として提案しない。\n\n【利用スキル】\n${skillText}\n\n【自動運用】\n${approvalRules.auto}\n${approvalRules.approval}\n${approvalRules.truth}\n\n【会社データ優先】\n${summarizeFinance(finance)}\n${summarizeShift(shift)}\n${summarizeDelivery(delivery)}\n会社データがある質問では一般知識より上記JARVIS内データを優先する。API未取得・空欄・不明値は推測せず「未確認」とする。未来シフトを実績として扱わない。単価・サーチャージは確認済み情報のみ使う。\n\n【会話】\n普通の質問、相談、文章作成、企画、学習、技術相談にも自然に回答する。音声では簡潔に、文字では必要に応じて詳しくする。最新情報が必要な質問は検索機能を実際に利用できる場合だけ最新情報として回答し、利用できない場合は最新確認が必要だと明示する。`}
  function approvalNeeded(text){const t=String(text||'');const direct=/(送信して|送って$|投稿して|公開して|削除して|契約して|確定して|振り込んで|支払って|単価.*変更して|配車.*確定|シフト.*確定)/;const draft=/(文案|下書き|作って|考えて|分析|調べて|比較|候補|整理|改善)/;return direct.test(t)&&!draft.test(t)}
  const basePrompt=typeof window.upsSpecPrompt==='function'?window.upsSpecPrompt:null;
  window.upsSkillsPrompt=prompt;window.upsSpecPrompt=()=>`${basePrompt?basePrompt():''}${basePrompt?'\n\n':''}${prompt()}`;window.upsSkillsRefresh=refresh;window.upsSkillsApprovalNeeded=approvalNeeded;window.upsSkills={version:VERSION,list:SKILLS.map(x=>({id:x[0],name:x[1],description:x[2]})),context:()=>({finance,shift,delivery})};refresh(true);setInterval(()=>refresh(false),60000);
})();
