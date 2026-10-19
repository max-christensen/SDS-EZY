/* SDS EZY core. Everything the screens share lives on window.App. */
(function () {
  'use strict';
  const App = window.App = window.App || {};

  // ---------------------------------------------------------------- small helpers
  const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
  App.esc = (s) => String(s === null || s === undefined ? '' : s).replace(/[&<>"']/g, (m) => ESC[m]);
  const $ = (id) => document.getElementById(id);
  App.$ = $;

  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  App.fmtDate = function (v) {
    if (!v) return '';
    const s = String(v);
    let m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    if (m) return `${+m[3]} ${MONTHS[+m[2] - 1]} ${m[1]}`;
    // ISO or SQLite "YYYY-MM-DD HH:MM:SS" (UTC)
    const d = new Date(/^\d{4}-\d{2}-\d{2} \d/.test(s) ? s.replace(' ', 'T') + 'Z' : s);
    if (isNaN(d)) return s;
    return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  };
  App.today = function () {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };
  App.debounce = function (fn, ms) { let t; return function (...a) { clearTimeout(t); t = setTimeout(() => fn.apply(this, a), ms); }; };

  // ---------------------------------------------------------------- API
  App.me = null;
  App.settings = {};
  App.publicSettings = { company_name: '', has_logo: false, logo_version: '' };

  App.api = async function (path, opts = {}) {
    const init = { method: opts.method || 'GET', headers: {}, credentials: 'same-origin' };
    if (opts.body !== undefined && opts.body !== null) {
      if (typeof FormData !== 'undefined' && opts.body instanceof FormData) init.body = opts.body;
      else { init.body = typeof opts.body === 'string' ? opts.body : JSON.stringify(opts.body); init.headers['Content-Type'] = 'application/json'; }
    }
    const url = path.startsWith('/api/') ? path : '/api' + path;
    let res;
    try { res = await fetch(url, init); }
    catch (e) { const err = new Error('Could not reach the server. Check your connection and try again.'); err.status = 0; throw err; }
    const ct = res.headers.get('content-type') || '';
    const data = ct.includes('json') ? await res.json().catch(() => ({})) : await res.text().catch(() => '');
    if (!res.ok) {
      const err = new Error((data && data.error) || (res.status === 403 ? 'You are not allowed to do that.' : 'Something went wrong.'));
      err.status = res.status; err.data = data;
      if (res.status === 401 && App.me && !/^\/(login|setup|logout)/.test(path)) { App.me = null; showLogin('Your session ended. Please log in again.'); }
      throw err;
    }
    return data;
  };
  App.apiUpload = (path, formData, method) => App.api(path, { method: method || 'POST', body: formData });

  // ---------------------------------------------------------------- roles
  App.isAdmin = () => !!App.me && App.me.role === 'admin';
  App.isDemo = () => !!App.publicSettings.demo;

  // ---------------------------------------------------------------- toast, modal
  App.toast = function (msg, kind) {
    const box = $('toasts');
    const t = document.createElement('div');
    t.className = 'toast ' + (kind || '');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => t.remove(), kind === 'error' ? 7000 : 3500);
  };

  App.modal = function (opts) {
    const prevFocus = document.activeElement;
    const overlay = document.createElement('div');
    overlay.className = 'overlay shown';
    const box = document.createElement('div');
    box.className = 'modal' + (opts.wide ? ' wide' : '');
    box.setAttribute('role', 'dialog');
    box.setAttribute('aria-modal', 'true');
    const tid = 'mt' + Math.random().toString(36).slice(2, 8);
    box.setAttribute('aria-labelledby', tid);
    box.innerHTML = `<h2 id="${tid}">${App.esc(opts.title || '')}</h2><div class="modal-body"></div><div class="modal-actions"></div>`;
    const body = box.querySelector('.modal-body');
    if (opts.body instanceof Node) body.appendChild(opts.body); else body.innerHTML = opts.body || '';
    const actions = box.querySelector('.modal-actions');
    overlay.appendChild(box);
    document.body.appendChild(overlay);
    const ctl = { el: box, body };
    const onKey = (e) => {
      if (e.key === 'Escape') { e.stopPropagation(); ctl.close(); }
      if (e.key === 'Tab') {
        const f = [...box.querySelectorAll('a[href],button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled)')].filter((x) => x.offsetParent !== null);
        if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    ctl.close = function () {
      document.removeEventListener('keydown', onKey, true);
      overlay.remove();
      if (prevFocus && prevFocus.focus) try { prevFocus.focus(); } catch (e) { /* ignore */ }
      if (opts.onClose) opts.onClose();
    };
    (opts.buttons || [{ label: 'Close' }]).forEach((b) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.textContent = b.label;
      if (b.kind) btn.className = b.kind;
      btn.addEventListener('click', async () => {
        if (!b.onClick) { ctl.close(); return; }
        btn.disabled = true;
        try { const r = await b.onClick(ctl); if (r !== false) ctl.close(); }
        catch (e) { App.toast(e.message || 'Something went wrong.', 'error'); }
        finally { btn.disabled = false; }
      });
      actions.appendChild(btn);
    });
    overlay.addEventListener('mousedown', (e) => { if (e.target === overlay) ctl.close(); });
    setTimeout(() => {
      const first = box.querySelector('input:not([type=hidden]),select,textarea') || actions.querySelector('button.primary') || actions.querySelector('button');
      if (first) first.focus();
    }, 0);
    return ctl;
  };

  App.confirm = function (message, o = {}) {
    return new Promise((resolve) => {
      let done = false;
      const finish = (v) => { if (!done) { done = true; resolve(v); } };
      App.modal({
        title: o.title || 'Are you sure?',
        body: `<p style="margin:0">${App.esc(message)}</p>`,
        onClose: () => finish(false),
        buttons: [
          { label: o.cancelLabel || 'Cancel' },
          { label: o.okLabel || 'OK', kind: o.danger ? 'danger' : 'primary', onClick: () => { finish(true); } },
        ],
      });
    });
  };

  // ---------------------------------------------------------------- script / css loading, leave hooks
  const loaded = {};
  App.loadScript = function (src) {
    if (!loaded[src]) {
      loaded[src] = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = src;
        s.onload = () => resolve();
        s.onerror = () => { delete loaded[src]; reject(new Error('Could not load ' + src)); };
        document.head.appendChild(s);
      });
    }
    return loaded[src];
  };
  App.loadCss = function (href) {
    if (document.querySelector(`link[data-app-css="${href}"]`)) return Promise.resolve();
    return new Promise((resolve) => {
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = href; l.dataset.appCss = href;
      l.onload = () => resolve(); l.onerror = () => resolve();
      document.head.appendChild(l);
    });
  };
  let leaveFns = [];
  App.onLeave = (fn) => { leaveFns.push(fn); };
  function runLeave() { const f = leaveFns; leaveFns = []; f.forEach((fn) => { try { fn(); } catch (e) { console.error(e); } }); }

  // ---------------------------------------------------------------- badges
  const RISK = {
    not_significant: 'Not significant',
    significant_controlled: 'Significant but effectively controlled',
    significant_not_controlled: 'Significant and not effectively controlled',
    uncertain: 'Uncertain',
  };
  const RISK_SHORT = {
    not_significant: 'Not significant',
    significant_controlled: 'Significant, controlled',
    significant_not_controlled: 'Significant, not controlled',
    uncertain: 'Uncertain',
  };
  App.RISK_LEVELS = Object.keys(RISK);
  App.riskLabel = (level) => RISK[level] || 'No assessment';
  App.riskBadge = function (level, short) {
    if (!level) return '<span class="badge none">No assessment</span>';
    return `<span class="badge risk-${App.esc(level)}${short ? '' : ' wrap'}">${App.esc((short ? RISK_SHORT : RISK)[level] || level)}</span>`;
  };
  const REVIEW = { overdue: 'Overdue', due_soon: 'Due soon', ok: 'In date', no_sds: 'No SDS', unknown: 'No issue date' };
  App.reviewLabel = (s) => REVIEW[s] || 'Unknown';
  App.reviewBadge = function (status, date) {
    const label = REVIEW[status] || 'Unknown';
    const showDate = date && (status === 'overdue' || status === 'due_soon' || status === 'ok');
    return `<span class="badge ${App.esc(status || 'unknown')}">${App.esc(label)}${showDate ? ' · ' + App.esc(App.fmtDate(date)) : ''}</span>`;
  };
  App.decisionLabel = (d) => d === 'hazardous' ? 'Hazardous' : d === 'not_hazardous' ? 'Not hazardous' : 'Not classified yet';
  App.decisionBadge = (d) => `<span class="badge dec-${d || 'none'}">${App.decisionLabel(d)}</span>`;

  // Fallbacks; views/pictograms.js replaces these with the real images.
  App.pictogramImg = App.pictogramImg || (() => "");
  App.pictogramRow = App.pictogramRow || (() => "");
  // A small marker for a value an admin has overridden (shown wherever the effective value is shown in a list).
  App.overrideMark = (on, what) => on ? `<span class="ovr" title="An admin overrode the ${what} that the classification gives">overridden</span>` : "";

  // ---------------------------------------------------------------- disclaimer, branding, print
  App.disclaimerHtml = function () {
    const d = window.DISCLAIMER || { title: 'Important', points: ['This register is a guide only. The supplier\'s current SDS is the authority.'] };
    return `<aside class="disclaimer" role="note"><strong>${App.esc(d.title || 'Important')}</strong><ul>${(d.points || []).map((p) => `<li>${App.esc(p)}</li>`).join('')}</ul></aside>`;
  };
  App.companyName = () => App.publicSettings.company_name || 'SDS EZY';
  App.brandMarkHtml = function () {
    const ps = App.publicSettings;
    if (ps.has_logo) return `<span class="brand-fallback"><img class="brand-logo" src="/api/logo?v=${encodeURIComponent(ps.logo_version || '')}" alt=""><span>${App.esc(App.companyName())}</span></span>`;
    return `<span class="brand-fallback"><span class="w-mark" aria-hidden="true"></span><span>${App.esc(App.companyName())}</span></span>`;
  };
  App.printHeaderHtml = function () {
    const c = App.settings || {};
    const lines = [c.company_address, [c.company_phone, c.company_email].filter(Boolean).join(' · '), c.company_reg ? 'ABN / Reg: ' + c.company_reg : '']
      .filter(Boolean).map(App.esc).join('<br>');
    return `<div class="print-brand">${App.brandMarkHtml()}<div class="print-company"><strong>${App.esc(App.companyName())}</strong>${lines ? '<br>' + lines : ''}</div></div>`;
  };
  App.print = function (html, o = {}) {
    $('printArea').innerHTML = html;
    $('pageStyle').textContent = o.landscape ? '@page { size: landscape; margin: 10mm; }' : '@page { margin: 12mm; }';
    window.print();
  };
  window.addEventListener('afterprint', () => { $('printArea').textContent = ''; $('pageStyle').textContent = ''; });

  // ---------------------------------------------------------------- downloads and CSV
  App.csv = function (rows) {
    const q = (v) => { const s = v === null || v === undefined ? '' : String(v); return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    return '﻿' + rows.map((r) => r.map(q).join(',')).join('\r\n') + '\r\n';
  };
  App.download = function (filename, data, mime) {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mime || 'application/octet-stream' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };

  // ---------------------------------------------------------------- states
  App.loadingHtml = (msg) => `<div class="loading" role="status">${App.esc(msg || 'Loading...')}</div>`;
  App.errorHtml = (msg) => `<div class="error-state" role="alert"><h2>That did not work</h2><p>${App.esc(msg || 'Something went wrong.')}</p><button type="button" data-retry>Try again</button></div>`;
  App.showError = function (root, err, retry) {
    root.innerHTML = App.errorHtml(err && err.message);
    const b = root.querySelector('[data-retry]');
    if (b) b.addEventListener('click', retry || (() => route()));
  };

  // ---------------------------------------------------------------- theme
  const DEFAULT_MAIN = '#1F2A24', DEFAULT_ACCENT = '#3B6E71';
  const hexToRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const rgbToHex = (r) => '#' + r.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('').toUpperCase();
  function luminance(hex) {
    const [r, g, b] = hexToRgb(hex).map((v) => v / 255).map((c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  }
  function contrastRatio(a, b) { const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); }
  function mixHex(a, b, t) { const x = hexToRgb(a), y = hexToRgb(b); return rgbToHex(x.map((v, i) => v * t + y[i] * (1 - t))); }
  const readableOn = (hex) => contrastRatio(hex, '#FFFFFF') >= contrastRatio(hex, '#111111') ? '#FFFFFF' : '#111111';
  function applyTheme(main, accent) {
    main = /^#[0-9a-f]{6}$/i.test(main) ? main : DEFAULT_MAIN;
    accent = /^#[0-9a-f]{6}$/i.test(accent) ? accent : DEFAULT_ACCENT;
    const on = readableOn(main);
    const root = document.documentElement.style;
    root.setProperty('--main', main);
    root.setProperty('--on-main', on);
    root.setProperty('--on-main-soft', mixHex(on, main, 0.78));
    root.setProperty('--on-main-faint', mixHex(on, main, 0.6));
    root.setProperty('--on-main-line', mixHex(on, main, 0.3));
    root.setProperty('--on-main-active', on === '#FFFFFF' ? 'rgba(255,255,255,0.14)' : 'rgba(0,0,0,0.10)');
    root.setProperty('--office', accent);
    root.setProperty('--office-bg', mixHex(accent, '#FFFFFF', 0.12));
  }
  App.theme = { applyTheme, contrastRatio, readableOn, mixHex, DEFAULT_MAIN, DEFAULT_ACCENT };

  App.refreshBranding = function () {
    applyTheme(App.publicSettings.main_color, App.publicSettings.accent_color);
    document.title = App.companyName();
    $('appHeader').innerHTML = `<a href="#/review" style="text-decoration:none">${App.brandMarkHtml()}</a><button type="button" class="menu-btn" id="menuBtn" aria-expanded="false" aria-controls="sidebar">Menu</button>`;
    $('loginBrand').innerHTML = App.brandMarkHtml();
    $('menuBtn').addEventListener('click', () => toggleMenu());
  };
  App.refreshSettings = async function () {
    App.publicSettings = await App.api('/public-settings');
    if (App.me) App.settings = await App.api('/settings');
    App.refreshBranding();
  };

  // ---------------------------------------------------------------- views and router
  const norm = (n) => String(n).toLowerCase().replace(/[^a-z0-9]/g, '');
  const views = {};
  App.views = {
    register(name, def) { views[norm(name)] = def; },
    get(name) { return views[norm(name)]; },
  };
  App.navigate = function (hash) {
    if (location.hash === hash) route(); else location.hash = hash;
  };

  const NAV = [
    { href: '#/review', label: 'Review', key: 'review' },
    { href: '#/register', label: 'Register', key: 'register' },
    { href: '#/hazardous', label: 'Hazardous', key: 'hazardous' },
    { href: '#/manifest', label: 'Manifest', key: 'manifest' },
    { href: '#/upload', label: 'Upload SDS', key: 'upload' },
    { href: '#/take-away', label: 'Take-away', key: 'takeaway' },
    { head: 'Admin', admin: true },
    { href: '#/import', label: 'Import', key: 'import', admin: true },
    { href: '#/options', label: 'Options', key: 'options', admin: true },
    { href: '#/users', label: 'Users', key: 'users', admin: true },
    { href: '#/settings', label: 'Settings', key: 'settings', admin: true },
  ];
  function renderNav(activeKey) {
    const items = NAV.filter((n) => !n.admin || App.isAdmin());
    $('sidebar').innerHTML = items.map((n) => n.head
      ? `<div class="navhead">${n.head}</div>`
      : `<a class="navlink" href="${n.href}"${n.key === activeKey ? ' aria-current="page"' : ''}>${n.label}</a>`).join('')
      + `<div class="navhead">Help</div><a class="navlink" href="help.html" target="_blank" rel="noopener">Help</a>`
      + `<div class="who"><div>${App.esc(App.me.name)} (${App.me.role})</div><button type="button" id="logoutBtn">Log out</button></div>`;
    $('logoutBtn').addEventListener('click', logout);
  }
  function toggleMenu(force) {
    const nav = $('sidebar');
    const open = force === undefined ? !nav.classList.contains('open') : force;
    nav.classList.toggle('open', open);
    const b = $('menuBtn'); if (b) b.setAttribute('aria-expanded', String(open));
  }

  function parseHash() {
    const raw = location.hash.replace(/^#\/?/, '');
    const [path, qs] = raw.split('?');
    const segs = path.split('/').filter(Boolean).map((s) => { try { return decodeURIComponent(s); } catch (e) { return s; } });
    const query = {};
    new URLSearchParams(qs || '').forEach((v, k) => { query[k] = v; });
    return { segs, query };
  }
  function resolve(segs, query) {
    if (!segs.length) return { view: 'review', key: 'review', params: { query } };
    if (segs[0] === 'chemical' && segs[1]) {
      const id = segs[1];
      if (segs[2] === 'label') return { view: 'label', key: 'register', params: { id, query } };
      if (segs[2] === 'edit') return { view: 'chemical', key: 'register', params: { id, edit: true, query } };
      return { view: 'chemical', key: 'register', params: { id, query } };
    }
    return { view: segs[0], key: norm(segs[0]), params: { query } };
  }

  let routeToken = 0;
  async function route() {
    if (!App.me) return;
    toggleMenu(false);
    const token = ++routeToken;
    runLeave();
    $('printArea').textContent = '';
    const { segs, query } = parseHash();
    const r = resolve(segs, query);
    const main = $('main');
    renderNav(r.key);
    if (norm(r.view) === 'help') { window.open('help.html', '_blank', 'noopener'); history.replaceState(null, '', '#/review'); return route(); }
    const def = App.views.get(r.view);
    const root = document.createElement('div');
    main.replaceChildren(root);
    window.scrollTo(0, 0);
    if (!def) {
      const known = segs.length === 0 || NAV.some((n) => n.key === r.key) || r.view === 'label';
      root.innerHTML = `<div class="empty-state"><h2>${known ? 'This screen is not available' : 'Page not found'}</h2><p>${known ? 'It could not be loaded. Try reloading the page.' : 'That address does not match anything here.'}</p><a class="btn primary" href="#/review">Go to the review list</a></div>`;
      document.title = App.companyName();
      return;
    }
    if (def.adminOnly && !App.isAdmin()) {
      root.innerHTML = '<div class="empty-state"><h2>Admins only</h2><p>Only an admin can open this screen.</p><a class="btn primary" href="#/review">Go to the review list</a></div>';
      return;
    }
    document.title = (def.title ? def.title + ' - ' : '') + App.companyName();
    try {
      await def.render(root, r.params);
    } catch (err) {
      if (token !== routeToken) return;
      console.error(err);
      App.showError(root, err, () => route());
    }
    if (token === routeToken) { try { main.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
  }
  App.route = route;
  window.addEventListener('hashchange', route);

  // ---------------------------------------------------------------- login screens
  let setupMode = false, codeStepOn = false, loginChallenge = null;
  function updateDemoRow() {
    const logins = App.publicSettings.demo_logins || [];
    const show = App.publicSettings.demo && logins.length && !setupMode && !codeStepOn;
    $('demoRow').style.display = show ? 'block' : 'none';
    $('demoBtns').innerHTML = logins.map((d, i) => `<button type="button" data-demo="${i}">Try the demo as ${App.esc(d.label || d.role)}</button>`).join('');
  }
  App.DEMO_PASSWORD = 'demo-Ezy-2026'; // the public demo password seeded by scripts/make-demo.mjs
  function showLogin(msg) {
    $('loginScreen').style.display = 'flex';
    $('app').classList.remove('shown');
    if (msg) $('loginError').textContent = msg;
  }
  function showCodeStep(result) {
    loginChallenge = result ? result.challenge : null;
    const on = !!result;
    codeStepOn = on;
    updateDemoRow();
    $('codeForm').style.display = on ? 'block' : 'none';
    ['loginTitle', 'loginSub', 'loginForm', 'setupLinkRow'].forEach((id) => { $(id).style.display = on ? 'none' : ''; });
    if (!on) $('setupLinkRow').style.display = App.publicSettings.needs_setup ? 'block' : 'none';
    if (on) {
      $('codeSub').textContent = `We have emailed a 6-digit code to ${result.sent_to}. It works for 10 minutes.`;
      $('loginCode').value = ''; $('codeError').textContent = ''; $('loginCode').focus();
    }
  }
  function wireLogin() {
    $('toggleSetup').addEventListener('click', (e) => {
      e.preventDefault();
      setupMode = !setupMode;
      $('setupExtraFields').style.display = setupMode ? 'block' : 'none';
      $('setupKeyRow').style.display = App.publicSettings.setup_key_required ? 'block' : 'none';
      $('loginTitle').textContent = setupMode ? 'Create admin account' : 'Log in';
      $('loginSub').textContent = setupMode
        ? (App.publicSettings.setup_key_required ? 'One-time setup. Ask whoever hosts this app for the setup key.' : 'One-time setup. You are creating the first administrator account.')
        : 'Enter your email and password.';
      $('loginSubmit').textContent = setupMode ? 'Create account' : 'Log in';
      e.target.textContent = setupMode ? 'Back to log in' : 'First time setting this up? Create the admin account';
      updateDemoRow();
    });
    $('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = $('loginEmail').value, password = $('loginPassword').value;
      const errEl = $('loginError'); errEl.textContent = '';
      try {
        if (setupMode) {
          await App.api('/setup', { method: 'POST', body: { setup_key: $('setupKey').value, name: $('setupName').value, email, password } });
          $('toggleSetup').click();
        }
        const result = await App.api('/login', { method: 'POST', body: { email, password } });
        if (result.needs_code) { showCodeStep(result); return; }
        await boot();
      } catch (err) { errEl.textContent = err.message; }
    });
    $('demoRow').addEventListener('click', async (e) => {
      const b = e.target.closest('[data-demo]'); if (!b) return;
      const d = (App.publicSettings.demo_logins || [])[+b.dataset.demo];
      $('loginError').textContent = '';
      try { await App.api('/login', { method: 'POST', body: { email: d.email, password: App.DEMO_PASSWORD } }); await boot(); }
      catch (err) { $('loginError').textContent = err.message; }
    });
    $('codeBack').addEventListener('click', (e) => { e.preventDefault(); showCodeStep(null); });
    $('codeForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      $('codeError').textContent = '';
      try {
        await App.api('/login/verify', { method: 'POST', body: { challenge: loginChallenge, code: $('loginCode').value } });
        showCodeStep(null);
        await boot();
      } catch (err) { $('codeError').textContent = err.message; }
    });
  }
  async function logout() {
    try { await App.api('/logout', { method: 'POST' }); } catch (e) { /* ignore */ }
    location.reload();
  }

  // ---------------------------------------------------------------- boot
  async function boot() {
    try { App.publicSettings = await App.api('/public-settings'); }
    catch (e) { App.publicSettings = { company_name: '', has_logo: false, needs_setup: false }; }
    App.refreshBranding();
    $('setupLinkRow').style.display = App.publicSettings.needs_setup ? 'block' : 'none';
    updateDemoRow();
    try { App.me = await App.api('/me'); }
    catch (e) { App.me = null; showLogin(); return; }
    try { App.settings = await App.api('/settings'); } catch (e) { App.settings = {}; }
    $('loginScreen').style.display = 'none';
    $('app').classList.add('shown');
    $('demoBanner').style.display = App.publicSettings.demo ? 'block' : 'none';
    const h = parseHash();
    if (App.isAdmin() && App.settings.setup_complete === false && !h.segs.length && !App.publicSettings.demo) {
      history.replaceState(null, '', '#/welcome');
    }
    await route();
  }

  let started = false;
  App.start = function () {
    if (started) return Promise.resolve();
    started = true;
    wireLogin();
    return Promise.resolve(App.ghsReady).catch((e) => console.error(e)).then(boot);
  };
})();
