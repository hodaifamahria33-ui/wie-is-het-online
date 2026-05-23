/**
 * Download 32 gekleurde portretten naar assets/portraits/ (offline op GitHub Pages).
 */
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const OUT = "assets/portraits";
const SIZE = 256;

/** Gekleurde adventurer-portretten — betrouwbaar & uniek per personage */
const ROSTER = [
  { name: "MrBeast", slug: "mrbeast", female: false, bg: "f59e0b,ea580c,7c2d12", hair: "short04", glasses: "variant02", skinColor: "f2d3b1", hairColor: "562306" },
  { name: "Pokimane", slug: "pokimane", female: true, bg: "ec4899,f472b6,831843", hair: "long20", skinColor: "ecad80", hairColor: "592454" },
  { name: "PewDiePie", slug: "pewdiepie", female: false, bg: "3b82f6,1d4ed8,1e3a8a", hair: "short11", beard: "variant04", glasses: "variant03", skinColor: "f2d3b1", hairColor: "e5d7a3" },
  { name: "Valkyrae", slug: "valkyrae", female: true, bg: "a855f7,c084fc,581c87", hair: "long14", glasses: "variant01", skinColor: "f2d3b1", hairColor: "0e0e0e" },
  { name: "Markiplier", slug: "markiplier", female: false, bg: "ef4444,b91c1c,450a0a", hair: "short08", beard: "variant06", skinColor: "ecad80", hairColor: "562306" },
  { name: "iJustine", slug: "ijustine", female: true, bg: "f472b6,fb7185,9f1239", hair: "long08", glasses: "variant04", skinColor: "f2d3b1", hairColor: "ab2a18" },
  { name: "Jacksepticeye", slug: "jacksepticeye", female: false, bg: "22c55e,16a34a,14532d", hair: "short16", beard: "variant02", skinColor: "f2d3b1", hairColor: "3eac2c" },
  { name: "SSSniperWolf", slug: "sssniperwolf", female: true, bg: "f97316,ea580c,7c2d12", hair: "long18", skinColor: "ecad80", hairColor: "cb6820" },
  { name: "KSI", slug: "ksi", female: false, bg: "eab308,ca8a04,713f12", hair: "short02", beard: "variant08", glasses: "variant02", skinColor: "9e5622", hairColor: "0e0e0e" },
  { name: "LaurDIY", slug: "laurdiy", female: true, bg: "fde047,facc15,a16207", hair: "long22", skinColor: "f2d3b1", hairColor: "b9a05f" },
  { name: "Ninja", slug: "ninja", female: false, bg: "06b6d4,0891b2,164e63", hair: "short12", beard: "variant03", skinColor: "f2d3b1", hairColor: "0e0e0e" },
  { name: "Emma", slug: "emma", female: true, bg: "fda4af,f43f5e,881337", hair: "long06", glasses: "variant02", skinColor: "f2d3b1", hairColor: "592454" },
  { name: "Dream", slug: "dream", female: false, bg: "34d399,10b981,064e3b", hair: "short06", skinColor: "f2d3b1", hairColor: "85c2c6" },
  { name: "Aphmau", slug: "aphmau", female: true, bg: "c084fc,a78bfa,4c1d95", hair: "long12", skinColor: "ecad80", hairColor: "dba3be" },
  { name: "Vanoss", slug: "vanoss", female: false, bg: "64748b,475569,0f172a", hair: "short14", beard: "variant05", glasses: "variant01", skinColor: "f2d3b1", hairColor: "0e0e0e" },
  { name: "Jelly", slug: "jelly", female: true, bg: "38bdf8,0ea5e9,1e3a8a", hair: "long16", skinColor: "f2d3b1", hairColor: "cb6820" },
  { name: "DanTDM", slug: "dantdm", female: false, bg: "818cf8,6366f1,312e81", hair: "short10", beard: "variant01", glasses: "variant04", skinColor: "f2d3b1", hairColor: "ac6511" },
  { name: "Zoella", slug: "zoella", female: true, bg: "fb923c,fdba74,9a3412", hair: "long24", skinColor: "ecad80", hairColor: "592454" },
  { name: "Ludwig", slug: "ludwig", female: false, bg: "fbbf24,f59e0b,78350f", hair: "short18", beard: "variant07", skinColor: "f2d3b1", hairColor: "796a45" },
  { name: "Tana", slug: "tana", female: true, bg: "f43f5e,e11d48,881337", hair: "long10", glasses: "variant03", skinColor: "f2d3b1", hairColor: "0e0e0e" },
  { name: "xQc", slug: "xqc", female: false, bg: "94a3b8,64748b,1e293b", hair: "short01", beard: "variant02", skinColor: "f2d3b1", hairColor: "afafaf" },
  { name: "Nikkie", slug: "nikkie", female: true, bg: "e879f9,d946ef,701a75", hair: "long04", glasses: "variant05", skinColor: "f2d3b1", hairColor: "b9a05f" },
  { name: "IShowSpeed", slug: "ishowspeed", female: false, bg: "ef4444,dc2626,450a0a", hair: "short15", beard: "variant01", skinColor: "9e5622", hairColor: "0e0e0e" },
  { name: "Wengie", slug: "wengie", female: true, bg: "2dd4bf,14b8a6,115e59", hair: "long02", skinColor: "ecad80", hairColor: "592454" },
  { name: "Enzo", slug: "enzo", female: false, bg: "f97316,ea580c,7c2d12", hair: "short09", beard: "variant04", skinColor: "f2d3b1", hairColor: "562306" },
  { name: "Safiya", slug: "safiya", female: true, bg: "a78bfa,8b5cf6,4c1d95", hair: "long26", glasses: "variant02", skinColor: "9e5622", hairColor: "0e0e0e" },
  { name: "Gio", slug: "gio", female: false, bg: "60a5fa,3b82f6,1e3a8a", hair: "short07", beard: "variant03", skinColor: "ecad80", hairColor: "562306" },
  { name: "Gibi", slug: "gibi", female: true, bg: "fda4af,f9a8d4,9d174d", hair: "long26", skinColor: "f2d3b1", hairColor: "592454" },
  { name: "Kalvijn", slug: "kalvijn", female: false, bg: "fb7185,e11d48,881337", hair: "short13", beard: "variant06", glasses: "variant03", skinColor: "f2d3b1", hairColor: "cb6820" },
  { name: "Rosanna", slug: "rosanna", female: true, bg: "fcd34d,fbbf24,a16207", hair: "long25", skinColor: "f2d3b1", hairColor: "ab2a18" },
  { name: "MKBHD", slug: "mkbhd", female: false, bg: "1e293b,0f172a,020617", hair: "short03", beard: "variant02", glasses: "variant05", skinColor: "763900", hairColor: "0e0e0e" },
  { name: "Jess", slug: "jess", female: true, bg: "4ade80,22c55e,14532d", hair: "long21", skinColor: "ecad80", hairColor: "6a4e35" },
];

function buildUrl(c) {
  const p = new URLSearchParams();
  p.set("seed", c.name);
  p.set("size", String(SIZE));
  p.set("backgroundType", "gradientLinear");
  p.set("backgroundColor", c.bg);
  p.set("backgroundRotation", "0,360");
  p.set("skinColor", c.skinColor);
  p.set("hairColor", c.hairColor);
  p.set("hair", c.hair);
  if (c.glasses) {
    p.set("glasses", c.glasses);
    p.set("glassesProbability", "100");
  }
  if (c.beard) {
    p.set("beard", c.beard);
    p.set("beardProbability", "100");
  }
  if (c.female) {
    p.set("features", "blush");
    p.set("featuresProbability", "80");
  }
  return `https://api.dicebear.com/9.x/adventurer/png?${p}`;
}

await mkdir(OUT, { recursive: true });

let ok = 0;
for (const c of ROSTER) {
  const url = buildUrl(c);
  const file = path.join(OUT, c.slug + ".png");
  if (existsSync(file)) {
    console.log("skip", c.slug);
    ok++;
    continue;
  }
  const res = await fetch(url);
  if (!res.ok) {
    console.error("FAIL", c.name, res.status, url);
    continue;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await writeFile(file, buf);
  console.log("ok", c.slug, buf.length);
  ok++;
  await new Promise((r) => setTimeout(r, 120));
}

console.log("done", ok, "/", ROSTER.length);
