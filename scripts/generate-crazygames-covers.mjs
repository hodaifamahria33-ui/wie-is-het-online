/**
 * CrazyGames cover images — exact dimensions, JPG + PNG, safe title zone.
 * Run: node scripts/generate-crazygames-covers.mjs
 */
import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "crazygames-covers");

const BG = path.join(root, "assets/game/start-bg.png");
const PORTRAITS_DIR = path.join(root, "assets/portraits");
const FACES = [
  "mrbeast.png",
  "pokimane.png",
  "pewdiepie.png",
  "ninja.png",
  "jacksepticeye.png",
  "valkyrae.png",
  "dream.png",
  "loganpaul.png",
];

async function loadPortrait(name, w, h) {
  const file = path.join(PORTRAITS_DIR, name);
  const card = await sharp(file)
    .resize(w, h, { fit: "cover", position: "top" })
    .flatten({ background: "#ffffff" })
    .png()
    .toBuffer();

  const frame = Buffer.from(
    `<svg width="${w}" height="${h + 36}">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#6366f1"/>
          <stop offset="100%" stop-color="#4338ca"/>
        </linearGradient>
      </defs>
      <rect x="3" y="3" width="${w - 6}" height="${h - 6}" rx="18" ry="18" fill="#fff"/>
      <rect x="3" y="${h - 8}" width="${w - 6}" height="40" fill="url(#g)"/>
    </svg>`
  );

  return sharp({
    create: {
      width: w,
      height: h + 36,
      channels: 3,
      background: { r: 10, g: 16, b: 32 },
    },
  })
    .composite([
      { input: card, top: 6, left: 6 },
      { input: frame, top: 0, left: 0 },
    ])
    .flatten({ background: "#0a1020" })
    .png()
    .toBuffer();
}

/** Title centered — NOT in top-left label zone (CrazyGames safe area). */
function overlaySvg(w, h, opts = {}) {
  const titleSize = opts.titleSize ?? 96;
  const subtitleSize = opts.subtitleSize ?? 34;
  const titleY = opts.titleY ?? Math.round(h * 0.2);
  const subY = titleY + Math.round(titleSize * 0.95);
  const tagY = h - Math.round(h * 0.07);

  return Buffer.from(`<svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="rgba(8,12,28,0.72)"/>
      <stop offset="35%" stop-color="rgba(8,12,28,0.2)"/>
      <stop offset="100%" stop-color="rgba(8,12,28,0.88)"/>
    </linearGradient>
    <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
      <feDropShadow dx="0" dy="5" stdDeviation="10" flood-color="#000" flood-opacity="0.65"/>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#shade)"/>
  <text x="${w / 2}" y="${titleY}" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial Black, Impact, Arial, sans-serif" font-size="${titleSize}" font-weight="900"
    fill="#ffffff" filter="url(#glow)">WIE IS HET?</text>
  <text x="${w / 2}" y="${subY}" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="${subtitleSize}" font-weight="700"
    fill="#99f6e4" letter-spacing="8">ONLINE</text>
  <text x="${w / 2}" y="${tagY}" text-anchor="middle" dominant-baseline="middle"
    font-family="Arial, Helvetica, sans-serif" font-size="${Math.max(24, Math.round(subtitleSize * 0.8))}" font-weight="700"
    fill="#fde68a">Raad · Vraag · Win</text>
</svg>`);
}

async function makeBackground(w, h) {
  return sharp(BG)
    .resize(w, h, { fit: "cover", position: "center" })
    .modulate({ brightness: 0.9, saturation: 1.1 })
    .flatten({ background: "#0a1628" })
    .removeAlpha()
    .png()
    .toBuffer();
}

async function saveCover(buffer, baseName, w, h) {
  const exact = await sharp(buffer)
    .resize(w, h, { fit: "fill" })
    .flatten({ background: "#0a1628" })
    .toColorspace("srgb")
    .png({ compressionLevel: 6 })
    .toBuffer();

  const meta = await sharp(exact).metadata();
  if (meta.width !== w || meta.height !== h) {
    throw new Error(`${baseName}: got ${meta.width}x${meta.height}, want ${w}x${h}`);
  }

  const pngPath = path.join(outDir, `${baseName}.png`);
  const jpgPath = path.join(outDir, `${baseName}.jpg`);

  await sharp(exact).png().toFile(pngPath);
  await sharp(exact).jpeg({ quality: 94, mozjpeg: true, chromaSubsampling: "4:4:4" }).toFile(jpgPath);

  console.log(`  OK ${baseName}.jpg + .png (${w}x${h})`);
}

async function buildLandscape() {
  const W = 1920;
  const H = 1080;
  const cardW = 168;
  const cardH = 208;
  const cards = await Promise.all(FACES.map((f) => loadPortrait(f, cardW, cardH)));
  const totalW = cards.length * (cardW + 14) - 14;
  let x = Math.round((W - totalW) / 2);
  const y = Math.round(H * 0.42);
  const composites = cards.map((buf) => {
    const item = { input: buf, top: y, left: x };
    x += cardW + 14;
    return item;
  });
  composites.push({ input: overlaySvg(W, H, { titleSize: 98, subtitleSize: 36, titleY: 210 }), top: 0, left: 0 });

  const bg = await makeBackground(W, H);
  const buf = await sharp(bg).composite(composites).png().toBuffer();
  await saveCover(buf, "landscape-1920x1080", W, H);
}

async function buildPortrait() {
  const W = 800;
  const H = 1200;
  const cardW = 148;
  const cardH = 182;
  const picks = FACES.slice(0, 6);
  const cards = await Promise.all(picks.map((f) => loadPortrait(f, cardW, cardH)));
  const cols = 2;
  const gapX = 16;
  const gapY = 18;
  const gridW = cols * cardW + gapX;
  const startX = Math.round((W - gridW) / 2);
  const startY = Math.round(H * 0.38);
  const composites = [];
  cards.forEach((buf, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    composites.push({
      input: buf,
      top: startY + row * (cardH + 36 + gapY),
      left: startX + col * (cardW + gapX),
    });
  });
  composites.push({
    input: overlaySvg(W, H, { titleSize: 58, subtitleSize: 22, titleY: 200 }),
    top: 0,
    left: 0,
  });

  const bg = await makeBackground(W, H);
  const buf = await sharp(bg).composite(composites).png().toBuffer();
  await saveCover(buf, "portrait-800x1200", W, H);
}

async function buildSquare() {
  const W = 800;
  const H = 800;
  const cardW = 138;
  const cardH = 170;
  const picks = FACES.slice(0, 4);
  const cards = await Promise.all(picks.map((f) => loadPortrait(f, cardW, cardH)));
  const cols = 2;
  const gap = 14;
  const gridW = cols * cardW + gap;
  const startX = Math.round((W - gridW) / 2);
  const startY = Math.round(H * 0.42);
  const composites = [];
  cards.forEach((buf, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    composites.push({
      input: buf,
      top: startY + row * (cardH + 36 + gap),
      left: startX + col * (cardW + gap),
    });
  });
  composites.push({
    input: overlaySvg(W, H, { titleSize: 54, subtitleSize: 20, titleY: 150 }),
    top: 0,
    left: 0,
  });

  const bg = await makeBackground(W, H);
  const buf = await sharp(bg).composite(composites).png().toBuffer();
  await saveCover(buf, "square-800x800", W, H);
}

fs.mkdirSync(outDir, { recursive: true });
console.log("Generating CrazyGames covers...");
await buildLandscape();
await buildPortrait();
await buildSquare();
console.log(`Done → ${outDir}`);
console.log("Upload landscape-1920x1080.jpg (geen crop nodig — exact 1920x1080)");
