const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const NAVY = [0x0c, 0x1b, 0x33, 0xff];
const NAVY_DARK = [0x08, 0x13, 0x25, 0xff];
const BLUE = [0x3b, 0x82, 0xf6, 0xff];
const WHITE = [0xff, 0xff, 0xff, 0xff];
const TRANSPARENT = [0, 0, 0, 0];

function mix(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
    Math.round(a[3] + (b[3] - a[3]) * t),
  ];
}

function inRoundedRect(x, y, x0, y0, x1, y1, r) {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const innerX0 = x0 + r, innerX1 = x1 - r;
  const innerY0 = y0 + r, innerY1 = y1 - r;
  if (x >= innerX0 && x <= innerX1) return true;
  if (y >= innerY0 && y <= innerY1) return true;
  let cx, cy;
  if (x < innerX0) cx = innerX0; else cx = innerX1;
  if (y < innerY0) cy = innerY0; else cy = innerY1;
  const dx = x - cx, dy = y - cy;
  return dx * dx + dy * dy <= r * r;
}

// Draw pixel for size s at (x,y). Type: 'full' = shield+S+check, 'simple' = shield+checkmark for 16px
function drawPixel(s, x, y, type) {
  const cx = (s - 1) / 2;
  const cy = (s - 1) / 2;

  // --- Shield shape (scaled for s) ---
  // Bounding box of shield: approx 90% of s
  const halfW = Math.max(2, Math.round(s * 0.42));
  const topY = Math.max(0, Math.round(cy - s * 0.46));
  const rectBottomY = Math.round(cy + s * 0.10);
  const fullBottomY = Math.round(cy + s * 0.45);

  const leftX = Math.round(cx - halfW);
  const rightX = Math.round(cx + halfW);

  // Top-corners rounded rect
  const topRadius = Math.max(1, Math.round(s * 0.08));
  let inShield = false;

  // 1. Upper rectangle
  if (inRoundedRect(x, y, leftX, topY, rightX, rectBottomY, topRadius)) {
    inShield = true;
  }
  // 2. Lower triangle-like curved shield bottom (parabolic)
  if (!inShield && y >= rectBottomY && y <= fullBottomY) {
    const t = (y - rectBottomY) / Math.max(1, fullBottomY - rectBottomY);
    const halfAtY = halfW * (1 - t * t * 1.2);
    if (halfAtY >= 0 && Math.abs(x - cx) <= halfAtY) inShield = true;
  }
  // 3. Tiny tip pixel
  if (!inShield && y === fullBottomY + 1 && x === Math.round(cx)) inShield = true;

  if (!inShield) return TRANSPARENT;

  // Background vertical gradient inside shield
  const tY = Math.max(0, Math.min(1, (y - topY) / Math.max(1, fullBottomY - topY)));
  let bg = mix(NAVY, NAVY_DARK, tY * 0.5);

  // --- Mark inside shield: style based on type ---
  if (type === 'simple' || s <= 24) {
    // Simple white checkmark only, for legibility at 16/24/32
    // Downward checkmark through the middle
    const tCheckY = (y - (cy - s * 0.05)) / Math.max(1, s * 0.35);
    // Left arm of check
    let leftArm = false;
    const startX1 = cx - s * 0.20, endX1 = cx - s * 0.02;
    const startY1 = cy - s * 0.02, endY1 = cy + s * 0.18;
    if (tCheckY >= 0 && tCheckY <= 1.3) {
      const lx = startX1 + (endX1 - startX1) * Math.min(1, tCheckY);
      const ly = startY1 + (endY1 - startY1) * Math.min(1, tCheckY);
      if (Math.hypot(x - lx, y - ly) <= Math.max(1, s * 0.055)) leftArm = true;
    }
    // Right arm
    let rightArm = false;
    const startX2 = cx - s * 0.02, endX2 = cx + s * 0.22;
    const startY2 = cy + s * 0.18, endY2 = cy - s * 0.12;
    for (let tt = 0; tt <= 1; tt += 0.02) {
      const lx = startX2 + (endX2 - startX2) * tt;
      const ly = startY2 + (endY2 - startY2) * tt;
      if (Math.hypot(x - lx, y - ly) <= Math.max(1, s * 0.055)) { rightArm = true; break; }
    }
    if (leftArm || rightArm) return WHITE;
    return bg;
  }

  // 'full' style: S monogram (white) + check accent (blue)
  // S = 2 half-circles + bridge
  let inS = false;
  const sCx = cx - s * 0.02;
  const sTopY = cy - s * 0.10;
  const sBotY = cy + s * 0.11;
  const sR = s * 0.125;
  const sThick = Math.max(1.2, s * 0.072);

  // Top arc (open on right side): draw circle ring with excluded right half
  const dtTop = Math.hypot(x - sCx, y - sTopY);
  const onTopArc = Math.abs(dtTop - sR) <= sThick / 2 && !(x > sCx + sR * 0.2 && y > sTopY);
  // Bottom arc (open on left side)
  const dtBot = Math.hypot(x - sCx, y - sBotY);
  const onBotArc = Math.abs(dtBot - sR) <= sThick / 2 && !(x < sCx - sR * 0.2 && y < sBotY);
  // Bridge (diagonal-ish)
  let onBridge = false;
  const bx0 = sCx + 0.02, by0 = sTopY + sR * 0.2;
  const bx1 = sCx - 0.02, by1 = sBotY - sR * 0.2;
  for (let tt = 0; tt <= 1; tt += 0.02) {
    const px = bx0 + (bx1 - bx0) * tt;
    const py = by0 + (by1 - by0) * tt;
    if (Math.hypot(x - px, y - py) <= sThick / 2 + 0.3) { onBridge = true; break; }
  }
  inS = onTopArc || onBotArc || onBridge;

  // Blue check accent, bottom-right
  let inTick = false;
  const t0x = cx + s * 0.20, t0y = cy + s * 0.10;
  const t1x = cx + s * 0.30, t1y = cy + s * 0.22;
  const t2x = cx + s * 0.40, t2y = cy + s * 0.02;
  const thick = Math.max(1.2, s * 0.06);
  for (let tt = 0; tt <= 1; tt += 0.02) {
    const lx0 = t0x + (t1x - t0x) * tt;
    const ly0 = t0y + (t1y - t0y) * tt;
    if (Math.hypot(x - lx0, y - ly0) <= thick / 2) { inTick = true; break; }
  }
  if (!inTick) {
    for (let tt = 0; tt <= 1; tt += 0.02) {
      const lx1 = t1x + (t2x - t1x) * tt;
      const ly1 = t1y + (t2y - t1y) * tt;
      if (Math.hypot(x - lx1, y - ly1) <= thick / 2) { inTick = true; break; }
    }
  }

  if (inTick) return BLUE;
  if (inS) return WHITE;
  return bg;
}

function encodePNG(width, height, rgbaFn) {
  const rowLen = 1 + width * 4;
  const raw = Buffer.alloc(rowLen * height);
  for (let y = 0; y < height; y++) {
    raw[y * rowLen] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = rgbaFn(width, x, y);
      const off = y * rowLen + 1 + x * 4;
      raw[off] = r;
      raw[off + 1] = g;
      raw[off + 2] = b;
      raw[off + 3] = a;
    }
  }

  function crc32(buf) {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
    let crc = 0xffffffff;
    for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
    return (crc ^ 0xffffffff) >>> 0;
  }
  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  const idat = zlib.deflateSync(raw, { level: 9 });
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function icoFromPNGs(pngBuffers) {
  const num = pngBuffers.length;
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(num, 4);

  const entries = [];
  let offset = 6 + 16 * num;
  for (const buf of pngBuffers) {
    const w = buf.readUInt32BE(16);
    const h = buf.readUInt32BE(20);
    const e = Buffer.alloc(16);
    e[0] = w >= 256 ? 0 : w;
    e[1] = h >= 256 ? 0 : h;
    e[2] = 0;
    e[3] = 0;
    e.writeUInt16LE(1, 4);
    e.writeUInt16LE(32, 6);
    e.writeUInt32LE(buf.length, 8);
    e.writeUInt32LE(offset, 12);
    entries.push(e);
    offset += buf.length;
  }
  return Buffer.concat([header, ...entries, ...pngBuffers]);
}

const outDir = path.join(__dirname, '..', 'public');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// SVG favicon (high quality, primary)
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" shape-rendering="geometricPrecision">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#0c1b33"/>
      <stop offset="100%" stop-color="#081325"/>
    </linearGradient>
  </defs>
  <path fill="url(#g)" d="M9 6 L55 6 C59 6 59 14 59 18 L59 29 C59 40 45 53 32 59 C19 53 5 40 5 29 L5 18 C5 14 5 6 9 6 Z"/>
  <path fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"
        d="M39 22 C27 22 19 23 19 31 C19 37 27 38 39 36 C39 44 27 47 19 44"/>
  <path fill="none" stroke="#3b82f6" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"
        d="M37 42 L45 50 L57 36"/>
</svg>`;
fs.writeFileSync(path.join(outDir, 'favicon.svg'), svgContent);
console.log('wrote favicon.svg');

const sizes = [
  { s: 16, type: 'simple', fname: 'favicon-16x16.png' },
  { s: 32, type: 'simple', fname: 'favicon-32x32.png' },
  { s: 180, type: 'full', fname: 'apple-touch-icon.png' },
];
const pngMap = {};
for (const spec of sizes) {
  const { s, type, fname } = spec;
  const buf = encodePNG(s, s, (size, x, y) => drawPixel(size, x, y, type));
  const fpath = path.join(outDir, fname);
  fs.writeFileSync(fpath, buf);
  pngMap[s] = buf;
  console.log(`wrote ${fname} (${buf.length} bytes, ${buf.filter((v,i)=>i%4===3 && v>0).length/(s*s)*100|0}% opaque pixels)`);
}

// favicon.ico: store 16 + 32
const icoBuf = icoFromPNGs([pngMap[16], pngMap[32]]);
fs.writeFileSync(path.join(outDir, 'favicon.ico'), icoBuf);
console.log(`wrote favicon.ico (${icoBuf.length} bytes)`);

console.log('favicon set generated successfully.');
