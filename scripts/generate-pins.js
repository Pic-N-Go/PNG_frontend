const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC32 implementation for PNG chunks
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(toCrc), 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

function createPng(width, height, getPixel) {
  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth: 8
  ihdr.writeUInt8(6, 9); // color type: RGBA (6)
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);

  // Raw image data with filter type 0 (None) before each scanline
  const raw = Buffer.alloc(height * (width * 4 + 1));
  let offset = 0;

  for (let y = 0; y < height; y++) {
    raw.writeUInt8(0, offset++); // filter byte 0
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = getPixel(x, y, width, height);
      raw.writeUInt8(r, offset++);
      raw.writeUInt8(g, offset++);
      raw.writeUInt8(b, offset++);
      raw.writeUInt8(a, offset++);
    }
  }

  // Compress with zlib
  const compressed = zlib.deflateSync(raw);
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND chunk
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

// Ensure output dir
const outDir = path.join(__dirname, '..', 'assets', 'images', 'pins');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// 1. Cluster Pin: Circular #e31b59 badge with white border and subtle shadow (72x72)
const clusterPng = createPng(72, 72, (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x + 0.5 - cx;
  const dy = y + 0.5 - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const rOuter = 32;
  const rInner = 28;

  if (dist > rOuter + 1) {
    if (dist <= rOuter + 3) {
      const shadowAlpha = Math.max(0, (1 - (dist - rOuter) / 3) * 50);
      return [0, 0, 0, Math.round(shadowAlpha)];
    }
    return [0, 0, 0, 0];
  }

  if (dist > rOuter) {
    const aa = 1 - (dist - rOuter);
    return [255, 255, 255, Math.round(aa * 255)];
  }

  if (dist > rInner) {
    return [255, 255, 255, 255];
  }

  // #e31b59: 227, 27, 89
  return [227, 27, 89, 255];
});
fs.writeFileSync(path.join(outDir, 'pin_cluster.png'), clusterPng);

// 2. Course Pin: Circular #e31b59 badge with white border (56x56)
const coursePng = createPng(56, 56, (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x + 0.5 - cx;
  const dy = y + 0.5 - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const rOuter = 25;
  const rInner = 22;

  if (dist > rOuter + 1) {
    if (dist <= rOuter + 2.5) {
      const shadowAlpha = Math.max(0, (1 - (dist - rOuter) / 2.5) * 45);
      return [0, 0, 0, Math.round(shadowAlpha)];
    }
    return [0, 0, 0, 0];
  }

  if (dist > rOuter) {
    const aa = 1 - (dist - rOuter);
    return [255, 255, 255, Math.round(aa * 255)];
  }

  if (dist > rInner) {
    return [255, 255, 255, 255];
  }

  return [227, 27, 89, 255];
});
fs.writeFileSync(path.join(outDir, 'pin_course.png'), coursePng);

// 3. Spot Pin Circle: Circular #e31b59 badge with white border and white inner pin/dot (48x48)
const spotCirclePng = createPng(48, 48, (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x + 0.5 - cx;
  const dy = y + 0.5 - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const rOuter = 21;
  const rInner = 18;
  const rDot = 6;

  if (dist > rOuter + 1) {
    if (dist <= rOuter + 2.5) {
      const shadowAlpha = Math.max(0, (1 - (dist - rOuter) / 2.5) * 45);
      return [0, 0, 0, Math.round(shadowAlpha)];
    }
    return [0, 0, 0, 0];
  }

  if (dist > rOuter) {
    const aa = 1 - (dist - rOuter);
    return [255, 255, 255, Math.round(aa * 255)];
  }

  if (dist > rInner) {
    return [255, 255, 255, 255];
  }

  if (dist <= rDot) {
    if (dist <= rDot - 1) {
      return [255, 255, 255, 255];
    }
    const aa = (rDot - dist);
    const r = Math.round(227 + (255 - 227) * aa);
    const g = Math.round(27 + (255 - 27) * aa);
    const b = Math.round(89 + (255 - 89) * aa);
    return [r, g, b, 255];
  }

  return [227, 27, 89, 255];
});
fs.writeFileSync(path.join(outDir, 'pin_spot.png'), spotCirclePng);

// 4. Dark cluster (72x72) and spot (48x48) for bookmark pins
const clusterDarkPng = createPng(72, 72, (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x + 0.5 - cx;
  const dy = y + 0.5 - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const rOuter = 32;
  const rInner = 28;

  if (dist > rOuter + 1) {
    if (dist <= rOuter + 3) {
      const shadowAlpha = Math.max(0, (1 - (dist - rOuter) / 3) * 50);
      return [0, 0, 0, Math.round(shadowAlpha)];
    }
    return [0, 0, 0, 0];
  }

  if (dist > rOuter) {
    const aa = 1 - (dist - rOuter);
    return [255, 255, 255, Math.round(aa * 255)];
  }

  if (dist > rInner) {
    return [255, 255, 255, 255];
  }

  return [28, 28, 30, 255];
});
fs.writeFileSync(path.join(outDir, 'pin_cluster_dark.png'), clusterDarkPng);

const spotDarkPng = createPng(48, 48, (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x + 0.5 - cx;
  const dy = y + 0.5 - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  const rOuter = 21;
  const rInner = 18;
  const rDot = 6;

  if (dist > rOuter + 1) {
    if (dist <= rOuter + 2.5) {
      const shadowAlpha = Math.max(0, (1 - (dist - rOuter) / 2.5) * 45);
      return [0, 0, 0, Math.round(shadowAlpha)];
    }
    return [0, 0, 0, 0];
  }

  if (dist > rOuter) {
    const aa = 1 - (dist - rOuter);
    return [255, 255, 255, Math.round(aa * 255)];
  }

  if (dist > rInner) {
    return [255, 255, 255, 255];
  }

  if (dist <= rDot) {
    return [255, 255, 255, 255];
  }

  return [28, 28, 30, 255];
});
fs.writeFileSync(path.join(outDir, 'pin_spot_dark.png'), spotDarkPng);

console.log('Successfully generated pin PNGs in #e31b59!');
