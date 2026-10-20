// Draws the PWA icons from the placeholder three-bar mark (public/logo-mark.svg) in pure node.
// Deterministic: the same script gives the same bytes. Run: node scripts/make-icons.mjs
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'public', 'icons');

// Theme: the app's dark main colour behind, the paper-light colour for the bars (public/app.css --main, --on-main).
export const BACKGROUND = [0x1F, 0x2A, 0x24];
export const MARK = [0xED, 0xEB, 0xE3];

// Bars come from the SVG itself so a new logo mark with the same three bars flows through.
export function readBars(svgText) {
  const d = /<path[^>]*\sd="([^"]+)"/.exec(svgText)?.[1];
  if (!d) throw new Error('logo-mark.svg has no path');
  const bars = [];
  const re = /M\s*([\d.]+)\s+([\d.]+)\s*h\s*([\d.]+)\s*v\s*([\d.]+)/g;
  let m;
  while ((m = re.exec(d))) bars.push({ x: +m[1], y: +m[2], w: +m[3], h: +m[4] });
  if (!bars.length) throw new Error('logo-mark.svg: no bars found');
  return bars;
}

function overlap(a0, a1, b0, b1) { return Math.max(0, Math.min(a1, b1) - Math.max(a0, b0)); }

// size: pixels. widthFraction: how wide the mark is as a share of the icon (smaller for maskable: safe zone).
export function drawIcon(size, widthFraction, bars) {
  const minX = Math.min(...bars.map((b) => b.x)), maxX = Math.max(...bars.map((b) => b.x + b.w));
  const minY = Math.min(...bars.map((b) => b.y)), maxY = Math.max(...bars.map((b) => b.y + b.h));
  const scale = (size * widthFraction) / (maxX - minX);
  const offX = (size - (maxX - minX) * scale) / 2 - minX * scale;
  const offY = (size - (maxY - minY) * scale) / 2 - minY * scale;
  const rects = bars.map((b) => ({ x0: b.x * scale + offX, x1: (b.x + b.w) * scale + offX, y0: b.y * scale + offY, y1: (b.y + b.h) * scale + offY }));
  const raw = Buffer.alloc(size * (size * 3 + 1));
  let p = 0;
  for (let y = 0; y < size; y++) {
    raw[p++] = 0; // filter: none
    for (let x = 0; x < size; x++) {
      let cover = 0; // exact area coverage of the pixel by the bars (they do not overlap)
      for (const r of rects) cover += overlap(x, x + 1, r.x0, r.x1) * overlap(y, y + 1, r.y0, r.y1);
      cover = Math.min(1, cover);
      for (let c = 0; c < 3; c++) raw[p++] = Math.round(BACKGROUND[c] + (MARK[c] - BACKGROUND[c]) * cover);
    }
  }
  return encodePng(size, size, raw);
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; t[n] = c >>> 0; }
  return t;
})();
function crc32(buf) { let c = 0xFFFFFFFF; for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; }
function chunk(type, data) {
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePng(w, h, raw) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0; // 8-bit RGB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
  ]);
}

export const ICONS = [
  { file: 'icon-192.png', size: 192, width: 0.66 },
  { file: 'icon-512.png', size: 512, width: 0.66 },
  { file: 'icon-maskable-512.png', size: 512, width: 0.52 }, // inside the 80% safe circle
  { file: 'apple-touch-icon.png', size: 180, width: 0.62 }
];

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const bars = readBars(readFileSync(join(root, 'public', 'logo-mark.svg'), 'utf8'));
  mkdirSync(out, { recursive: true });
  for (const i of ICONS) {
    const png = drawIcon(i.size, i.width, bars);
    writeFileSync(join(out, i.file), png);
    console.log(`public/icons/${i.file}  ${i.size}x${i.size}  ${png.length} bytes`);
  }
}
