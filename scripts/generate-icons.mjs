// Generates the PWA icons (192, 512, maskable) with no native dependencies.
// Draws a pine rounded-square with three rising bars — a calm "spending" mark.
// Pure-JS RGBA buffer + minimal PNG encoder (zlib deflate + CRC32 chunks).
import { deflateSync } from 'node:zlib';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const outDir = join(here, '..', 'public', 'icons');

const BG = [0x2f, 0x6f, 0x5e]; // pine
const BARS = [
  [0xe8, 0xed, 0xe9], // soft paper
  [0xd9, 0xa4, 0x41], // gold
  [0xc2, 0x70, 0x3d], // terracotta
];

// --- tiny canvas (RGBA Uint8) ----------------------------------------------
function makeCanvas(size) {
  return { size, data: new Uint8Array(size * size * 4) }; // all transparent
}

function setPixel(c, x, y, [r, g, b], a = 255) {
  if (x < 0 || y < 0 || x >= c.size || y >= c.size) return;
  const i = (y * c.size + x) * 4;
  c.data[i] = r;
  c.data[i + 1] = g;
  c.data[i + 2] = b;
  c.data[i + 3] = a;
}

// Fill a rounded rectangle. `rTop`/`rBottom` let bars round only their tops.
function fillRoundedRect(c, x0, y0, w, h, color, rTop, rBottom = rTop) {
  const x1 = x0 + w;
  const y1 = y0 + h;
  for (let y = Math.floor(y0); y < Math.ceil(y1); y++) {
    for (let x = Math.floor(x0); x < Math.ceil(x1); x++) {
      const r = y < y0 + Math.max(rTop, rBottom) ? rTop : rBottom;
      // Corner distance test only near the four corners.
      let inside = true;
      const corners = [
        [x0 + rTop, y0 + rTop, rTop, x < x0 + rTop && y < y0 + rTop],
        [x1 - rTop, y0 + rTop, rTop, x > x1 - rTop && y < y0 + rTop],
        [x0 + rBottom, y1 - rBottom, rBottom, x < x0 + rBottom && y > y1 - rBottom],
        [x1 - rBottom, y1 - rBottom, rBottom, x > x1 - rBottom && y > y1 - rBottom],
      ];
      for (const [cx, cy, cr, active] of corners) {
        if (active && cr > 0) {
          const dx = x + 0.5 - cx;
          const dy = y + 0.5 - cy;
          if (dx * dx + dy * dy > cr * cr) inside = false;
        }
      }
      void r;
      if (inside) setPixel(c, x, y, color);
    }
  }
}

function drawIcon(size, { maskable }) {
  const c = makeCanvas(size);

  // Background: full-bleed for maskable (safe-zone handled by padding the bars),
  // rounded square otherwise.
  const bgRadius = maskable ? 0 : Math.round(size * 0.22);
  fillRoundedRect(c, 0, 0, size, size, BG, bgRadius);

  // Content box: shrink into the maskable safe zone (~80%).
  const pad = maskable ? size * 0.2 : size * 0.26;
  const boxX = pad;
  const boxW = size - pad * 2;
  const baseline = size - pad; // bars sit on this line
  const boxTop = pad;
  const boxH = baseline - boxTop;

  const gap = boxW * 0.12;
  const barW = (boxW - gap * 2) / 3;
  const heights = [0.5, 0.74, 1.0]; // relative bar heights, rising

  heights.forEach((hRel, index) => {
    const barH = boxH * hRel;
    const x = boxX + index * (barW + gap);
    const y = baseline - barH;
    const radius = Math.min(barW * 0.32, barH * 0.5);
    fillRoundedRect(c, x, y, barW, barH, BARS[index], radius, 0);
  });

  return c;
}

// --- PNG encoder ------------------------------------------------------------
const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBytes, data]);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePng(canvas) {
  const { size, data } = canvas;
  // Prefix each scanline with filter byte 0.
  const stride = size * 4;
  const raw = Buffer.alloc((stride + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0;
    Buffer.from(data.buffer, y * stride, stride).copy(raw, y * (stride + 1) + 1);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// --- emit -------------------------------------------------------------------
mkdirSync(outDir, { recursive: true });

const targets = [
  { name: '192.png', size: 192, maskable: false },
  { name: '512.png', size: 512, maskable: false },
  { name: 'maskable.png', size: 512, maskable: true },
];

for (const target of targets) {
  const canvas = drawIcon(target.size, { maskable: target.maskable });
  writeFileSync(join(outDir, target.name), encodePng(canvas));
  console.log(`wrote icons/${target.name} (${target.size}x${target.size})`);
}
