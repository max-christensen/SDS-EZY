// Hazardous chemicals manifest. The table layout comes from /lib/manifest-layout.js (one definition to reshape later).
(function () {
  const App = window.App;

  const CSS = `
  .mf-sheet{background:var(--surface,#fff);border:1px solid var(--border,#dad5c8);border-radius:8px;padding:18px}
  .mf-sheet h2.mf-title{margin:0 0 2px;font-size:20px}
  .mf-sheet .mf-sub{margin:0 0 12px;color:var(--muted,#8a8676);font-size:13px}
  .mf-facts{display:grid;grid-template-columns:max-content 1fr;gap:3px 14px;margin:0 0 16px;font-size:13.5px}
  .mf-facts dt{color:var(--ink-soft,#55594f)} .mf-facts dd{margin:0;font-weight:600}
  .mf-scroll{overflow-x:auto}
  table.mf-table{border-collapse:collapse;width:100%;font-size:13px;margin-bottom:6px}
  table.mf-table th,table.mf-table td{border:1px solid var(--border,#dad5c8);padding:5px 7px;text-align:left;vertical-align:top}
  table.mf-table th{background:var(--office-bg,#e7efee);font-weight:600}
  table.mf-table td.num,table.mf-table th.num{text-align:right;font-variant-numeric:tabular-nums}
  table.mf-table thead{display:table-header-group} table.mf-table tr{break-inside:avoid}
  .mf-sheet h3{font-size:15px;margin:18px 0 6px}
  .mf-sheet h3 + .mf-scroll table.mf-table{max-width:460px}
  .mf-note{font-size:12px;color:var(--muted,#8a8676);margin:2px 0 0}
  .mf-sheet .disclaimer{margin-top:18px}
  @media print{.mf-sheet{border:0;padding:0}.mf-scroll{overflow:visible}}
  `;

  App.views.register('manifest', {
    title: 'Manifest',
    async render(root) {
      root.innerHTML = App.loadingHtml('Loading the manifest...');
      await App.loadScript('/lib/manifest-layout.js');
      const ML = window.SDSLib.manifestLayout;
      const L = ML.LAYOUT;
      const m = await App.api('/manifest');
      const rows = m.rows || [];
      const totals = m.totals && m.totals.length ? m.totals : ML.computeTotals(rows);
      const company = Object.assign({}, App.settings || {});
      const when = App.fmtDate(m.generated_at || new Date().toISOString());

      function tableHtml(cols, body) {
        return `<table class="mf-table"><thead><tr>${cols.map((c) => `<th scope="col"${c.num ? ' class="num"' : ''}>${App.esc(c.label)}</th>`).join('')}</tr></thead><tbody>${body}</tbody></table>`;
      }
      function sheetHtml() {
        const facts = ML.headerFacts(company, when, L);
        const body = rows.map((r) => `<tr>${L.columns.map((c) => `<td${c.num ? ' class="num"' : ''}>${App.esc(c.get(r))}</td>`).join('')}</tr>`).join('');
        const tbody = totals.map((t) => `<tr>${L.totals.columns.map((c) => `<td${c.num ? ' class="num"' : ''}>${App.esc(c.get(t))}</td>`).join('')}</tr>`).join('');
        return `<style>${CSS}</style><div class="mf-sheet">
          <h2 class="mf-title">${App.esc(L.title)}</h2><p class="mf-sub">${App.esc(L.subtitle || '')}</p>
          <dl class="mf-facts">${facts.map((f) => `<dt>${App.esc(f.label)}</dt><dd>${App.esc(f.value)}</dd>`).join('')}</dl>
          <div class="mf-scroll">${rows.length ? tableHtml(L.columns, body) : `<p class="muted">${App.esc(L.emptyText)}</p>`}</div>
          <h3>${App.esc(L.totals.title)}</h3>
          <div class="mf-scroll">${totals.length ? tableHtml(L.totals.columns, tbody) : '<p class="muted">Nothing to total.</p>'}</div>
          <p class="mf-note">Quantities are added up as written: litres and kilograms are kept apart.</p>
          ${App.disclaimerHtml()}</div>`;
      }

      root.innerHTML = `<div class="topbar"><div><h1>${App.esc(L.title)}</h1><p class="sub">Every hazardous chemical that has a storage location, and the totals by dangerous goods class.</p></div>
        <div class="actions no-print"><button type="button" class="primary" id="mfPrint">Print</button><button type="button" id="mfCsv">Download CSV</button></div></div>
        ${rows.length ? '' : `<div class="empty-state"><h2>Nothing on the manifest yet</h2><p>${App.esc(L.emptyText)} A chemical appears here once it is marked hazardous and has a place where it is stored.</p><a class="btn" href="#/hazardous">See the hazardous chemicals</a></div>`}
        ${sheetHtml()}`;

      root.querySelector('#mfPrint').addEventListener('click', () => {
        App.print(App.printHeaderHtml() + sheetHtml(), { landscape: true });
      });
      root.querySelector('#mfCsv').addEventListener('click', () => {
        const csv = ML.csvRows({ rows, totals, generated_at: when }, company);
        csv.splice(1, 0, [(window.DISCLAIMER && window.DISCLAIMER.short) || '']);
        App.download('hazardous-manifest-' + (m.generated_at || App.today()).slice(0, 10) + '.csv', App.csv(csv), 'text/csv;charset=utf-8');
      });
    },
  });
})();
