/* Review list: the home screen. What needs attention today. */
(function () {
  const App = window.App;
  const SECTIONS = [
    { key: 'overdue', title: 'SDS review overdue', hint: 'The safety data sheet is more than 5 years old. Get a new one from the supplier.', tile: 'Overdue', cls: 'hot' },
    { key: 'due_soon', title: 'SDS review due soon', hint: 'These will be 5 years old within 90 days.', tile: 'Due soon', cls: 'warm' },
    { key: 'no_sds', title: 'No SDS on file', hint: 'There is no safety data sheet attached to these chemicals yet.', tile: 'No SDS', cls: 'warm' },
    { key: 'no_decision', title: 'Not checked yet', hint: 'Nobody has decided yet whether these are hazardous or not.', tile: 'Not checked yet', cls: '' },
  ];

  function rowHtml(r, key) {
    let badge;
    if (key === 'no_sds') badge = App.reviewBadge('no_sds');
    else if (key === 'no_decision') badge = App.decisionBadge(null);
    else badge = App.reviewBadge(r.review_status || key, r.review_due);
    return `<li><a class="item" href="#/chemical/${r.id}"><span><span class="name">${App.esc(r.product_name)}</span><br><span class="sup">${App.esc(r.supplier || 'Supplier not recorded')}</span></span>${badge}</a></li>`;
  }

  App.views.register('review', {
    title: 'Review',
    async render(root) {
      root.innerHTML = App.loadingHtml('Loading the review list...');
      const data = await App.api('/review');
      const counts = data.counts || {};
      const total = SECTIONS.reduce((n, s) => n + (counts[s.key] || 0), 0);
      let html = `<div class="topbar"><div><h1>Review</h1><p class="sub">What needs attention${data.as_of ? ', as of ' + App.esc(App.fmtDate(data.as_of)) : ''}.</p></div></div>`;
      html += `<form class="find-form no-print" id="findForm" role="search"><label class="sr-only" for="findQ">Find a chemical</label><input type="search" id="findQ" placeholder="Find a chemical by name or supplier"><button class="primary" type="submit">Find</button></form>`;
      html += `<div class="tiles">${SECTIONS.map((s) => {
        const n = counts[s.key] || 0;
        return `<a class="tile ${n ? s.cls : 'zero'}" href="#review-${s.key}" data-jump="${s.key}"><div class="num">${n}</div><div class="lbl">${s.tile}</div></a>`;
      }).join('')}</div>`;

      if (!total) {
        let registerCount = null;
        try { registerCount = (await App.api('/chemicals?limit=1')).total; } catch (e) { /* ignore */ }
        if (registerCount === 0) {
          html += `<div class="empty-state"><h2>Your register is empty</h2><p>Upload a safety data sheet and SDS EZY will add the chemical and draft its risk assessment.</p><a class="btn primary" href="#/upload">Upload an SDS</a>${App.isAdmin() ? ' <a class="btn" href="#/import">Import a spreadsheet</a>' : ''}</div>`;
        } else {
          html += `<div class="empty-state"><h2>All clear</h2><p>Every chemical has a safety data sheet that is in date, and every chemical has been checked. Nothing needs your attention.</p><a class="btn" href="#/register">See the register</a></div>`;
        }
      } else {
        SECTIONS.forEach((s) => {
          const list = data[s.key] || [];
          if (!list.length) return;
          const n = counts[s.key] || list.length;
          html += `<section class="card" id="review-${s.key}" aria-labelledby="h-${s.key}"><h2 id="h-${s.key}">${s.title} <span class="count">(${n})</span></h2><p class="hint" style="margin:0 0 6px">${s.hint}</p><ul class="rowlist">${list.map((r) => rowHtml(r, s.key)).join('')}</ul>${n > list.length ? `<p class="hint">Showing the first ${list.length} of ${n}. Open the <a href="#/register">register</a> to see them all.</p>` : ''}</section>`;
        });
      }
      root.innerHTML = html;
      root.querySelector('#findForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const q = root.querySelector('#findQ').value.trim();
        App.navigate('#/register' + (q ? '?q=' + encodeURIComponent(q) : ''));
      });
      root.querySelectorAll('[data-jump]').forEach((a) => a.addEventListener('click', (e) => {
        e.preventDefault();
        const el = root.querySelector('#review-' + a.dataset.jump);
        if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      }));
    },
  });
})();
