/* JARVIS delivery API - Google Sheets master source */
const JARVIS_DELIVERY_SPREADSHEET_ID = '1Itlt2LkosrvNnvZrbAWb6PpeZlAQaW0hJf8CzwPfddI';

const JARVIS_DELIVERY_VIEWS = {
  '三島Amazon': {
    source: '2026年8月 三島 ',
    cols: [1,2,3,9,10,11,12,14,15]
  },
  'お酒': {
    source: '2026年8月 株式会社サカエ ',
    cols: [1,2,3,9,10,11,12,13,14,15,16]
  },
  '秋山製麺': {
    source: '2026年8月 秋山製麺所 ',
    cols: [1,2,3,9,10,11,12,14,15]
  }
};

function jarvisJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function jarvisPath_(e) {
  const p = String((e && e.pathInfo) || '').replace(/^\/+|\/+$/g,'');
  return '/' + p;
}

function jarvisSheetValues_(viewName) {
  const cfg = JARVIS_DELIVERY_VIEWS[viewName];
  if (!cfg) throw new Error('Unknown view: ' + viewName);
  const ss = SpreadsheetApp.openById(JARVIS_DELIVERY_SPREADSHEET_ID);
  const sh = ss.getSheetByName(cfg.source);
  if (!sh) throw new Error('Sheet not found: ' + cfg.source);
  const lastRow = Math.max(3, sh.getLastRow());
  const maxCol = Math.max.apply(null, cfg.cols);
  const raw = sh.getRange(1,1,lastRow,maxCol).getDisplayValues();
  return raw.map(row => cfg.cols.map(c => row[c-1] == null ? '' : row[c-1]));
}

function jarvisReadDelivery_() {
  const sheets = Object.keys(JARVIS_DELIVERY_VIEWS).map(name => ({
    sheetName: name,
    values: jarvisSheetValues_(name)
  }));
  return {success:true, data:{sheets:sheets, source:'2026年8月 配送管理表 実運用版'}};
}

function jarvisColToNumber_(letters) {
  let n = 0;
  String(letters || '').toUpperCase().split('').forEach(ch => {
    if (ch >= 'A' && ch <= 'Z') n = n * 26 + (ch.charCodeAt(0) - 64);
  });
  return n;
}

function jarvisParseCell_(a1) {
  const m = String(a1 || '').match(/^([A-Z]+)(\d+)$/i);
  if (!m) throw new Error('Only single-cell writes are supported: ' + a1);
  return {col:jarvisColToNumber_(m[1]), row:Number(m[2])};
}

function jarvisWriteDelivery_(payload) {
  const viewName = String(payload.sheetName || '');
  const cfg = JARVIS_DELIVERY_VIEWS[viewName];
  if (!cfg) throw new Error('Unknown sheetName: ' + viewName);
  const pos = jarvisParseCell_(payload.range);
  if (pos.col < 1 || pos.col > cfg.cols.length) throw new Error('Column out of range');
  const value = Array.isArray(payload.values) && Array.isArray(payload.values[0]) ? payload.values[0][0] : '';
  const actualCol = cfg.cols[pos.col - 1];
  const ss = SpreadsheetApp.openById(JARVIS_DELIVERY_SPREADSHEET_ID);
  const sh = ss.getSheetByName(cfg.source);
  if (!sh) throw new Error('Sheet not found: ' + cfg.source);
  sh.getRange(pos.row, actualCol).setValue(value);
  SpreadsheetApp.flush();
  return {success:true, data:{sheetName:viewName, range:payload.range, value:value}};
}

function doGet(e) {
  try {
    const path = jarvisPath_(e);
    if (path === '/delivery' || path === '/') return jarvisJson_(jarvisReadDelivery_());
    return jarvisJson_({success:false,error:'Unknown path: '+path});
  } catch (err) {
    return jarvisJson_({success:false,error:String(err && err.message || err)});
  }
}

function doPost(e) {
  try {
    const path = jarvisPath_(e);
    const body = e && e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    if (path === '/delivery/save') return jarvisJson_(jarvisWriteDelivery_(body));
    return jarvisJson_({success:false,error:'Unknown path: '+path});
  } catch (err) {
    return jarvisJson_({success:false,error:String(err && err.message || err)});
  }
}
