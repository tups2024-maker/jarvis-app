(function () {
  const GLOBAL_HIDE = new Set(['積み地', '納品先', '着車', '完了']);

  function currentSheetName() {
    return (document.getElementById('sheetSelect')?.value || '').trim();
  }

  function hideColumnsByHeader(table) {
    const rows = Array.from(table.rows || []);
    if (!rows.length) return;

    let headerRow = null;
    for (const row of rows.slice(0, 8)) {
      const texts = Array.from(row.cells || []).map((cell) => (cell.textContent || '').trim());
      if (texts.some((text) => GLOBAL_HIDE.has(text) || text === '立替金')) {
        headerRow = row;
        break;
      }
    }
    if (!headerRow) return;

    const headers = Array.from(headerRow.cells || []).map((cell) => (cell.textContent || '').trim());
    const hiddenIndexes = new Set();

    headers.forEach((text, index) => {
      if (GLOBAL_HIDE.has(text)) hiddenIndexes.add(index);
    });

    if (currentSheetName().includes('秋山製麺')) {
      const start = headers.findIndex((text) => text === '積み地');
      const end = headers.findIndex((text) => text === '立替金');
      if (start >= 0 && end >= start) {
        for (let i = start; i <= end; i++) hiddenIndexes.add(i);
      }
    }

    rows.forEach((row) => {
      Array.from(row.cells || []).forEach((cell, index) => {
        cell.style.display = hiddenIndexes.has(index) ? 'none' : '';
      });
    });
  }

  function apply() {
    document.querySelectorAll('table').forEach(hideColumnsByHeader);
  }

  const observer = new MutationObserver(() => apply());

  function start() {
    apply();
    observer.observe(document.documentElement, {
      subtree: true,
      childList: true
    });
    document.addEventListener('change', (event) => {
      if (event.target && event.target.id === 'sheetSelect') apply();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
