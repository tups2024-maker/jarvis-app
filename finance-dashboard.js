(() => {
  const fmtYen = (n) => Number.isFinite(Number(n)) ? new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY', maximumFractionDigits: 0 }).format(Number(n)) : '—';
  const fmtPct = (n) => Number.isFinite(Number(n)) ? `${(Number(n) * 100).toFixed(1)}%` : '—';
  const make = (tag, cls, html) => { const el = document.createElement(tag); if (cls) el.className = cls; if (html != null) el.innerHTML = html; return el; };

  function injectStyles() {
    if (document.getElementById('jarvis-finance-style')) return;
    const style = document.createElement('style');
    style.id = 'jarvis-finance-style';
    style.textContent = `
      .jf-wrap{margin:14px 0}.jf-title{font-size:12px;color:#6fe7fb;letter-spacing:.08em;margin:0 0 8px}.jf-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:9px}.jf-card{border:1px solid rgba(87,226,255,.24);background:linear-gradient(180deg,#061e2c,#03111a);border-radius:14px;padding:12px}.jf-card span{display:block;color:#82a4ae;font-size:11px}.jf-card b{display:block;margin-top:5px;font-size:18px;color:#eafcff}.jf-card small{display:block;margin-top:5px;color:#789aa5;font-size:10px;line-height:1.35}.jf-warn{border-color:#8c6436;background:#21170c}.jf-warn b{color:#ffd9a3}.jf-ok b{color:#78f0b6}.jf-note{margin-top:8px;padding:10px 12px;border-radius:12px;background:#061822;color:#9bc4cf;font-size:11px;line-height:1.5}.jf-link{display:inline-flex;margin-top:9px;min-height:44px;padding:0 13px;align-items:center;justify-content:center;border:1px solid rgba(87,227,255,.33);border-radius:12px;background:#072434;color:#f2fdff;text-decoration:none;font-weight:800;font-size:12px}
      @media(max-width:900px){.jf-grid{grid-template-columns:1fr 1fr}.jf-card b{font-size:15px}.jf-wide{grid-column:1/-1}}
    `;
    document.head.appendChild(style);
  }

  function card(label, value, sub, extra='') {
    return `<div class="jf-card ${extra}"><span>${label}</span><b>${value}</b>${sub ? `<small>${sub}</small>` : ''}</div>`;
  }

  function renderHome(data) {
    const home = document.getElementById('home');
    if (!home || document.getElementById('jarvis-finance-home')) return;
    const target = home.querySelector('.core-wrap,.corebox') || home.firstElementChild;
    const wrap = make('div', 'jf-wrap');
    wrap.id = 'jarvis-finance-home';
    wrap.innerHTML = `
      <div class="jf-title">AI経理部 / 売上・利益（${data.scope || '確認済み分'}）</div>
      <div class="jf-grid">
        ${card('今日の売上', fmtYen(data.todayRevenue), '確認済み売上単価のみ', 'jf-ok')}
        ${card('今月売上', fmtYen(data.monthRevenue), '本日まで・確認済み売上単価')}
        ${card('DR支払', fmtYen(data.monthDriverCost), '本日まで・登録済み分')}
        ${card('粗利', fmtYen(data.confirmedGrossProfit), '売上・DR両方確定分のみ')}
        ${card('粗利率', fmtPct(data.confirmedGrossMargin), '確定売上に対する粗利率')}
        ${card('未確認', `${data.unknownCount ?? '—'}件`, `売上単価 ${data.unknownRevenueRate ?? '—'} / DR金額 ${data.unknownDriverCost ?? '—'}`, (Number(data.unknownCount) > 0 ? 'jf-warn' : 'jf-ok'))}
      </div>
      <div class="jf-note">最新実績日: ${data.latestActualDate || '—'} ／ 未確認金額は0円扱いせず粗利から除外しています。</div>`;
    if (target && target.parentNode) target.parentNode.insertBefore(wrap, target);
    else home.appendChild(wrap);
  }

  function renderSales(data) {
    const sales = document.getElementById('sales');
    if (!sales || document.getElementById('jarvis-finance-sales')) return;
    const wrap = make('div', 'jf-wrap');
    wrap.id = 'jarvis-finance-sales';
    wrap.innerHTML = `
      <div class="jf-title">JARVIS売上利益 / 実績スナップショット</div>
      <div class="jf-grid">
        ${card('今日売上', fmtYen(data.todayRevenue), '確認済み分')}
        ${card('今月売上', fmtYen(data.monthRevenue), '本日まで')}
        ${card('DR支払', fmtYen(data.monthDriverCost), '登録済み分')}
        ${card('確定粗利', fmtYen(data.confirmedGrossProfit), '未確認分は除外', 'jf-ok')}
        ${card('確定粗利率', fmtPct(data.confirmedGrossMargin), '確定分のみ')}
        ${card('未確認', `${data.unknownCount ?? '—'}件`, `売上単価 ${data.unknownRevenueRate ?? '—'}件 / DR ${data.unknownDriverCost ?? '—'}件`, (Number(data.unknownCount) > 0 ? 'jf-warn' : 'jf-ok'))}
      </div>
      <div class="jf-note">対象: ${data.scope || '確認済み分'} ／ 集計基準: ${data.actualsCutoff || 'TODAY'} ／ 更新: ${data.updatedAt || '—'}。全社利益としてはまだ確定しません。</div>
      <a class="jf-link" href="https://docs.google.com/spreadsheets/d/1Itlt2LkosrvNnvZrbAWb6PpeZlAQaW0hJf8CzwPfddI/edit#gid=539293015" target="_blank" rel="noopener">JARVIS売上利益シートを開く</a>`;
    const oldAlert = [...sales.querySelectorAll('.notice.alert')][0];
    if (oldAlert) {
      oldAlert.textContent = '配送実績からの売上・利益集計を開始済み。現在は三島先行で、未確認金額は粗利から除外して表示します。';
      oldAlert.parentNode.insertBefore(wrap, oldAlert);
    } else {
      sales.appendChild(wrap);
    }
  }

  async function load() {
    injectStyles();
    try {
      const r = await fetch(`./finance-status.json?v=${Date.now()}`, { cache: 'no-store' });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      if (!data || data.enabled === false) return;
      renderHome(data);
      renderSales(data);
    } catch (e) {
      console.warn('JARVIS finance dashboard load failed', e);
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', load, { once: true });
  else load();
})();
