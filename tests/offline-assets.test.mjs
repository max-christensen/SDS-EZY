import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { inflateSync } from 'node:zlib';
import { computeVersion, shellFiles, render, listFiles } from '../scripts/bump-version.mjs';
import { drawIcon, readBars, ICONS } from '../scripts/make-icons.mjs';

const pub = (f) => new URL('../public/' + f, import.meta.url);

test('manifest is installable: name, start_url, scope, standalone, 192 and 512 icons and a maskable one that exist', () => {
  const m = JSON.parse(readFileSync(pub('manifest.webmanifest'), 'utf8'));
  assert.equal(m.name, 'SDS EZY');
  assert.ok(m.short_name);
  assert.equal(m.start_url, '/');
  assert.equal(m.scope, '/');
  assert.equal(m.display, 'standalone');
  assert.match(m.background_color, /^#[0-9a-f]{6}$/i);
  assert.match(m.theme_color, /^#[0-9a-f]{6}$/i);
  const sizes = m.icons.map((i) => i.sizes + ':' + i.purpose);
  assert.ok(sizes.includes('192x192:any') && sizes.includes('512x512:any') && sizes.includes('512x512:maskable'));
  for (const i of m.icons) {
    const png = readFileSync(pub(i.src.slice(1)));
    assert.equal(png.subarray(1, 4).toString(), 'PNG');
    const [w] = i.sizes.split('x').map(Number);
    assert.equal(png.readUInt32BE(16), w);
    assert.equal(png.readUInt32BE(20), w);
  }
});

test('theme colours in the manifest match the app (--bg and --main in app.css)', () => {
  const css = readFileSync(pub('app.css'), 'utf8');
  const m = JSON.parse(readFileSync(pub('manifest.webmanifest'), 'utf8'));
  assert.equal(m.background_color.toLowerCase(), /--bg:\s*(#[0-9a-f]{6})/i.exec(css)[1].toLowerCase());
  assert.equal(m.theme_color.toLowerCase(), /--main:\s*(#[0-9a-f]{6})/i.exec(css)[1].toLowerCase());
});

test('icons are drawn deterministically and the mark stays inside the maskable safe zone', () => {
  const bars = readBars(readFileSync(pub('logo-mark.svg'), 'utf8'));
  assert.equal(bars.length, 3);
  assert.deepEqual(drawIcon(64, 0.5, bars), drawIcon(64, 0.5, bars));
  // committed files equal what the script draws now
  for (const i of ICONS) assert.deepEqual(readFileSync(pub('icons/' + i.file)), drawIcon(i.size, i.width, bars), i.file + ' is out of date: run node scripts/make-icons.mjs');
  // decode the maskable icon: no light pixel outside the central 80% circle
  const png = readFileSync(pub('icons/icon-maskable-512.png'));
  const size = png.readUInt32BE(16);
  let idat = Buffer.alloc(0), p = 8;
  while (p < png.length) { const len = png.readUInt32BE(p), type = png.toString('ascii', p + 4, p + 8); if (type === 'IDAT') idat = Buffer.concat([idat, png.subarray(p + 8, p + 8 + len)]); p += 12 + len; }
  const raw = inflateSync(idat);
  const r = size * 0.4;
  for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
    const v = raw[y * (size * 3 + 1) + 1 + x * 3];
    if (v > 0x40) assert.ok(Math.hypot(x - size / 2, y - size / 2) <= r, `light pixel outside the safe zone at ${x},${y}`);
  }
});

test('_headers makes the worker, the version file and the manifest no-cache', () => {
  const h = readFileSync(pub('_headers'), 'utf8');
  for (const p of ['/sw.js', '/app-version.js', '/manifest.webmanifest']) assert.match(h, new RegExp('^' + p.replace(/[.]/g, '\\.') + '\\n\\s+Cache-Control: no-cache', 'm'));
});

function tree(files) {
  const dir = mkdtempSync(join(tmpdir(), 'ezy-ver-'));
  for (const [f, c] of Object.entries(files)) { mkdirSync(join(dir, f, '..'), { recursive: true }); writeFileSync(join(dir, f), c); }
  return dir;
}

test('version is a stable content hash: ignores app-version.js, OS noise and line endings; changes with any file', () => {
  const base = { 'index.html': '<p>a\n</p>', 'app.js': 'x', 'lib/a.js': 'y', 'sw.js': 's' };
  const d1 = tree(base);
  const v = computeVersion(d1);
  assert.match(v, /^[0-9a-f]{16}$/);
  assert.equal(computeVersion(d1), v);
  assert.equal(computeVersion(tree({ ...base, 'app-version.js': 'self.APP_VERSION="zzz"', '.DS_Store': 'q', 'lib/Thumbs.db': 'q' })), v);
  assert.equal(computeVersion(tree({ ...base, 'index.html': '<p>a\r\n</p>' })), v, 'CRLF does not change it');
  assert.notEqual(computeVersion(tree({ ...base, 'lib/a.js': 'y2' })), v);
  assert.notEqual(computeVersion(tree({ ...base, 'lib/b.js': 'z' })), v);
  assert.notEqual(computeVersion(tree({ ...base, 'sw.js': 's2' })), v, 'the worker itself is part of the version');
  rmSync(d1, { recursive: true, force: true });
});

test('shell list: app files and icons yes; vendor, sw.js, _headers and licences no; index.html is "/"', () => {
  const d = tree({ 'index.html': 'i', 'app.js': 'a', 'sw.js': 's', '_headers': 'h', 'vendor/big.js': 'v', 'vendor/LICENSES.txt': 'l', 'views/a.js': 'a', 'icons/x.png': 'p', 'lib/ghs-ref.mjs': 'g', 'pictograms/flame.gif': 'f' });
  assert.deepEqual(shellFiles(d), ['/', '/app-version.js', '/app.js', '/icons/x.png', '/lib/ghs-ref.mjs', '/pictograms/flame.gif', '/views/a.js']);
  const text = render(d);
  assert.match(text, /^self\.APP_VERSION = "[0-9a-f]{16}";\n/);
  const ctx = { self: {} };
  new Function('self', text)(ctx.self);
  assert.equal(ctx.self.APP_SHELL.length, 7);
});

test('the real public/ tree: the shell list names only files that exist', () => {
  const have = new Set(listFiles().map((f) => '/' + f));
  for (const u of shellFiles()) if (u !== '/' && u !== '/app-version.js') assert.ok(have.has(u), u);
  assert.ok(shellFiles().includes('/lib/ghs-ref.mjs'));
});
