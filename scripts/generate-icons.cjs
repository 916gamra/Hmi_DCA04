const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPng(width, height, drawFn) {
  const rowSize = width * 4;
  const rawData = Buffer.alloc(height * (rowSize + 1));

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0;

    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;

  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const buffer = Buffer.alloc(8 + length + 4);
  buffer.writeUInt32BE(length, 0);
  buffer.write(type, 4, 4, 'ascii');
  data.copy(buffer, 8);

  const crcTable = getCrcTable();
  let crc = 0xffffffff;
  for (let i = 4; i < 8 + length; i++) {
    crc = crcTable[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  }
  crc = crc ^ 0xffffffff;
  buffer.writeInt32BE(crc, 8 + length);

  return buffer;
}

let crcTable = null;
function getCrcTable() {
  if (crcTable) return crcTable;
  crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) {
        c = 0xedb88320 ^ (c >>> 1);
      } else {
        c = c >>> 1;
      }
    }
    crcTable[n] = c;
  }
  return crcTable;
}

function isPointInTriangle(px, py, x1, y1, x2, y2, x3, y3) {
  const d1 = (px - x2) * (y1 - y2) - (x1 - x2) * (py - y2);
  const d2 = (px - x3) * (y2 - y3) - (x2 - x3) * (py - y3);
  const d3 = (px - x1) * (y3 - y1) - (x3 - x1) * (py - y1);
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0);
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0);
  return !(hasNeg && hasPos);
}

// Draw One UI 8 Blue Squircle Icon with Tray and 3 Drill Heads
function drawIcon(x, y, w, h, isMaskable) {
  const cx = w / 2;
  const cy = h / 2;
  const scale = w / 512;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const maxR = w / 2;

  // Squircle check for background
  const squircleDist = Math.pow(Math.abs(dx / (maxR * 0.92)), 4) + Math.pow(Math.abs(dy / (maxR * 0.92)), 4);
  if (!isMaskable && squircleDist > 1.0) {
    return [0, 0, 0, 0];
  }

  // Blue gradient background (#3b82f6 to #1d4ed8)
  const t = (dx + dy + maxR * 2) / (maxR * 4);
  const bgR = Math.round(59 + (29 - 59) * t);
  const bgG = Math.round(130 + (78 - 130) * t);
  const bgB = Math.round(246 + (216 - 246) * t);

  const plateR = 180 * scale;

  // 1. Three Drill Head Badges (White circles with triangles)
  const heads = [
    { tx: 256, ty: 76, color: [6, 182, 212] },    // Top Cyan
    { tx: 118, ty: 335, color: [249, 115, 22] },  // Bottom-Left Orange
    { tx: 394, ty: 335, color: [16, 185, 129] },  // Bottom-Right Emerald
  ];

  for (const head of heads) {
    const hx = head.tx * scale;
    const hy = head.ty * scale;
    const hDist = Math.hypot(x - hx, y - hy);
    const badgeR = 22 * scale;
    if (hDist <= badgeR) {
      // White badge circle with subtle shadow/border
      if (hDist >= badgeR - 2 * scale) return [203, 213, 225, 255]; // border #cbd5e1
      // Triangle inside
      const triScale = scale * 0.8;
      const t1 = [hx, hy - 12 * triScale];
      const t2 = [hx - 9 * triScale, hy + 8 * triScale];
      const t3 = [hx + 9 * triScale, hy + 8 * triScale];
      if (isPointInTriangle(x, y, t1[0], t1[1], t2[0], t2[1], t3[0], t3[1])) {
        return [...head.color, 255];
      }
      return [255, 255, 255, 255];
    }
  }

  // 2. Inner White Circular Tray Plate
  if (dist <= plateR) {
    if (dist >= plateR - 3 * scale) return [203, 213, 225, 255]; // rim #cbd5e1

    // Concentric rings (dashed/dotted or colored rings)
    const angleDeg = (Math.atan2(dy, dx) * 180 / Math.PI + 360) % 360;
    
    // Ring 1 (Amber r=140)
    if (Math.abs(dist - 140 * scale) < 4 * scale) {
      if (Math.floor(angleDeg / 24) % 2 === 0) return [251, 191, 36, 255];
    }
    // Ring 2 (Emerald r=105)
    if (Math.abs(dist - 105 * scale) < 4 * scale) {
      if (Math.floor(angleDeg / 20) % 2 === 0) return [52, 211, 153, 255];
    }
    // Ring 3 (Cyan r=70)
    if (Math.abs(dist - 70 * scale) < 3.5 * scale) {
      if (Math.floor(angleDeg / 16) % 2 === 0) return [56, 189, 248, 255];
    }

    // Center Rose Hub
    if (dist <= 24 * scale) {
      if (dist <= 8 * scale) return [255, 255, 255, 255];
      return [225, 29, 72, 255]; // Rose #e11d48
    }

    return [255, 255, 255, 255];
  }

  return [bgR, bgG, bgB, 255];
}

const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const publicDir = path.join(__dirname, '..', 'public');

if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

console.log('Generating One UI 8 Blue Squircle PWA icons...');

// 192x192
const icon192 = createPng(192, 192, (x, y, w, h) => drawIcon(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'icon-192.png'), icon192);

// 512x512
const icon512 = createPng(512, 512, (x, y, w, h) => drawIcon(x, y, w, h, false));
fs.writeFileSync(path.join(iconsDir, 'icon-512.png'), icon512);

// 512x512 Maskable
const icon512Maskable = createPng(512, 512, (x, y, w, h) => drawIcon(x, y, w, h, true));
fs.writeFileSync(path.join(iconsDir, 'icon-512-maskable.png'), icon512Maskable);

// Apple touch icon 180x180
const appleTouchIcon = createPng(180, 180, (x, y, w, h) => drawIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouchIcon);

// Favicon
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icon192);

console.log('All One UI 8 icons generated successfully!');
