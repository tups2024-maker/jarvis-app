(function () {
  const HIDE_HEADERS = new Set(['積み地', '納品先', '着車', '完了']);

  function hideColumnsByHeader(table) {
    const rows = Array.from(table.rows || []);
    if (!rows.length) return;

    let headerRow = null;
    for (const row of rows.slice(0, 8)) {
      const texts = Array.from(row.cells || []).map((cell) => (cell.textContent || '').trim());
      if (texts.some((text) => HIDE_HEADERS.has(text))) {
        headerRow = row;
        break;
      }
    }
    if (!headerRow) return;

    const hiddenIndexes = [];
    Array.from(headerRow.cells || []).forEach((cell, index) => {
      const text = (cell.textContent || '').trim();
      if (HIDE_HEADERS.has(text)) hiddenIndexes.push(index);
    });
    if (!hiddenIndexes.length) return;

    rows.forEach((row) => {
      hiddenIndexes.forEach((index) => {
        const cell = row.cells && row.cells[index];
        if (cell) cell.style.display = 'none';
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
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
