/* JARVIS V7.0.7 workbook stability hotfix - 2026-09-01 */
(function(){
  'use strict';

  function setWorkbookCellDirect(sheetName,r,c,value){
    if(!WB || !window.XLSX) return false;
    const ws=WB.Sheets?.[sheetName];
    if(!ws) return false;
    const addr=XLSX.utils.encode_cell({r,c});
    const old=ws[addr] || {};
    const next={...old};
    delete next.f;
    delete next.w;
    next.v=value==null?'':value;
    next.t=typeof next.v==='number'?'n':(typeof next.v==='boolean'?'b':'s');
    ws[addr]=next;
    let range;
    try{
      range=ws['!ref']?XLSX.utils.decode_range(ws['!ref']):{s:{r,c},e:{r,c}};
    }catch(_){
      range={s:{r,c},e:{r,c}};
    }
    range.s.r=Math.min(range.s.r,r);
    range.s.c=Math.min(range.s.c,c);
    range.e.r=Math.max(range.e.r,r);
    range.e.c=Math.max(range.e.c,c);
    ws['!ref']=XLSX.utils.encode_range(range);
    return true;
  }
  window.setWorkbookCellDirect=setWorkbookCellDirect;

  function rebuildSheetPreserveFormatting(name,a){
    const old=WB?.Sheets?.[name] || {};
    const next=XLSX.utils.aoa_to_sheet(a);
    Object.keys(next).forEach(addr=>{
      if(addr[0]==='!') return;
      const prior=old[addr];
      if(prior?.s) next[addr].s=prior.s;
      if(prior?.z) next[addr].z=prior.z;
    });
    ['!cols','!rows','!merges','!autofilter','!freeze'].forEach(k=>{
      if(old[k]) next[k]=old[k];
    });
    WB.Sheets[name]=next;
    return next;
  }

  applyManualWorkbookOverrides=function(){
    if(!WB||!window.XLSX) return 0;
    let n=0;
    WB.SheetNames.forEach(sheet=>{
      const a=XLSX.utils.sheet_to_json(WB.Sheets[sheet],{header:1,defval:''});
      if(a.length<4) return;
      const h=a[2]||[];
      for(let r=3;r<a.length;r++){
        for(let c=0;c<h.length;c++){
          const o=WB_MANUAL_OVERRIDES[wbManualKey(sheet,a[r],h[c])];
          if(o && a[r][c]!==o.value){
            a[r][c]=o.value;
            setWorkbookCellDirect(sheet,r,c,o.value);
            n++;
          }
        }
      }
    });
    return n;
  };

  applyHalfActualRules=function(){
    if(!WB||!window.XLSX) return 0;
    let changed=0;
    WB.SheetNames.forEach(name=>{
      const a=XLSX.utils.sheet_to_json(WB.Sheets[name],{header:1,defval:''});
      if(a.length<3) return;
      const h=a[2]||[];
      const bizCol=h.findIndex(x=>String(x).trim()==='業務名');
      const actualCol=h.findIndex(x=>String(x).trim()==='実績');
      if(bizCol<0||actualCol<0) return;
      for(let r=3;r<a.length;r++){
        const biz=String(a[r]?.[bizCol]||'').trim();
        const target=(biz==='三島5h'||biz==='三島6h'||biz==='鶴見PM')?0.5:null;
        if(target!==null && Number(a[r]?.[actualCol])!==target){
          a[r][actualCol]=target;
          setWorkbookCellDirect(name,r,actualCol,target);
          changed++;
        }
      }
    });
    return changed;
  };

  applyNoAutoPayRows=function(){
    if(!WB||!window.XLSX) return 0;
    applyHalfActualRules();
    const groups=new Set(['カメレオン','福羅興業','sitycanvas','オーロラネクスト']);
    let changed=0;
    WB.SheetNames.forEach(name=>{
      const a=XLSX.utils.sheet_to_json(WB.Sheets[name],{header:1,defval:''});
      if(a.length<3) return;
      const h=a[2]||[];
      const drCol=h.findIndex(x=>String(x).trim()==='DR');
      const payCol=h.findIndex(x=>String(x).trim()==='DR金額');
      const noteCol=h.findIndex(x=>String(x).trim().replace(/\s/g,'')==='備考');
      if(drCol<0||payCol<0) return;
      for(let r=3;r<a.length;r++){
        const forced=forcedNoteForDriver(a[r]?.[drCol]);
        const note=noteCol>=0?String(a[r]?.[noteCol]||'').trim():'';
        if(groups.has(forced)||groups.has(note)){
          if(a[r]?.[payCol]!=='' && a[r]?.[payCol]!=null){
            a[r][payCol]='';
            setWorkbookCellDirect(name,r,payCol,'');
            changed++;
          }
        }
      }
    });
    return changed;
  };

  normalizeBlankMoneyDefaults=function(){
    if(!WB||!window.XLSX) return 0;
    let changed=0;
    WB.SheetNames.forEach(name=>{
      const a=XLSX.utils.sheet_to_json(WB.Sheets[name],{header:1,defval:''});
      if(a.length<3) return;
      const h=a[2]||[];
      const cols=h.map((v,c)=>['天引き金額','フォロー金額'].includes(String(v).trim())?c:-1).filter(c=>c>=0);
      for(let r=3;r<a.length;r++){
        for(const c of cols){
          const key=wbManualKey(name,a[r],h[c]);
          if((a[r]?.[c]===0||a[r]?.[c]==='0')&&!WB_MANUAL_OVERRIDES[key]){
            a[r][c]='';
            setWorkbookCellDirect(name,r,c,'');
            changed++;
          }
        }
      }
    });
    return changed;
  };

  scheduleWorkbookAutoSave=function(sheetName,r,c,value){
    WB_HAS_UNSAVED_CHANGES=true;
    clearTimeout(WB_AUTO_SAVE_TIMER);
    WB_AUTO_SAVE_TIMER=setTimeout(async()=>{
      WB_AUTO_SAVE_TIMER=null;
      try{
        const buf=XLSX.write(WB,{bookType:'xlsx',type:'array'});
        await saveWorkbookBytes(buf,WB_NAME);
        const range=XLSX.utils.encode_cell({r,c});
        await saveGoogleDeliveryRange(sheetName,range,[[value]]);
        WB_HAS_UNSAVED_CHANGES=false;
        if($('workbookStatus')) $('workbookStatus').textContent='✓ セルを反映しJARVISとGoogleへ自動保存しました';
      }catch(e){
        WB_HAS_UNSAVED_CHANGES=true;
        console.error('workbook auto save failed',e);
        if($('workbookStatus')) $('workbookStatus').textContent='Googleへの自動保存に失敗しました（JARVIS内データは保持）：'+(e?.message||e);
      }
    },450);
  };

  applyWorkbookCellEdit=async function(value){
    if(!WB||!WB_EDIT_TARGET){WB_CELL_EDIT_ACTION_BUSY=false;return;}
    const target={...WB_EDIT_TARGET};
    closeWorkbookCellEditor();
    try{
      const {name,r,c}=target;
      const a=XLSX.utils.sheet_to_json(WB.Sheets[name],{header:1,defval:''});
      WB_HAS_UNSAVED_CHANGES=true;
      while(a.length<=r) a.push([]);
      while(a[r].length<=c) a[r].push('');
      a[r][c]=value;
      rememberManualCell(name,a,r,c,value);
      setWorkbookCellDirect(name,r,c,value);
      applyNoAutoPayRows();
      renderWorkbook();
      const buf=XLSX.write(WB,{bookType:'xlsx',type:'array'});
      await saveWorkbookBytes(buf,WB_NAME);
      await saveGoogleDeliveryRange(name,XLSX.utils.encode_cell({r,c}),[[value]]);
      WB_HAS_UNSAVED_CHANGES=false;
      if($('workbookStatus')) $('workbookStatus').textContent=`✓ 行${r+1}・列${c+1}をJARVISとGoogleへ保存しました。`;
    }catch(e){
      WB_HAS_UNSAVED_CHANGES=true;
      console.error('workbook cell save failed',e);
      if($('workbookStatus')) $('workbookStatus').textContent='Googleへの保存に失敗しました（JARVIS内データは保持）：'+(e?.message||e);
    }finally{
      WB_CELL_EDIT_ACTION_BUSY=false;
    }
  };

  promptWorkbookCellEdit=async function(r,c){
    if(!WB||WB_CELL_EDIT_ACTION_BUSY) return;
    const name=$('sheetSelect').value||WB.SheetNames[0];
    const ws=WB.Sheets[name];
    const a=XLSX.utils.sheet_to_json(ws,{header:1,defval:''});
    while(a.length<=r) a.push([]);
    while(a[r].length<=c) a[r].push('');
    const oldValue=a[r][c]??'';
    const next=window.prompt('セルを編集',String(oldValue));
    if(next===null) return;
    WB_CELL_EDIT_ACTION_BUSY=true;
    WB_HAS_UNSAVED_CHANGES=true;
    const addr=XLSX.utils.encode_cell({r,c});
    const oldCell=ws[addr]?JSON.parse(JSON.stringify(ws[addr])):null;
    const oldOverrides=JSON.stringify(WB_MANUAL_OVERRIDES);
    try{
      a[r][c]=next;
      rememberManualCell(name,a,r,c,next);
      setWorkbookCellDirect(name,r,c,next);
      applyNoAutoPayRows();
      renderWorkbook();
      const buf=XLSX.write(WB,{bookType:'xlsx',type:'array'});
      await saveWorkbookBytes(buf,WB_NAME);
      try{
        await saveGoogleDeliveryRange(name,addr,[[next]]);
        WB_HAS_UNSAVED_CHANGES=false;
        if($('workbookStatus')) $('workbookStatus').textContent='✓ セルを反映しJARVISとGoogleへ自動保存しました';
      }catch(remoteError){
        console.error('prompt google save failed',remoteError);
        if($('workbookStatus')) $('workbookStatus').textContent='Googleへの保存に失敗しました（JARVIS内データは保持）：'+(remoteError?.message||remoteError);
      }
    }catch(e){
      WB_HAS_UNSAVED_CHANGES=false;
      if(oldCell) ws[addr]=oldCell; else delete ws[addr];
      try{
        WB_MANUAL_OVERRIDES=JSON.parse(oldOverrides);
        localStorage.setItem(WB_MANUAL_KEY,oldOverrides);
      }catch(_){ }
      renderWorkbook();
      console.error('prompt workbook cell save failed',e);
      if($('workbookStatus')) $('workbookStatus').textContent='セルの保存に失敗したため元の値へ戻しました：'+(e?.message||e);
    }finally{
      WB_CELL_EDIT_ACTION_BUSY=false;
    }
  };

  setWorkbookAOA=function(name,a){
    rebuildSheetPreserveFormatting(name,a);
    WB_HAS_UNSAVED_CHANGES=true;
    renderWorkbook();
  };

  renderWorkbook=function(){
    if(!$('workbookTable')) return;
    if(!WB){$('workbookTable').innerHTML='<tbody><tr><td>三島配送管理表を準備しています…</td></tr></tbody>';return;}
    const name=$('sheetSelect').value||WB.SheetNames[0];
    if(!name||!WB.Sheets[name]){$('workbookTable').innerHTML='<tbody><tr><td>表示できるシートがありません</td></tr></tbody>';return;}
    let aoa=XLSX.utils.sheet_to_json(WB.Sheets[name],{header:1,defval:''});
    if(!aoa.length){
      aoa=[['案件名：',name],['請求先：',''],['走行日','DR','業務名','天引き金額','DR金額','フォロー金額','備考','実績','記入者']];
      rebuildSheetPreserveFormatting(name,aoa);
    }
    const maxCols=Math.max(1,...aoa.map(r=>r.length));
    const touchEdit=!!(window.matchMedia&&window.matchMedia('(pointer: coarse)').matches);
    const options=Array.from({length:maxCols},(_,c)=>[...new Set(aoa.slice(3).map(r=>String(r[c]??'').trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ja')));
    let h='<tbody>';
    aoa.slice(0,3).forEach((row,r)=>{
      h+='<tr>';
      for(let c=0;c<maxCols;c++){
        const v=row[c]??'';
        if(r===2){
          const opts=options[c].map(x=>`<option value="${esc(x)}" ${WB_FILTERS[c]===x?'selected':''}>${esc(x)}</option>`).join('');
          h+=`<td class="workbook-header-cell"><div class="wb-head-label">${esc(v||('列'+(c+1)))}</div><select class="wb-filter" data-c="${c}"><option value="">すべて</option>${opts}</select></td>`;
        }else h+=`<td>${esc(v)}</td>`;
      }
      h+='</tr>';
    });
    const visible=aoa.map((row,r)=>({row,r})).slice(3).filter(({row})=>Object.entries(WB_FILTERS).every(([c,val])=>!val||String(row[+c]??'').trim()===val));
    visible.slice(0,500).forEach(({row,r})=>{
      h+=`<tr class="${WB_SELECTED_ROW===r?'selected-row':''}">`;
      for(let c=0;c<maxCols;c++){
        const v=row[c]??'';
        const selCol=WB_SELECTED_COL===c?' selected-col':'';
        const selCell=WB_SELECTED_CELL===`${r}:${c}`?' selected-cell':'';
        if(WB_EDIT&&!touchEdit){
          h+=`<td class="${selCol}${selCell}" data-r="${r}" data-c="${c}"><input class="wb-cell-input" data-r="${r}" data-c="${c}" value="${esc(v)}"></td>`;
        }else{
          h+=`<td class="${selCol}${selCell}" data-r="${r}" data-c="${c}" tabindex="0">${esc(v)}</td>`;
        }
      }
      h+='</tr>';
    });
    h+='</tbody>';
    $('workbookTable').innerHTML=h;

    document.querySelectorAll('#workbookTable .wb-filter').forEach(sel=>sel.addEventListener('change',()=>{
      const c=sel.dataset.c;
      if(sel.value) WB_FILTERS[c]=sel.value; else delete WB_FILTERS[c];
      renderWorkbook();
    }));

    if(WB_EDIT&&!touchEdit){
      document.querySelectorAll('#workbookTable .wb-cell-input').forEach(inp=>{
        const select=()=>{
          WB_SELECTED_ROW=+inp.dataset.r;
          WB_SELECTED_COL=+inp.dataset.c;
          WB_SELECTED_CELL=`${inp.dataset.r}:${inp.dataset.c}`;
        };
        inp.addEventListener('focus',select);
        inp.addEventListener('click',select);
        const commit=()=>{
          select();
          const a=XLSX.utils.sheet_to_json(WB.Sheets[name],{header:1,defval:''});
          const r=+inp.dataset.r,c=+inp.dataset.c;
          while(a.length<=r) a.push([]);
          while(a[r].length<=c) a[r].push('');
          a[r][c]=inp.value;
          rememberManualCell(name,a,r,c,inp.value);
          setWorkbookCellDirect(name,r,c,inp.value);
          WB_HAS_UNSAVED_CHANGES=true;
          if($('workbookStatus')) $('workbookStatus').textContent=`編集中：行${r+1}・列${c+1}`;
          scheduleWorkbookAutoSave(name,r,c,inp.value);
        };
        inp.addEventListener('input',commit);
        inp.addEventListener('change',commit);
      });
    }else{
      document.querySelectorAll('#workbookTable td[data-r]').forEach(td=>td.addEventListener('click',()=>{
        if(WB_EDIT&&touchEdit){promptWorkbookCellEdit(+td.dataset.r,+td.dataset.c);return;}
        WB_SELECTED_ROW=+td.dataset.r;
        WB_SELECTED_COL=+td.dataset.c;
        WB_SELECTED_CELL=`${td.dataset.r}:${td.dataset.c}`;
        renderWorkbook();
      }));
    }
  };

  window.JARVIS_WORKBOOK_HOTFIX='7.0.7-20260901';
  console.info('JARVIS workbook hotfix active:',window.JARVIS_WORKBOOK_HOTFIX);
})();
