/* ─── steganography.js ─────────────────────────────────────────────────────
   LSB (Least Significant Bit) steganography via the HTML5 Canvas API.

   Encoding format (bits written across R,G,B LSBs of every pixel):
     [0  …  31] → 32-bit big-endian uint32 = byte-length of payload
     [32 … end] → payload bytes (UTF-8 encoded ciphertext string)

   Capacity: 512×512 carrier × 3 channels = 786,432 bits = 98,304 bytes.
   Typical AES-256 ciphertext for a few paragraphs is < 2,000 bytes → plenty.
─────────────────────────────────────────────────────────────────────────── */

const CARRIER_W = 512;
const CARRIER_H = 512;

/* ── Generate a visually plausible carrier canvas (interference pattern) ── */
function buildCarrierCanvas() {
  const canvas = document.createElement('canvas');
  canvas.width  = CARRIER_W;
  canvas.height = CARRIER_H;
  const ctx = canvas.getContext('2d');

  const imgData = ctx.createImageData(CARRIER_W, CARRIER_H);
  const d = imgData.data;

  for (let i = 0; i < d.length; i += 4) {
    const idx = i / 4;
    const px  = idx % CARRIER_W;
    const py  = Math.floor(idx / CARRIER_W);

    // Layered sine-wave interference — looks like a real diffraction photo
    const r = Math.sin(px * 0.047) * 55 + Math.cos(py * 0.031) * 55 + 128;
    const g = Math.cos(px * 0.031 + 1.2) * 55 + Math.sin(py * 0.051 + 2.4) * 55 + 128;
    const b = Math.sin((px + py) * 0.038 + 3.6) * 55 + 128;

    // Add small random noise so LSBs already vary naturally (avoids flat-plane detection)
    d[i]     = Math.max(0, Math.min(255, Math.round(r) + (Math.random() * 8 | 0) - 4));
    d[i + 1] = Math.max(0, Math.min(255, Math.round(g) + (Math.random() * 8 | 0) - 4));
    d[i + 2] = Math.max(0, Math.min(255, Math.round(b) + (Math.random() * 8 | 0) - 4));
    d[i + 3] = 255; // alpha — never written to
  }

  ctx.putImageData(imgData, 0, 0);
  return canvas;
}

/* ── Convert string → flat bit array (MSB-first per byte) ── */
function strToBits(str) {
  const bytes = new TextEncoder().encode(str);
  const bits  = [];
  for (const byte of bytes) {
    for (let i = 7; i >= 0; i--) bits.push((byte >> i) & 1);
  }
  return bits;
}

/* ── Convert flat bit array → Uint8Array ── */
function bitsToBytes(bits) {
  const out = new Uint8Array(Math.ceil(bits.length / 8));
  for (let i = 0; i < bits.length; i++) {
    const byteIdx = Math.floor(i / 8);
    const bitPos  = 7 - (i % 8);
    out[byteIdx] |= bits[i] << bitPos;
  }
  return out;
}

/* ── 32-bit uint → 32-bit array (big-endian) ── */
function uint32ToBits(n) {
  const bits = [];
  for (let i = 31; i >= 0; i--) bits.push((n >> i) & 1);
  return bits;
}

/* ── 32-bit array → uint32 (big-endian) ── */
function bitsToUint32(bits) {
  let n = 0;
  for (let i = 0; i < 32; i++) n = (n << 1) | bits[i];
  return n >>> 0; // force unsigned
}

/* ════════════════════════════════════════════════════════════════════════════
   PUBLIC API
═══════════════════════════════════════════════════════════════════════════ */

/* ── Load an image by URL → returns HTMLImageElement ── */
function loadImageFromSrc(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Allow cross-origin canvas reads (needed for Vite dev server serving /public)
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load carrier image: ${src}`));
    img.src = src;
  });
}

/**
 * Encode `message` (an AES ciphertext string) into a carrier PNG.
 *
 * @param {string}      message   - The ciphertext to hide.
 * @param {string|null} imageSrc  - Public path to the carrier image (e.g. '/stego-images/1.png').
 *                                  If null, a procedurally generated canvas is used as fallback.
 * @returns {Promise<Blob>}  - A lossless PNG blob ready for download.
 */
export async function encodeMessageInImage(message, imageSrc = null) {
  const msgBits    = strToBits(message);
  const headerBits = uint32ToBits(msgBits.length / 8 | 0); // byte count (not bit count)
  // Re-derive: byte count of the UTF-8 encoded message
  const msgByteLen = new TextEncoder().encode(message).length;
  const header     = uint32ToBits(msgByteLen);
  const allBits    = [...header, ...msgBits];

  // Build or load the carrier canvas
  let canvas, ctx;

  if (imageSrc) {
    // --- Real image path ---
    const img = await loadImageFromSrc(imageSrc);
    const w = img.naturalWidth  || img.width;
    const h = img.naturalHeight || img.height;

    canvas = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
    ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, w, h); // exact dimensions — no distortion
  } else {
    // --- Fallback: procedural noise carrier ---
    canvas = buildCarrierCanvas();
    ctx = canvas.getContext('2d');
  }

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;

  // Available bits: every R/G/B channel LSB (skip alpha)
  const capacity = Math.floor(data.length / 4) * 3;
  if (allBits.length > capacity) {
    throw new Error(
      `PAYLOAD TOO LARGE — need ${allBits.length} bits, carrier capacity: ${capacity} bits`
    );
  }

  // Write bits into R, G, B LSBs
  let bitIdx = 0;
  for (let i = 0; i < data.length && bitIdx < allBits.length; i++) {
    if ((i % 4) === 3) continue;          // skip alpha
    data[i] = (data[i] & 0xFE) | allBits[bitIdx++];
  }

  ctx.putImageData(imgData, 0, 0);

  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
      'image/png'
    )
  );
}

/**
 * Decode a hidden message from a stego PNG File/Blob.
 * Returns Promise<string>  — the original AES ciphertext string.
 */
export async function decodeMessageFromImage(file) {
  // Load the file into an Image element via object URL
  const objectUrl = URL.createObjectURL(file);
  const img = await new Promise((resolve, reject) => {
    const image    = new Image();
    image.onload  = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load image — ensure it is a valid PNG'));
    image.src      = objectUrl;
  });
  URL.revokeObjectURL(objectUrl);

  const canvas = document.createElement('canvas');
  canvas.width  = img.width;
  canvas.height = img.height;
  const ctx     = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0);

  const imgData = ctx.getImageData(0, 0, img.width, img.height);
  const data    = imgData.data;

  // Extract all LSBs from R, G, B channels
  const bits = [];
  for (let i = 0; i < data.length; i++) {
    if ((i % 4) !== 3) bits.push(data[i] & 1);
  }

  // Read 32-bit header → message byte length
  const msgByteLen = bitsToUint32(bits.slice(0, 32));

  if (msgByteLen === 0 || msgByteLen * 8 + 32 > bits.length) {
    throw new Error('NO HIDDEN PAYLOAD FOUND — image may not be a Vanish-E stego file');
  }

  // Read payload bits
  const payloadBits  = bits.slice(32, 32 + msgByteLen * 8);
  const payloadBytes = bitsToBytes(payloadBits);

  return new TextDecoder().decode(payloadBytes);
}
