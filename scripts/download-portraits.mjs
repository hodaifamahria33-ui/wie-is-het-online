/**
 * Download 32 gekleurde portretten — traits per YouTuber (herkenbaarheid).
 * Run: node scripts/download-portraits.mjs
 * Force opnieuw: set FORCE=1 (PowerShell: $env:FORCE="1"; node scripts/download-portraits.mjs)
 */
import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const OUT = "assets/portraits";
const SIZE = 280;
const FORCE = process.env.FORCE === "1" || process.env.FORCE === "true";

/**
 * seed = uniek gezicht; hair/skin/glasses = herkenbare stijl
 * (gestileerd caricature — geen echte foto)
 */
const ROSTER = [
  { name: "MrBeast", slug: "mrbeast", seed: "MrBeast-Jimmy", female: false, bg: "f59e0b,ea580c,92400e", hair: "short05", beard: "variant03", skinColor: "f2d3b1", hairColor: "562306", eyes: "variant10" },
  { name: "Pokimane", slug: "pokimane", seed: "Pokimane-Imane", female: true, bg: "ec4899,f472b6,9d174d", hair: "long20", skinColor: "ecad80", hairColor: "592454", eyes: "variant14" },
  { name: "PewDiePie", slug: "pewdiepie", seed: "PewDiePie-Felix", female: false, bg: "3b82f6,2563eb,1e3a8a", hair: "short11", beard: "variant08", glasses: "variant03", skinColor: "f2d3b1", hairColor: "e5d7a3" },
  { name: "Valkyrae", slug: "valkyrae", seed: "Valkyrae-Rae", female: true, bg: "a855f7,7c3aed,4c1d95", hair: "long14", skinColor: "f2d3b1", hairColor: "0e0e0e", eyes: "variant18" },
  { name: "Markiplier", slug: "markiplier", seed: "Markiplier-Mark", female: false, bg: "ef4444,dc2626,7f1d1d", hair: "short08", beard: "variant06", skinColor: "ecad80", hairColor: "0e0e0e", eyes: "variant08" },
  { name: "iJustine", slug: "ijustine", seed: "iJustine-Justine", female: true, bg: "f472b6,ec4899,be185d", hair: "long08", glasses: "variant04", skinColor: "f2d3b1", hairColor: "e5d7a3", eyes: "variant12" },
  { name: "Jacksepticeye", slug: "jacksepticeye", seed: "Jacksepticeye-Sean", female: false, bg: "22c55e,16a34a,14532d", hair: "short16", beard: "variant02", skinColor: "f2d3b1", hairColor: "3eac2c", eyes: "variant16" },
  { name: "SSSniperWolf", slug: "sssniperwolf", seed: "SSSniperWolf-Lia", female: true, bg: "f97316,ea580c,c2410c", hair: "long18", skinColor: "ecad80", hairColor: "592454", eyes: "variant20" },
  { name: "KSI", slug: "ksi", seed: "KSI-JJ", female: false, bg: "eab308,ca8a04,854d0e", hair: "short02", beard: "variant07", skinColor: "9e5622", hairColor: "0e0e0e", eyes: "variant06" },
  { name: "LaurDIY", slug: "laurdiy", seed: "LaurDIY-Lauren", female: true, bg: "fde047,facc15,a16207", hair: "long22", skinColor: "f2d3b1", hairColor: "b9a05f", eyes: "variant11" },
  { name: "Ninja", slug: "ninja", seed: "Ninja-Tyler", female: false, bg: "06b6d4,0284c7,1e3a8a", hair: "short12", skinColor: "f2d3b1", hairColor: "85c2c6", eyes: "variant22" },
  { name: "Emma", slug: "emma", seed: "Emma-Chamberlain", female: true, bg: "fda4af,f43f5e,9f1239", hair: "long06", skinColor: "f2d3b1", hairColor: "592454", eyes: "variant15" },
  { name: "Dream", slug: "dream", seed: "Dream-Mask", female: false, bg: "34d399,10b981,065f46", hair: "short06", skinColor: "f2d3b1", hairColor: "afafaf", eyes: "variant24" },
  { name: "Aphmau", slug: "aphmau", seed: "Aphmau-Jess", female: true, bg: "c084fc,a78bfa,6d28d9", hair: "long12", skinColor: "ecad80", hairColor: "592454", eyes: "variant13" },
  { name: "Vanoss", slug: "vanoss", seed: "VanossGaming", female: false, bg: "64748b,475569,1e293b", hair: "short14", beard: "variant04", glasses: "variant01", skinColor: "f2d3b1", hairColor: "0e0e0e", eyes: "variant09" },
  { name: "Jelly", slug: "jelly", seed: "Jelly-Jelle", female: true, bg: "38bdf8,0ea5e9,0369a1", hair: "long16", skinColor: "f2d3b1", hairColor: "cb6820", eyes: "variant17" },
  { name: "DanTDM", slug: "dantdm", seed: "DanTDM-Dan", female: false, bg: "818cf8,6366f1,4338ca", hair: "short10", beard: "variant01", glasses: "variant04", skinColor: "f2d3b1", hairColor: "ac6511", eyes: "variant14" },
  { name: "Zoella", slug: "zoella", seed: "Zoella-Zoe", female: true, bg: "fb923c,fdba74,c2410c", hair: "long24", skinColor: "ecad80", hairColor: "592454", eyes: "variant19" },
  { name: "Ludwig", slug: "ludwig", seed: "Ludwig-Ahgren", female: false, bg: "fbbf24,f59e0b,b45309", hair: "short18", beard: "variant05", skinColor: "f2d3b1", hairColor: "e5d7a3", eyes: "variant12" },
  { name: "Tana", slug: "tana", seed: "Tana-Mongeau", female: true, bg: "f43f5e,e11d48,9f1239", hair: "long10", glasses: "variant03", skinColor: "f2d3b1", hairColor: "0e0e0e", eyes: "variant21" },
  { name: "xQc", slug: "xqc", seed: "xQc-Felix", female: false, bg: "94a3b8,64748b,334155", hair: "short01", beard: "variant02", skinColor: "f2d3b1", hairColor: "afafaf", eyes: "variant07" },
  { name: "Nikkie", slug: "nikkie", seed: "NikkieTutorials", female: true, bg: "e879f9,d946ef,a21caf", hair: "long04", glasses: "variant05", skinColor: "f2d3b1", hairColor: "e5d7a3", eyes: "variant16" },
  { name: "IShowSpeed", slug: "ishowspeed", seed: "IShowSpeed-Darren", female: false, bg: "ef4444,dc2626,991b1b", hair: "short15", skinColor: "9e5622", hairColor: "0e0e0e", eyes: "variant18" },
  { name: "Anas", slug: "anas", seed: "Anas-Custom", female: false, bg: "2dd4bf,14b8a6,0f766e", hair: "short05", skinColor: "ecad80", hairColor: "562306", eyes: "variant10" },
  { name: "Enzo", slug: "enzo", seed: "Enzo-Knol", female: false, bg: "f97316,ea580c,c2410c", hair: "short09", beard: "variant02", skinColor: "f2d3b1", hairColor: "562306", eyes: "variant11" },
  { name: "Safiya", slug: "safiya", seed: "Safiya-Nygaard", female: true, bg: "a78bfa,8b5cf6,6d28d9", hair: "long26", glasses: "variant02", skinColor: "9e5622", hairColor: "0e0e0e", eyes: "variant15" },
  { name: "Gio", slug: "gio", seed: "Gio-Scott", female: false, bg: "60a5fa,3b82f6,1d4ed8", hair: "short07", beard: "variant03", skinColor: "ecad80", hairColor: "562306", eyes: "variant10" },
  { name: "Gibi", slug: "gibi", seed: "Gibi-ASMR", female: true, bg: "fda4af,f9a8d4,db2777", hair: "long26", skinColor: "f2d3b1", hairColor: "592454", eyes: "variant12" },
  { name: "Kalvijn", slug: "kalvijn", seed: "Kalvijn-Dutch", female: false, bg: "fb7185,e11d48,be123c", hair: "short13", beard: "variant04", glasses: "variant03", skinColor: "f2d3b1", hairColor: "cb6820", eyes: "variant13" },
  { name: "Rosanna", slug: "rosanna", seed: "Rosanna-Pansino", female: true, bg: "fcd34d,fbbf24,d97706", hair: "long25", skinColor: "f2d3b1", hairColor: "ab2a18", eyes: "variant18" },
  { name: "MKBHD", slug: "mkbhd", seed: "MKBHD-Marques", female: false, bg: "1e293b,0f172a,020617", hair: "short03", beard: "variant02", glasses: "variant05", skinColor: "763900", hairColor: "0e0e0e", eyes: "variant05" },
  { name: "Jess", slug: "jess", seed: "Jess-Jessica", female: true, bg: "4ade80,22c55e,15803d", hair: "long21", skinColor: "ecad80", hairColor: "6a4e35", eyes: "variant14" },
];

function buildUrl(c) {
  const p = new URLSearchParams();
  p.set("seed", c.seed || c.name);
  p.set("size", String(SIZE));
  p.set("backgroundType", "gradientLinear");
  p.set("backgroundColor", c.bg);
  p.set("backgroundRotation", "0,360");
  p.set("skinColor", c.skinColor);
  p.set("hairColor", c.hairColor);
  p.set("hair", c.hair);
  if (c.eyes) p.set("eyes", c.eyes);
  if (c.mouth) p.set("mouth", c.mouth);
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
    p.set("featuresProbability", "85");
  }
  return `https://api.dicebear.com/9.x/adventurer/png?${p}`;
}

await mkdir(OUT, { recursive: true });

let ok = 0;
for (const c of ROSTER) {
  const url = buildUrl(c);
  const file = path.join(OUT, c.slug + ".png");
  if (existsSync(file) && !FORCE) {
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
  await new Promise((r) => setTimeout(r, 100));
}

console.log("done", ok, "/", ROSTER.length);
