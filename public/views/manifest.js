// Hazardous chemicals manifest, by placard / manifest ITEM (Schedule 11 of the WHS Regulations).
// The totals come from the server (computeSiteTotals in /lib/ghs-ref.mjs); /lib/manifest-layout.js shapes them for display.
(function () {
  const App = window.App;

  const CSS = `
  .mf-sheet{background:var(--surface,#fff);border:1px solid var(--border,#dad5c8);border-radius:8px;padding:18px}
  .mf-sheet h2.mf-title{margin:0 0 2px;font-size:20px}
  .mf-sheet .mf-sub{margin:0 0 12px;color:var(--muted,#8a8676);font-size:13px}
  .mf-facts{display:grid;grid-template-columns:max-content 1fr;gap:3px 14px;margin:0 0 16px;font-size:13.5px}
  .mf-facts dt{color:var(--ink-soft,#55594f)} .mf-facts dd{margin:0;font-weight:600}
  .mf-over{border:3px solid #b3261e;background:#fdecea;color:#5c0f0a;border-radius:8px;padding:14px 16px;margin:0 0 18px}
  .mf-over h2{margin:0 0 6px;font-size:18px;color:#8c1a12}
  .mf-over ul{margin:0;padding-left:20px} .mf-over li{font-weight:700;font-size:15px;margin:4px 0}
  .mf-ok{border:2px solid #4c7a4c;background:#e6ede3;border-radius:8px;padding:10px 14px;margin:0 0 18px;font-weight:600}
  .mf-scroll{overflow-x:auto}
  table.mf-table{border-collapse:collapse;width:100%;font-size:13px;margin-bottom:6px}
  table.mf-table th,table.mf-table td{border:1px solid var(--border,#dad5c8);padding:5px 7px;text-align:left;vertical-align:top}
  table.mf-table th{background:var(--office-bg,#e7efee);font-weight:600}
  table.mf-table td.num,table.mf-table th.num{text-align:right;font-variant-numeric:tabular-nums}
  table.mf-table thead{display:table-header-group} table.mf-table tr{break-inside:avoid}
  td.st-over{background:#b3261e;color:#fff;font-weight:800;letter-spacing:.04em}
  td.st-ok{color:#2f5d2f;font-weight:600} td.st-na{color:#6b5400;font-style:italic;background:#fbf3df}
  tr.mf-detail td{background:#faf9f5;font-size:12.5px}
  tr.mf-detail ul{margin:0;padding-left:18px}
  .mf-toggle{font-size:12px;padding:3px 8px;min-height:0}
  .mf-sheet h3{font-size:15px;margin:20px 0 6px}
  .mf-note{font-size:12px;color:var(--ink-soft,#55594f);margin:4px 0}
  .mf-issue{margin:0 0 12px} .mf-issue h4{margin:0 0 2px;font-size:14px} .mf-issue p{margin:0 0 4px;font-size:12.5px;color:var(--ink-soft,#55594f)}
  .mf-issue ul{margin:0;padding-left:20px;font-size:13px}
  .mf-how ul{margin:6px 0;padding-left:20px;font-size:13px} .mf-how li{margin:3px 0}
  .mf-source{font-size:12px;color:var(--muted,#8a8676);margin:16px 0 0}
  .mf-sheet .disclaimer{margin-top:14px}
  @media print{.mf-sheet{border:0;padding:0}.mf-scroll{overflow:visible}.mf-over{border-width:3px;-webkit-print-color-adjust:exact;print-color-adjust:exact}td.st-over{-webkit-print-color-adjust:exact;print-color-adjust:exact}}
  `;

  App.views.register('manifest', {
    title: 'Manifest',
    async render(root) {
      root.innerHTML = App.loadingHtml('Loading the manifest...');
      await App.loadScript('/lib/manifest-layout.js');
      const ML = window.SDSLib.manifestLayout;
      const ref = await import('/lib/ghs-ref.mjs');
      const L = ML.LAYOUT;
      const m = await App.api('/manifest');
      const rows = m.rows || [];
      const totals = m.totals && m.totals.items ? m.totals : { items: [], issues: [] };
      const model = ML.itemsModel(totals);
      const banners = ML.overBanners(model);
      const groups = ML.groupIssues(totals);
      const stockItems = model.filter((x) => x.hasStock);
      const company = Object.assign({}, App.settings || {});
      const when = App.fmtDate(m.generated_at || new Date().toISOString());
      let showAll = false;

      const E = App.esc;
      const stCell = (s, note) => `<td class="${s === 'OVER' ? 'st-over' : s === 'OK' ? 'st-ok' : 'st-na'}">${E(s)}${note ? `<br><span style="font-weight:400;font-size:11.5px">${E(note)}</span>` : ''}</td>`;

      function contribHtml(x) {
        const parts = x.mixParts ? `<div><strong>Adds up:</strong> ${x.mixParts.map((p) => `item ${p.item}: ${E(ML.fmtNum(p.total))}`).join(', ')}</div>` : '';
        const list = x.contributors.map((c) => `<li>${E(c.name)}${c.location ? ', ' + E(c.location) : ''}: ${E(ML.fmtNum(c.quantity))} ${E(c.unit)}${c.counted ? '' : ' <strong>(not counted: wrong unit for this item)</strong>'}${c.check ? ' <em>(category not confirmed)</em>' : ''}${c.rule === 'spill_compound' ? ' <em>(counted as a lower flash point category: same spill compound)</em>' : ''}</li>`).join('');
        return parts + (list ? `<ul>${list}</ul>` : (x.mixParts ? '' : '<em>No stock</em>'));
      }
      const descCell = (x) => `${E(x.title)}${x.notes.length ? ' ' + x.notes.map((n) => `<sup title="${E(ref.PLACARD_NOTES[n] || '')}">note ${n}</sup>`).join(' ') : ''}`;

      function itemsTable(list, printing) {
        const head = `<thead><tr>${L.items.map((c) => `<th scope="col"${c.num ? ' class="num"' : ''}>${E(c.label)}</th>`).join('')}${printing ? '' : '<th scope="col"><span class="sr-only">Details</span></th>'}</tr></thead>`;
        const body = list.map((x) => {
          const main = `<tr><td class="num">${x.item}</td><td>${descCell(x)}</td><td>${E(x.adg)}</td><td class="num">${E(ML.fmtNum(x.placard))} ${E(x.unit)}</td><td class="num">${E(ML.fmtNum(x.manifest))} ${E(x.unit)}</td><td class="num"><strong>${E(x.totalText)}</strong></td>${stCell(x.pstatus, x.pnote)}${stCell(x.mstatus, x.mnote)}<td>${printing ? contribHtml(x) : E(x.productsText)}</td>${printing ? '' : `<td>${x.hasStock ? `<button type="button" class="mf-toggle" data-item="${x.item}" aria-expanded="false" aria-controls="mfd-${x.item}">Details</button>` : ''}</td>`}</tr>`;
          const det = printing ? '' : `<tr class="mf-detail" id="mfd-${x.item}" hidden><td></td><td colspan="${L.items.length}">${contribHtml(x)}</td></tr>`;
          return main + det;
        }).join('');
        return `<table class="mf-table" id="${printing ? '' : 'mfItems'}">${head}<tbody>${body}</tbody></table>`;
      }

      function rowsTable() {
        if (!rows.length) return `<p class="muted">${E(L.emptyText)}</p>`;
        return `<table class="mf-table"><thead><tr>${L.rows.map((c) => `<th scope="col"${c.num ? ' class="num"' : ''}>${E(c.label)}</th>`).join('')}</tr></thead><tbody>${rows.map((r) => `<tr>${L.rows.map((c) => `<td${c.num ? ' class="num"' : ''}>${E(c.get(r))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
      }

      function issuesHtml() {
        if (!groups.length) return '<p class="muted">Nothing needs checking.</p>';
        return groups.map((g) => `<div class="mf-issue"><h4>${E(g.title)} (${g.entries.length})</h4>${g.help ? `<p>${E(g.help)}</p>` : ''}<ul>${g.entries.map((e) => `<li>${E(e.message)}</li>`).join('')}</ul></div>`).join('');
      }

      function howHtml() {
        return `<div class="mf-how"><p class="mf-note">${E(ref.ADG_COLUMN_NOTE)}</p><p class="mf-note"><strong>Flammable liquids category 4:</strong> ${E(ref.FLAM_LIQ_CAT4_RULE)}</p>
          <p class="mf-note"><strong>Notes to the table</strong></p><ul>${Object.entries(ref.PLACARD_NOTES).map(([n, t]) => `<li><strong>Note ${n}:</strong> ${E(t)}</li>`).join('')}</ul>
          <p class="mf-note"><strong>Where the source is not clear, SDS EZY takes the cautious reading:</strong></p><ul>${ML.DECISIONS.map((d) => `<li>${E(d)}</li>`).join('')}</ul></div>`;
      }

      function bannerHtml() {
        if (!banners.length) return model.some((x) => x.hasStock) ? '<div class="mf-ok" role="status">No item is over its placard or manifest quantity.</div>' : '';
        return `<div class="mf-over" role="alert"><h2>Over the placard or manifest quantity</h2><ul>${banners.map((b) => `<li>${E(b.text)}</li>`).join('')}</ul></div>`;
      }

      function sheetHtml(printing) {
        const facts = ML.headerFacts(company, when, L);
        const list = printing ? stockItems : (showAll ? model : stockItems);
        const hidden = model.length - stockItems.length;
        return `<style>${CSS}</style><div class="mf-sheet">
          <h2 class="mf-title">${E(L.title)}</h2><p class="mf-sub">${E(L.subtitle)}</p>
          <dl class="mf-facts">${facts.map((f) => `<dt>${E(f.label)}</dt><dd>${E(f.value)}</dd>`).join('')}</dl>
          ${bannerHtml()}
          <h3>Items: site total against placard and manifest quantity</h3>
          ${list.length ? `<div class="mf-scroll">${itemsTable(list, printing)}</div>` : '<p class="muted">No stock with a quantity is recorded yet, so every item is at zero.</p>'}
          ${printing ? (hidden ? `<p class="mf-note">${hidden} other items in the table have no stock and are not listed.</p>` : '') : (hidden ? `<p><button type="button" id="mfAll" aria-pressed="${showAll}">${showAll ? 'Show only items with stock' : 'Show all ' + model.length + ' items'}</button></p>` : '')}
          <p class="mf-note">${E(ref.ADG_COLUMN_NOTE)}</p>
          <h3>Things to check${groups.length ? ` (${groups.reduce((n, g) => n + g.entries.length, 0)})` : ''}</h3>${issuesHtml()}
          <h3>Hazardous chemicals by storage location</h3><div class="mf-scroll">${rowsTable()}</div>
          <h3>How this is worked out</h3>${printing ? howHtml() : `<details class="mf-how-d"><summary>Show how this is worked out</summary>${howHtml()}</details>`}
          <p class="mf-source">${E(ML.SOURCE_LINE)}</p>
          ${App.disclaimerHtml()}</div>`;
      }

      root.innerHTML = `<div class="topbar"><div><h1>${E(L.title)}</h1><p class="sub">Quantities held against the placard and manifest quantities in Schedule 11.</p></div>
        <div class="actions no-print"><button type="button" class="primary" id="mfPrint">Print</button><button type="button" id="mfCsv">Download CSV</button></div></div>
        <div id="mfBody"></div>`;
      const body = root.querySelector('#mfBody');

      function draw() {
        body.innerHTML = sheetHtml(false);
        const all = body.querySelector('#mfAll');
        if (all) all.addEventListener('click', () => { showAll = !showAll; draw(); });
        body.querySelectorAll('.mf-toggle').forEach((b) => b.addEventListener('click', () => {
          const d = body.querySelector('#mfd-' + b.dataset.item);
          const open = d.hidden; d.hidden = !open; b.setAttribute('aria-expanded', String(open)); b.textContent = open ? 'Hide' : 'Details';
        }));
      }
      draw();

      root.querySelector('#mfPrint').addEventListener('click', () => {
        App.print(App.printHeaderHtml() + sheetHtml(true), { landscape: true });
      });
      root.querySelector('#mfCsv').addEventListener('click', () => {
        const csv = ML.csvRows({ rows, totals, generated_at: when }, company, ref);
        csv.splice(1, 0, [(window.DISCLAIMER && window.DISCLAIMER.short) || '']);
        App.download('hazardous-manifest-' + (m.generated_at || App.today()).slice(0, 10) + '.csv', App.csv(csv), 'text/csv;charset=utf-8');
      });
    },
  });
})();
