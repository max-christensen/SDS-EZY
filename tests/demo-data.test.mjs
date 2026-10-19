// Validates the generated fictional demo: loads demo.sql into an in-memory SQLite after schema.sql.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { pbkdf2Sync } from 'node:crypto';
import { build } from '../scripts/make-demo.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TODAY = '2026-10-19';

let DatabaseSync = null;
try { ({ DatabaseSync } = await import('node:sqlite')); } catch { /* handled below */ }
const skip = DatabaseSync ? false : 'node:sqlite is not available in this Node version; demo SQL tests skipped (use Node 22.5+)';

const out = mkdtempSync(join(tmpdir(), 'sdsezy-demo-'));
const summary = await build({ today: TODAY, outDir: out });
process.on('exit', () => { try { rmSync(out, { recursive: true, force: true }); } catch { /* ignore */ } });

function openDb() {
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON');
  db.exec(readFileSync(join(ROOT, 'schema.sql'), 'utf8'));
  db.exec(readFileSync(join(out, 'demo.sql'), 'utf8'));
  return db;
}
const all = (db, sql, ...p) => db.prepare(sql).all(...p);
const one = (db, sql, ...p) => db.prepare(sql).get(...p);

test('demo.sql loads and is idempotent (clears then reloads)', { skip }, () => {
  const db = openDb();
  db.exec(readFileSync(join(out, 'demo.sql'), 'utf8'));
  assert.equal(one(db, 'SELECT COUNT(*) n FROM chemicals').n, summary.chemicals);
  assert.deepEqual(all(db, 'PRAGMA foreign_key_check'), []);
});

test('about 60 chemicals, hazardous and non-hazardous, one without SDS, one without a decision', { skip }, () => {
  const db = openDb();
  const n = one(db, 'SELECT COUNT(*) n FROM chemicals').n;
  assert.ok(n >= 55 && n <= 70, 'chemical count ' + n);
  assert.ok(one(db, "SELECT COUNT(*) n FROM chemicals WHERE decision='hazardous'").n >= 20);
  assert.ok(one(db, "SELECT COUNT(*) n FROM chemicals WHERE decision='not_hazardous'").n >= 10);
  assert.equal(one(db, 'SELECT COUNT(*) n FROM chemicals WHERE sds_id IS NULL').n, 1);
  assert.equal(one(db, 'SELECT COUNT(*) n FROM chemicals WHERE decision IS NULL').n, 1);
});

test('shared SDS: ten-product plaster sheet and four-pack-size adhesive sheet', { skip }, () => {
  const db = openDb();
  const shared = all(db, 'SELECT sds_id, COUNT(*) n FROM chemicals WHERE sds_id IS NOT NULL GROUP BY sds_id HAVING n > 1');
  const counts = shared.map(r => r.n).sort((a, b) => a - b);
  assert.ok(counts.includes(10) && counts.includes(4), 'shared counts ' + counts);
  assert.ok(counts.length >= 3);
});

test('review statuses: overdue, due soon, ok, unknown, no_sds', { skip }, () => {
  const db = openDb();
  const soon = '2027-01-17'; // today + 90 days
  const overdue = one(db, 'SELECT COUNT(*) n FROM chemicals WHERE review_due < ?', TODAY).n;
  const dueSoon = one(db, 'SELECT COUNT(*) n FROM chemicals WHERE review_due >= ? AND review_due <= ?', TODAY, soon).n;
  assert.ok(overdue >= 4, 'overdue ' + overdue);
  assert.ok(dueSoon >= 3, 'due soon ' + dueSoon);
  assert.equal(overdue, summary.review.overdue);
  assert.equal(dueSoon, summary.review.due_soon);
  assert.equal(one(db, 'SELECT COUNT(*) n FROM chemicals WHERE sds_id IS NOT NULL AND review_due IS NULL').n, 1);
});

test('review_due is exactly five years after issue_date; SDS issue dates vary', { skip }, () => {
  const db = openDb();
  for (const r of all(db, 'SELECT id, issue_date, review_due FROM sds WHERE issue_date IS NOT NULL')) {
    assert.equal(r.review_due, String(Number(r.issue_date.slice(0, 4)) + 5) + r.issue_date.slice(4), 'sds ' + r.id);
  }
  const years = new Set(all(db, 'SELECT substr(issue_date,1,4) y FROM sds WHERE issue_date IS NOT NULL').map(r => r.y));
  assert.ok(years.size >= 5);
});

test('each risk level is represented several times', { skip }, () => {
  const db = openDb();
  for (const lvl of ['not_significant', 'significant_controlled', 'significant_not_controlled', 'uncertain']) {
    const n = one(db, 'SELECT COUNT(*) n FROM chemicals WHERE risk_level = ?', lvl).n;
    assert.ok(n >= 3, `${lvl}: ${n}`);
  }
});

test('summary columns match the current SDS and current assessment', { skip }, () => {
  const db = openDb();
  const bad = all(db, `SELECT c.id FROM chemicals c JOIN sds s ON s.id = c.sds_id
    WHERE s.is_current != 1 OR c.sds_issue_date IS NOT s.issue_date OR c.review_due IS NOT s.review_due
       OR c.dg_class IS NOT s.dg_class OR c.signal_word IS NOT s.signal_word OR c.pictograms IS NOT s.pictograms`);
  assert.deepEqual(bad, []);
  const badRisk = all(db, `SELECT c.id FROM chemicals c LEFT JOIN assessments a ON a.chemical_id = c.id AND a.is_current = 1
    WHERE c.risk_level IS NOT a.risk_level`);
  assert.deepEqual(badRisk, []);
  assert.deepEqual(all(db, 'SELECT chemical_id FROM assessments WHERE is_current = 1 GROUP BY chemical_id HAVING COUNT(*) > 1'), []);
  const noCurrent = all(db, 'SELECT id, product_name FROM chemicals WHERE sds_id IS NOT NULL AND id NOT IN (SELECT chemical_id FROM assessments WHERE is_current = 1)');
  assert.deepEqual(noCurrent, []);
});

test('search_text is lower-case and holds name, supplier, codes and CAS', { skip }, () => {
  const db = openDb();
  for (const r of all(db, 'SELECT product_name, supplier, product_codes, search_text, sds_id FROM chemicals')) {
    assert.equal(r.search_text, r.search_text.toLowerCase());
    assert.ok(r.search_text.includes(r.product_name.toLowerCase()));
    if (r.supplier) assert.ok(r.search_text.includes(r.supplier.toLowerCase()));
    if (r.product_codes) assert.ok(r.search_text.includes(r.product_codes.toLowerCase()));
  }
  const acetone = one(db, "SELECT search_text FROM chemicals WHERE product_name LIKE '%Acetone%'");
  assert.ok(acetone.search_text.includes('67-64-1'));
});

test('SDS version history: v1 replaced by v2, chemical points at v2', { skip }, () => {
  const db = openDb();
  const docs = all(db, 'SELECT doc_key, COUNT(*) n FROM sds GROUP BY doc_key HAVING n > 1');
  assert.ok(docs.length >= 1);
  const v = all(db, 'SELECT * FROM sds WHERE doc_key = ? ORDER BY version_no', docs[0].doc_key);
  assert.equal(v[0].is_current, 0); assert.ok(v[0].replaced_at);
  assert.equal(v[1].is_current, 1);
  assert.equal(one(db, 'SELECT COUNT(*) n FROM chemicals WHERE sds_id = ?', v[1].id).n, 1);
  assert.equal(one(db, 'SELECT COUNT(*) n FROM chemicals WHERE sds_id = ?', v[0].id).n, 0);
  assert.equal(one(db, 'SELECT COUNT(*) n FROM assessments WHERE sds_id = ? AND is_current = 0', v[0].id).n, 1);
});

test('manifest query returns class totals in L and kg', { skip }, () => {
  const db = openDb();
  const totals = all(db, `SELECT COALESCE(NULLIF(c.dg_class,''),'Unclassified') AS dg_class,
      SUM(CASE WHEN l.unit='L' THEN l.quantity ELSE 0 END) AS litres,
      SUM(CASE WHEN l.unit='kg' THEN l.quantity ELSE 0 END) AS kg
    FROM storage_locations l JOIN chemicals c ON c.id = l.chemical_id
    WHERE c.decision = 'hazardous' GROUP BY 1 ORDER BY 1`);
  const classes = totals.map(t => t.dg_class);
  for (const k of ['2.1', '2.2', '3', '5.1', '8', '9', 'Unclassified']) assert.ok(classes.includes(k), 'missing class ' + k + ' in ' + classes);
  const cls3 = totals.find(t => t.dg_class === '3');
  assert.ok(cls3.litres > 100);
  assert.ok(totals.find(t => t.dg_class === '2.1').kg > 0, 'LPG/acetylene in kg');
  assert.ok(totals.find(t => t.dg_class === 'Unclassified').kg > 50);
  // locations belong to chemicals, several chemicals have more than one location
  assert.ok(one(db, 'SELECT COUNT(*) n FROM (SELECT chemical_id FROM storage_locations GROUP BY chemical_id HAVING COUNT(*) > 1)').n >= 5);
});

test('assessment controls resolve to seeded options', { skip }, () => {
  const db = openDb();
  const n = one(db, 'SELECT COUNT(*) n FROM assessment_controls').n;
  assert.ok(n > 150, 'controls ' + n);
  assert.equal(one(db, 'SELECT COUNT(*) n FROM assessment_controls WHERE option_id IS NULL').n, 0);
});

test('demo logins use the app PBKDF2 format and verify', { skip }, async () => {
  const db = openDb();
  const users = all(db, 'SELECT email, role, password_hash FROM users ORDER BY id');
  assert.deepEqual(users.map(u => [u.email, u.role]), [['demo-admin@example.invalid', 'admin'], ['demo-user@example.invalid', 'user']]);
  const { DEMO_PASSWORD } = await import('../scripts/demo/data.mjs');
  for (const u of users) {
    const [it, salt, hash] = u.password_hash.split(':');
    assert.equal(it, '100000');
    const d = pbkdf2Sync(DEMO_PASSWORD, Buffer.from(salt, 'base64url'), 100000, 32, 'sha256');
    assert.equal(d.toString('base64url'), hash);
    assert.equal(Buffer.from(salt, 'base64url').length, 16);
  }
  const s = Object.fromEntries(all(db, 'SELECT key, value FROM settings').map(r => [r.key, r.value]));
  assert.equal(s.setup_complete, '1');
  assert.ok(s.company_name && s.main_color);
});

test('every PDF exists, starts with %PDF, is small and extractable text says FICTIONAL', async () => {
  const db = skip ? null : openDb();
  const { readdirSync, statSync } = await import('node:fs');
  const files = readdirSync(join(out, 'pdfs', 'sds'));
  assert.equal(files.length, summary.sds_rows);
  const keys = db ? all(db, 'SELECT r2_key FROM sds').map(r => r.r2_key) : files.map(f => 'sds/' + f);
  for (const k of keys) {
    const p = join(out, 'pdfs', k);
    assert.ok(existsSync(p), k);
    const buf = readFileSync(p);
    assert.equal(buf.subarray(0, 5).toString('latin1'), '%PDF-');
    assert.ok(statSync(p).size > 2000 && statSync(p).size < 60000, k + ' size ' + statSync(p).size);
  }
  // text extraction on one sheet
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(readFileSync(join(out, 'pdfs', keys[0])));
  const pdf = await pdfjs.getDocument({ data, useSystemFonts: true, verbosity: 0 }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) text += (await (await pdf.getPage(i)).getTextContent()).items.map(t => t.str).join(' ') + '\n';
  assert.match(text, /FICTIONAL DEMONSTRATION DOCUMENT/);
  for (let n = 1; n <= 16; n++) assert.ok(text.includes(`SECTION ${n}:`), 'section ' + n);
  assert.match(text, /Hazchem code/);
});

test('no real manufacturer or brand names', { skip }, () => {
  const sql = readFileSync(join(out, 'demo.sql'), 'utf8').toLowerCase();
  const deny = ['dulux', 'wattyl', 'selleys', 'cabot', 'gyprock', 'liquid nails', 'chemset', 'wd-40', 'wd40', 'bostik', 'sika', 'berger', 'taubmans', 'resene', 'british paints',
    'penrite', 'castrol', 'valvoline', 'caltex', 'shell', 'mobil', 'ampol', 'repsol', 'total energies', 'boc', 'air liquide', 'coregas', 'linde', 'bunnings', 'orica', 'nulon', 'aeroguard',
    'organoil', 'sikaflex', 'knauf', 'boral', 'csr', 'hilti', 'ramset', 'fosroc', 'parchem', 'ajax', 'domestos', 'jif', 'harpic', 'zoflora', 'clorox', 'diversey', 'ecolab',
    'rustoleum', 'rust-oleum', 'norglass', 'araldite', 'loctite', 'henkel', '3m', 'dow ', 'basf', 'bayer', 'exxon', 'chevron'];
  const hits = deny.filter(w => new RegExp('(^|[^a-z0-9])' + w.replace(/[-.]/g, '\\$&') + '([^a-z0-9]|$)').test(sql));
  assert.deepEqual(hits, []);
  const mails = sql.match(/[a-z0-9._-]+@[a-z0-9.-]+/g) || [];
  assert.ok(mails.length >= 2 && mails.every(m => m.endsWith('example.invalid')), 'only example.invalid addresses: ' + mails);
});

test('same --today gives the same output (deterministic)', async () => {
  const { createHash } = await import('node:crypto');
  const out2 = mkdtempSync(join(tmpdir(), 'sdsezy-demo2-'));
  try {
    await build({ today: TODAY, outDir: out2 });
    const h = p => createHash('sha256').update(readFileSync(p)).digest('hex');
    assert.equal(h(join(out, 'demo.sql')), h(join(out2, 'demo.sql')));
  } finally { rmSync(out2, { recursive: true, force: true }); }
});

test('dates move with --today so the status counts stay stable', async () => {
  const out3 = mkdtempSync(join(tmpdir(), 'sdsezy-demo3-'));
  try {
    const s = await build({ today: '2027-03-05', outDir: out3 });
    assert.equal(s.review.overdue, summary.review.overdue);
    assert.equal(s.review.due_soon, summary.review.due_soon);
  } finally { rmSync(out3, { recursive: true, force: true }); }
});
