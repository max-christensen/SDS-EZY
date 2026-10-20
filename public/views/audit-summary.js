/* After finishing (#/audit/:id/summary): the counts and what happens next, in plain words. */
(function () {
  'use strict';
  const App = window.App;
  const esc = App.esc;
  // Load only what is not there yet: index.html already loads photo.js and audit-client.js, and a second copy would replace the live client.
  const NEED = {'/lib/audit-model.js': 'auditModel', '/lib/audit-client.js': 'auditClient', '/lib/photo.js': 'photo'};
  const libs = () => Promise.all(['/lib/audit-model.js', '/lib/audit-client.js'].filter((s) => !(window.SDSLib && window.SDSLib[NEED[s]])).map((s) => App.loadScript(s)));

  App.views.register('auditsummary', {
    title: 'Audit summary',
    async render(root, params) {
      await libs();
      const M = window.SDSLib.auditModel, client = window.SDSLib.auditClient;
      M.ensureCss();
      const id = params.id;
      root.innerHTML = App.loadingHtml('Loading summary...');
      let d;
      try { d = await client.get(id); }
      catch (err) {
        if (err.status === 404) { root.innerHTML = '<div class="empty-state"><h2>Audit not found</h2><a class="btn primary" href="#/places">Choose a place</a></div>'; return; }
        throw err;
      }
      const a = d.audit;
      if (a.status === 'in_progress') {
        root.innerHTML = `<div class="empty-state"><h2>This audit is not finished</h2><p>The summary appears once the audit is finished.</p><a class="btn primary" href="#/audit/${esc(id)}">Go back to the audit</a></div>`;
        return;
      }
      const s = M.summaryFromAudit(d);
      document.title = 'Audit summary - ' + App.companyName();
      root.innerHTML = `<div class="chem-head"><h1>Audit finished</h1>
          <div class="muted">${esc(a.place_name)}${a.place_registration ? ' &middot; ' + esc(a.place_registration) : ''} &middot; ${esc(App.fmtDate(a.finished_at || a.started_at))}</div></div>
        <section class="card" aria-label="Counts"><table class="au-sum"><tbody>${M.summaryRows(s).map((r) => `<tr><td>${esc(r[0])}</td><td>${esc(r[1])}</td></tr>`).join('')}</tbody></table></section>
        <section class="card"><h2>What happens next</h2><ul class="mini-list" style="margin:0;padding-left:18px">${M.nextSteps(s).map((t) => `<li style="margin-bottom:6px">${esc(t)}</li>`).join('')}</ul></section>
        <div class="btn-pair"><a class="btn primary" href="#/audit/${esc(id)}/report">View the report</a><a class="btn" href="#/place/${esc(a.place_id)}">Back to the place</a></div>
        ${App.isAdmin() && (s.not_found + s.changed + s.found + s.disposals) > 0 ? '<p style="margin-top:14px"><a href="#/findings">Review the findings</a></p>' : ''}`;
    },
  });
})();
