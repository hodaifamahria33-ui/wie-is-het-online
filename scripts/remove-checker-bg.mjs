import sharp from "sharp";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const name = process.argv[2] || "opponent-character.png";
const input = path.join(__dirname, "..", "assets", "game", name);
const output = input;

const { data, info } = await sharp(input)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const px = data;
for (let i = 0; i < px.length; i += 4) {
  const r = px[i];
  const g = px[i + 1];
  const b = px[i + 2];
  const lum = (r + g + b) / 3;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const sat = max - min;

  let alpha = px[i + 3];

  // checkerboard / gray backdrop (light + dark squares)
  const isGray = Math.abs(r - g) < 18 && Math.abs(g - b) < 18;
  if (isGray && lum > 68 && sat < 48) alpha = 0;
  if (r > 235 && g > 235 && b > 235) alpha = 0;

  // old purple box from earlier export
  if (r < 55 && g < 45 && b < 80 && lum < 70) alpha = 0;
  if (r > 35 && r < 90 && g > 25 && g < 70 && b > 60 && b < 130 && sat < 55 && lum < 100)
    alpha = 0;

  // solid black / near-black export backdrop
  if (lum < 28 && sat < 35) alpha = 0;

  px[i + 3] = alpha;
}

await sharp(px, {
  raw: { width: info.width, height: info.height, channels: 4 },
})
  .png()
  .toFile(output);

console.log("Saved transparent cutout:", output);
