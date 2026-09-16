(()=>{
  const VERSION='V7.3.16-screen-number-lock';
  const KEY='ups_internal_finance_override_v1';
  const originalFetch=window.fetch.bind(window);
  const SHIFT_API='https://jarvis-api.t-ups2024.workers.dev';
  const SHIFT_PENDING_KEY='ups_pending_shift_change_v1';
  const money=n=>Number.isFinite(Number(n))?'¥'+Number(n).toLocaleString('ja-JP'):'—';
  const num=v=>Number.isFinite(Number(v))?Number(v):0;
  const isFinanceUrl=input=>{try{const u=typeof input==='string'?input:(input?.url||'');return /(?:^|\/)finance-status\.json(?:\?|$)/.test(u)}catch{return false}};
  function sumSites(data){const rows=Array.isArray(data?.siteBreakdown)?data.siteBreakdown:[];return{
    monthRevenue:rows.reduce((s,x)=>s+num(x?.revenue),0),
    monthDriverCost:rows.reduce((s,x)=>s+num(x?.driverCost),0),
    confirmedGrossProfit:rows.reduce((s,x)=>s+num(x?.grossProfit),0)
  }}
  function reconcile(data){if(!data||!Array.isArray(data.siteBreakdown))return{data,changed:false,diff:{}};const totals=sumSites(data);const diff={};for(const k of Object.keys(totals)){const before=num(data[k]),after=totals[k];if(before!==after)diff[k]={before,after,delta:after-before}}
    const out={...data,...totals,internalReconciledAt:new Date().toISOString(),internalReconcileVersion:VERSION};
    if(Number.isFinite(Number(out.confirmedRevenueForMargin))&&Number(out.confirmedRevenueForMargin)>0){out.confirmedGrossMargin=out.confirmedGrossProfit/Number(out.confirmedRevenueForMargin)}
    return{data:out,changed:Object.keys(diff).length>0,diff};
  }
  function save(result){try{localStorage.setItem(KEY,JSON.stringify({savedAt:Date.now(),sourceUpdatedAt:result.data?.updatedAt||'',actualsCutoff:result.data?.actualsCutoff||result.data?.latestActualDate||'',data:result.data,diff:result.diff}))}catch(e){}
  }
  async function fetchFinance(){const r=await originalFetch('./finance-status.json?internal='+Date.now(),{cache:'no-store'});if(!r.ok)throw new Error('finance-status '+r.status);return await r.json()}
  function applyDom(data){const pairs=[['今月売上','monthRevenue'],['確認済み粗利','confirmedGrossProfit'],['DR支払','monthDriverCost']];document.querySelectorAll('.ups-kpi,.aio-kpi').forEach(card=>{const label=card.querySelector('span')?.textContent||'';for(const [name,key] of pairs){if(label.includes(name)){const b=card.querySelector('b');if(b)b.textContent=money(data[key])}}});}
  async function repairFinance(){const src=await fetchFinance(),result=reconcile(src);save(result);applyDom(result.data);window.dispatchEvent(new CustomEvent('ups-finance-reconciled',{detail:result}));return result}
  function criticalIntent(m){return /(単価|サーチャージ|元シート|配送管理表|原本|削除|外部送信|公開|契約|振込|支払).*(変更|修正|更新|確定|実行)|(?:変更|修正|更新|確定|実行).*(単価|サーチャージ|元シート|配送管理表|原本|削除|外部送信|公開|契約|振込|支払)/.test(m)}
  const clean=v=>String(v||'').replace(/[\s　]/g,'').replace(/さん|氏/g,'').trim();
  const colLetter=n=>{let s='';while(n>0){n--;s=String.fromCharCode(65+n%26)+s;n=Math.floor(n/26)}return s};
  const normCell=v=>String(v??'').replace(/\u3000/g,' ').replace(/\s+/g,' ').trim();
  function detectShiftShape(values){
    let best={headerRow:-1,start:-1,len:0};
    for(let r=0;r<Math.min(values.length,10);r++){
      const row=values[r]||[];
      for(let c=0;c<row.length;c++){
        if(Number(row[c])!==1)continue;
        let len=1;
        while(c+len<row.length&&Number(row[c+len])===len+1)len++;
        if(len>best.len)best={headerRow:r,start:c,len};
      }
    }
    let nameCol=-1;
    for(let r=0;r<Math.min(values.length,10)&&nameCol<0;r++){
      const row=values[r]||[];
      for(let c=0;c<Math.min(row.length,10);c++){
        const h=clean(row[c]);
        if(['名前','DR','ドライバー','DR名'].map(clean).includes(h)){nameCol=c;break}
      }
    }
    if(nameCol<0)nameCol=2;
    return {...best,nameCol};
  }
  function companyForArea(area){
    if(['mishima','shizuoka','ichinomiya','tsurumi','nakamura'].includes(area))return'GION';
    if(['enshu-yasu','enshu-fuji','enshu-suruga'].includes(area))return'遠州トラック';
    if(area==='nagoya-r')return'ロケットナウ';
    if(area==='sakae')return'株式会社サカエ';
    if(area==='akiyama')return'秋山製麺';
    return'要確認';
  }
  function screenArea(m){
    if(/名古屋R|ロケット|Rocket/i.test(m))return'nagoya-r';
    if(/お酒|サカエ/.test(m))return'sakae';
    if(/秋山|製麺|(?:^|[^A-Za-z])AM(?:[^A-Za-z]|$)/i.test(m))return'akiyama';
    if(/遠州.*(?:野洲|滋賀)|(?:野洲|滋賀).*遠州/.test(m))return'enshu-yasu';
    if(/遠州.*(?:駿河|静岡)|(?:駿河|静岡).*遠州/.test(m))return'enshu-suruga';
    if(/遠州.*富士|富士.*遠州/.test(m))return'enshu-fuji';
    if(/鶴見/.test(m))return'tsurumi';
    if(/一宮/.test(m))return'ichinomiya';
    if(/中村/.test(m))return'nakamura';
    if(/名古屋/.test(m))return'nagoya-r';
    if(/静岡|駿河/.test(m))return'shizuoka';
    if(/富士/.test(m))return'enshu-fuji';
    if(/野洲|滋賀/.test(m))return'enshu-yasu';
    if(/三島/.test(m))return'mishima';
    return'all';
  }
  function shiftValue(m){
    if(/欠車|×/.test(m))return'×';
    if(/休み|休(?:みに|へ|に)?変更/.test(m))return'休';
    if(/研修/.test(m))return'研';
    if(/秋山|製麺|(?:^|[^A-Za-z])AM(?:[^A-Za-z]|$)/i.test(m))return'AM';
    if(/お酒|サカエ/.test(m))return'お酒';
    if(/(?:三島)?5h|(?:^|[^A-Za-z])MX(?:[^A-Za-z]|$)/i.test(m))return'MX';
    if(/(?:三島)?6h|(?:^|[^A-Za-z])CX(?:[^A-Za-z]|$)/i.test(m))return'CX';
    if(/一宮/.test(m))return'一宮';
    if(/中村/.test(m))return'中村';
    if(/名古屋R|ロケット|名古屋|(?:^|[^A-Za-z])R(?:[^A-Za-z]|$)/i.test(m))return'名古屋';
    if(/遠州.*富士|富士.*遠州/.test(m))return'富士';
    if(/遠州.*(?:野洲|滋賀)|(?:野洲|滋賀).*遠州/.test(m))return'野洲';
    if(/遠州.*(?:駿河|静岡)|(?:駿河|静岡).*遠州/.test(m))return'駿河';
    if(/静岡|駿河/.test(m))return'静岡';
    if(/三島|Amazon|アマゾン|出勤|通常/.test(m))return'〇';
    return'';
  }
  function showPage(id){const b=document.querySelector(`[data-go="${id}"],[data-page="${id}"]`);if(b)b.click();else if(typeof window.show==='function')window.show(id)}
  async function screenAction(m){
    if(/(?:シフト|勤務).*(見せ|表示|開い|確認)|(?:見せ|表示|開い|確認).*(?:シフト|勤務)/.test(m)&&!/(変更|修正|追加|登録|反映)/.test(m)){
      const area=screenArea(m);if(window.UPS_SHIFT_SITES)window.UPS_SHIFT_SITES.show(area);else showPage(document.querySelector('#shift')?'shift':'ops');
      return{handled:true,approvalRequired:false,reply:`${area==='all'?'全拠点':({'mishima':'三島市','shizuoka':'静岡','tsurumi':'鶴見区','ichinomiya':'一宮','nakamura':'中村区','enshu-yasu':'滋賀','enshu-suruga':'駿河区遠州','enshu-fuji':'富士','nagoya-r':'名古屋R','sakae':'お酒','akiyama':'AM'}[area])}の最新シフト画面を表示しました。拠点ごとのGoogle正本を直接表示しています。`};
    }
    if(/配送管理(?:表|ページ)?.*(見せ|表示|開い|確認)|(?:見せ|表示|開い|確認).*配送管理/.test(m)){
      showPage(document.querySelector('#delivery')?'delivery':'ops');if(typeof window.upsSkillsRefresh==='function')await window.upsSkillsRefresh(true).catch(()=>null);
      return{handled:true,approvalRequired:false,reply:'配送管理画面へ切り替え、Google正本の最新データを再取得しました。'};
    }
    return null;
  }
  async function prepareShiftChange(m){
    if(!/(シフト|出勤|休み|欠車|研修|三島|一宮|静岡|駿河|富士|野洲|滋賀|中村|名古屋|ロケット|Amazon|アマゾン|お酒|サカエ|製麺|秋山)/.test(m)||!/(変更|修正|追加|登録|反映|にして|休み|欠車|出勤)/.test(m))return null;
    const dm=m.match(/(?:(\d{1,2})月)?(\d{1,2})日/),value=shiftValue(m);
    if(!dm||!value)return null;
    const area=screenArea(m),company=companyForArea(area);
    const res=await originalFetch(`${SHIFT_API}/shift?t=${Date.now()}`,{cache:'no-store'}),json=await res.json();
    if(!res.ok||!json.success||!json.data?.values)throw new Error('シフト正本を取得できません');
    const data=json.data,values=data.values||[],shape=detectShiftShape(values);
    if(shape.start<0||shape.len<1)return{handled:true,approvalRequired:false,reply:'シフト正本の日付列を安全に特定できなかったため、変更を停止しました。'};
    const sheetMonth=String(data.sheetName||'').match(/(20\d{2})年(\d{1,2})月/);
    const tokyoMonth=Number(new Intl.DateTimeFormat('ja-JP',{timeZone:'Asia/Tokyo',month:'numeric'}).format(new Date()));
    const requestedMonth=dm[1]?Number(dm[1]):Number(sheetMonth?.[2]||tokyoMonth);
    if(sheetMonth&&requestedMonth!==Number(sheetMonth[2]))return{handled:true,approvalRequired:false,reply:`現在接続中の正本は${Number(sheetMonth[2])}月です。${requestedMonth}月の正本へは自動変更せず、対象月を確認してください。`};
    const msg=clean(m);
    const candidates=values.map((row,i)=>({name:normCell(row?.[shape.nameCol]),row:i}))
      .filter(x=>x.name)
      .filter(x=>{const full=clean(x.name),surname=clean(x.name.split(/[ 　]/)[0]);return msg.includes(full)||msg.includes(surname)});
    const unique=[...new Map(candidates.map(x=>[clean(x.name),x])).values()];
    if(unique.length!==1)return{handled:true,approvalRequired:false,reply:unique.length?'同じ名字の方がいるため、フルネームで指定してください。':'対象のドライバー名をシフト正本から確認できませんでした。フルネームで指定してください。'};
    const day=Number(dm[2]);
    if(day<1||day>shape.len)return{handled:true,approvalRequired:false,reply:'指定日の列をシフト正本で確認できませんでした。'};
    const target=unique[0],column=shape.start+day-1,range=`${colLetter(column+1)}${target.row+1}`,oldValue=normCell(values?.[target.row]?.[column]);
    const pending={range,value,oldValue,name:target.name,month:requestedMonth,day,area,company,rowIndex:target.row,columnIndex:column,nameCol:shape.nameCol,sheetName:String(data.sheetName||''),createdAt:Date.now()};
    sessionStorage.setItem(SHIFT_PENDING_KEY,JSON.stringify(pending));
    const areaLabel=({'mishima':'三島市','shizuoka':'静岡','ichinomiya':'一宮','tsurumi':'鶴見区','nakamura':'中村区','enshu-yasu':'滋賀','enshu-suruga':'駿河区遠州','enshu-fuji':'富士','nagoya-r':'名古屋R','sakae':'お酒','akiyama':'AM'}[area]||'拠点未指定');
    return{handled:true,approvalRequired:true,reply:`変更内容を確認します。【${company} / ${areaLabel}】${requestedMonth}月${day}日、${target.name}さんのシフトを「${oldValue||'未入力'}」から「${value}」へ変更します。よろしければ「この内容で確定」、やめる場合は「キャンセル」と話してください。`};
  }
  async function confirmShift(m){
    let p=null;try{p=JSON.parse(sessionStorage.getItem(SHIFT_PENDING_KEY)||'null')}catch{}
    if(/キャンセル|取り消し|やめ/.test(m)&&p){sessionStorage.removeItem(SHIFT_PENDING_KEY);return{handled:true,approvalRequired:false,reply:'シフト変更をキャンセルしました。正本は変更していません。'}}
    if(!/(この内容で確定|変更を確定|確定して|はい確定)/.test(m)||!p)return null;
    if(Date.now()-Number(p.createdAt||0)>10*60*1000){sessionStorage.removeItem(SHIFT_PENDING_KEY);return{handled:true,approvalRequired:false,reply:'確認の有効時間が過ぎました。変更内容をもう一度伝えてください。'}}
    const beforeRes=await originalFetch(`${SHIFT_API}/shift?t=${Date.now()}`,{cache:'no-store'}),beforeJson=await beforeRes.json();
    if(!beforeRes.ok||!beforeJson.success||!beforeJson.data?.values)throw new Error('確定前の正本再確認に失敗しました');
    const beforeValues=beforeJson.data.values||[];
    let rowIndex=Number(p.rowIndex),columnIndex=Number(p.columnIndex),nameCol=Number(p.nameCol);
    if(clean(beforeValues?.[rowIndex]?.[nameCol])!==clean(p.name)){
      const found=beforeValues.map((row,i)=>({name:normCell(row?.[nameCol]),row:i})).filter(x=>clean(x.name)===clean(p.name));
      if(found.length!==1){sessionStorage.removeItem(SHIFT_PENDING_KEY);return{handled:true,approvalRequired:false,reply:'確定前にドライバー位置が変わったため、安全のため変更を停止しました。内容をもう一度指定してください。'}}
      rowIndex=found[0].row;
    }
    const currentValue=normCell(beforeValues?.[rowIndex]?.[columnIndex]);
    if(currentValue!==normCell(p.oldValue)){
      sessionStorage.removeItem(SHIFT_PENDING_KEY);
      return{handled:true,approvalRequired:false,reply:`確認待ちの間に正本が「${p.oldValue||'未入力'}」から「${currentValue||'未入力'}」へ変わったため、上書きせず停止しました。最新状態で変更内容をもう一度指定してください。`};
    }
    const range=`${colLetter(columnIndex+1)}${rowIndex+1}`;
    const res=await originalFetch(`${SHIFT_API}/shift/save`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({range,values:[[p.value]]})}),json=await res.json();
    if(!res.ok||json.success===false)throw new Error(json.error||'保存失敗');
    const verifyRes=await originalFetch(`${SHIFT_API}/shift?t=${Date.now()}`,{cache:'no-store'}),verifyJson=await verifyRes.json();
    if(!verifyRes.ok||!verifyJson.success||!verifyJson.data?.values)throw new Error('保存後の読み戻し確認に失敗しました');
    const saved=normCell(verifyJson.data.values?.[rowIndex]?.[columnIndex]);
    if(saved!==normCell(p.value))throw new Error(`保存後の値が一致しません（期待:${p.value} / 実際:${saved||'未入力'}）`);
    sessionStorage.removeItem(SHIFT_PENDING_KEY);
    if(window.UPS_SHIFT_SITES){await window.UPS_SHIFT_SITES.load();window.UPS_SHIFT_SITES.show(p.area||'all')}
    if(typeof window.upsSkillsRefresh==='function')await window.upsSkillsRefresh(true).catch(()=>null);
    return{handled:true,approvalRequired:false,reply:`${p.company||'正本'} / ${p.month}月${p.day}日、${p.name}さんのシフトを「${p.value}」へ保存し、正本の読み戻し確認まで完了しました。配送管理はこの確定シフトを基準に再同期します。`};
  }
  function financeReadIntent(m){return /(今月(?:の)?売上|今日(?:の)?売上|売上|確認済み粗利|粗利|DR支払|ドライバー支払|画面(?:の)?数字|金額).*(いくら|教えて|読んで|読み上げ|確認|どうなって|合って)|(?:いくら|教えて|読んで|読み上げ|確認|どうなって|合って).*(今月(?:の)?売上|今日(?:の)?売上|売上|確認済み粗利|粗利|DR支払|ドライバー支払|画面(?:の)?数字|金額)/.test(m)&&!/(変更|修正|更新|確定|実行)/.test(m)}
  function financeIntent(m){return /(売上|粗利|利益|DR支払|経理|差異|数字).*(修正|直|再計算|整合|合わせ|確認)|(?:修正|直|再計算|整合|合わせ|確認).*(売上|粗利|利益|DR支払|経理|差異|数字)|内部修正/.test(m)}
  async function readFinance(m){const r=await repairFinance(),d=r.data||{},cutoff=String(d.actualsCutoff||d.latestActualDate||'確認済み日').replace(/^(20\d{2})-(\d{2})-(\d{2})$/,'$1年$2月$3日');const all=/(画面|全部|数字|金額)/.test(m),today=/今日(?:の)?売上/.test(m),lines=[];if(all||(!today&&/(今月(?:の)?売上|売上)/.test(m)))lines.push(`今月売上は、${money(d.monthRevenue)}です。`);if(all||today)lines.push(`${cutoff}の最新実績売上は、${money(d.todayRevenue)}です。`);if(all||/(確認済み粗利|粗利)/.test(m))lines.push(`確認済み粗利は、${money(d.confirmedGrossProfit)}です。`);if(all||/(DR支払|ドライバー支払)/.test(m))lines.push(`DR支払は、${money(d.monthDriverCost)}です。`);if(!lines.length)lines.push(`今月売上は、${money(d.monthRevenue)}です。`,`確認済み粗利は、${money(d.confirmedGrossProfit)}です。`,`DR支払は、${money(d.monthDriverCost)}です。`,`${cutoff}の最新実績売上は、${money(d.todayRevenue)}です。`);return{handled:true,approvalRequired:false,reply:`${cutoff}までの画面確定値を、そのまま読み上げます。\n${lines.join('\n')}`,result:r,source:'finance-status-screen-lock'}}
  function diffLine(name,d){return d?`${name}: ${money(d.before)} → ${money(d.after)}（差 ${d.delta>=0?'+':''}${money(d.delta).replace('¥','¥')}）`:''}
  async function run(message){const m=String(message||'').trim();if(!m)return null;
    try{const confirmed=await confirmShift(m);if(confirmed)return confirmed;const screen=await screenAction(m);if(screen)return screen;const shift=await prepareShiftChange(m);if(shift)return shift}catch(e){return{handled:true,approvalRequired:false,reply:'シフト操作を完了できませんでした。元のシフト正本は安全のため変更していません。もう一度、日付・フルネーム・勤務内容を伝えてください。',error:String(e)}}
    if(criticalIntent(m))return{handled:true,approvalRequired:true,reply:'この操作は重要変更にあたるため自動実行しません。元シート変更・単価変更・外部送信などは最終承認後に実行する設定です。'};
    if(financeReadIntent(m)){try{return await readFinance(m)}catch(e){return{handled:true,approvalRequired:false,reply:'画面の確定値を取得できなかったため、金額は読み上げませんでした。再読み込みしてからもう一度お試しください。',error:String(e)}}}
    if(!financeIntent(m))return null;
    try{const r=await repairFinance();const lines=[];if(r.diff.monthRevenue)lines.push(diffLine('今月売上',r.diff.monthRevenue));if(r.diff.monthDriverCost)lines.push(diffLine('DR支払',r.diff.monthDriverCost));if(r.diff.confirmedGrossProfit)lines.push(diffLine('確認済み粗利',r.diff.confirmedGrossProfit));
      const reply=r.changed?`内部の売上・粗利整合チェックを実行し、JARVIS表示を自動補正しました。\n${lines.join('\n')}\n元のGoogle Sheetsは変更していません。未確認金額は推測していません。`:`内部の売上・DR支払・確認済み粗利を再集計しました。現在のJARVIS表示と拠点別合計に差異はありません。元のGoogle Sheetsは変更していません。`;
      return{handled:true,approvalRequired:false,reply,result:r};
    }catch(e){return{handled:true,approvalRequired:false,reply:'内部整合チェックを実行できませんでした。元データは変更していません。',error:String(e)}}
  }
  const wrappedFetch=async(...args)=>{const res=await originalFetch(...args);if(!isFinanceUrl(args[0])||!res.ok)return res;try{const data=await res.clone().json(),r=reconcile(data);if(r.changed)save(r);const body=JSON.stringify(r.data);return new Response(body,{status:res.status,statusText:res.statusText,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}catch{return res}};
  window.fetch=wrappedFetch;
  window.upsInternalAction=run;
  window.upsFinanceRepair=repairFinance;
  window.addEventListener('load',()=>{setTimeout(()=>repairFinance().catch(()=>{}),900)},{once:true});
})();
