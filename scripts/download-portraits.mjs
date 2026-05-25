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
const BOY_BG = "60a5fa,3b82f6,1e3a8a";
const GIRL_BG = "fbcfe8,f472b6,be185d";

/** Sync met assets/game/character-traits.js */
const ROSTER = [
  { name: "MrBeast", slug: "mrbeast", seed: "MrBeast-Jimmy", female: false, bg: BOY_BG, hair: "short05", beard: "variant03", skinColor: "f2d3b1", hairColor: "e5d7a3", eyes: "variant10" },
  { name: "PewDiePie", slug: "pewdiepie", seed: "PewDiePie-Felix", female: false, bg: BOY_BG, hair: "short11", beard: "variant08", glasses: "variant03", skinColor: "f2d3b1", hairColor: "e5d7a3" },
  { name: "Markiplier", slug: "markiplier", seed: "Markiplier-Mark", female: false, bg: BOY_BG, hair: "short08", beard: "variant06", skinColor: "ecad80", hairColor: "0e0e0e", eyes: "variant08" },
  { name: "Jacksepticeye", slug: "jacksepticeye", seed: "Jacksepticeye-Sean", female: false, bg: BOY_BG, hair: "short16", beard: "variant02", skinColor: "f2d3b1", hairColor: "3eac2c", eyes: "variant16" },
  { name: "KSI", slug: "ksi", seed: "KSI-JJ", female: false, bg: BOY_BG, hair: "short02", beard: "variant07", skinColor: "9e5622", hairColor: "0e0e0e", eyes: "variant06" },
  { name: "Ninja", slug: "ninja", seed: "Ninja-Tyler", female: false, bg: BOY_BG, hair: "short12", skinColor: "f2d3b1", hairColor: "85c2c6", eyes: "variant22" },
  { name: "Dream", slug: "dream", seed: "Dream-Mask", female: false, bg: BOY_BG, hair: "short06", skinColor: "f2d3b1", hairColor: "afafaf", eyes: "variant24" },
  { name: "DanTDM", slug: "dantdm", seed: "DanTDM-Dan", female: false, bg: BOY_BG, hair: "short10", beard: "variant01", glasses: "variant04", skinColor: "f2d3b1", hairColor: "ac6511", eyes: "variant14" },
  { name: "Ludwig", slug: "ludwig", seed: "Ludwig-Ahgren", female: false, bg: BOY_BG, hair: "short18", beard: "variant05", skinColor: "f2d3b1", hairColor: "e5d7a3", eyes: "variant12" },
  { name: "xQc", slug: "xqc", seed: "xQc-Felix", female: false, bg: BOY_BG, hair: "short01", beard: "variant02", skinColor: "f2d3b1", hairColor: "afafaf", eyes: "variant07" },
  { name: "IShowSpeed", slug: "ishowspeed", seed: "IShowSpeed-Darren", female: false, bg: BOY_BG, hair: "short15", skinColor: "9e5622", hairColor: "0e0e0e", eyes: "variant18" },
  { name: "Logan Paul", slug: "loganpaul", seed: "Logan-Paul-Maverick", female: false, bg: BOY_BG, hair: "short11", skinColor: "f2d3b1", hairColor: "e5d7a3", eyes: "variant12" },
  { name: "MKBHD", slug: "mkbhd", seed: "MKBHD-Marques", female: false, bg: BOY_BG, hair: "short03", beard: "variant02", glasses: "variant05", skinColor: "763900", hairColor: "0e0e0e", eyes: "variant05" },
  { name: "TommyInnit", slug: "tommyinnit", seed: "TommyInnit-Thomas", female: false, bg: BOY_BG, hair: "short09", skinColor: "f2d3b1", hairColor: "cb6820", eyes: "variant11" },
  { name: "CoryxKenshin", slug: "coryxkenshin", seed: "CoryxKenshin-Cory", female: false, bg: BOY_BG, hair: "short07", beard: "variant04", skinColor: "9e5622", hairColor: "0e0e0e", eyes: "variant09" },
  { name: "Rhett", slug: "rhett", seed: "Rhett-Link-McLaughlin", female: false, bg: BOY_BG, hair: "short13", beard: "variant03", glasses: "variant02", skinColor: "f2d3b1", hairColor: "562306", eyes: "variant13" },
  { name: "Pokimane", slug: "pokimane", seed: "Pokimane-Imane", female: true, bg: GIRL_BG, hair: "long20", skinColor: "ecad80", hairColor: "592454", eyes: "variant14" },
  { name: "Valkyrae", slug: "valkyrae", seed: "Valkyrae-Rae", female: true, bg: GIRL_BG, hair: "long14", skinColor: "f2d3b1", hairColor: "0e0e0e", eyes: "variant18" },
  { name: "SSSniperWolf", slug: "sssniperwolf", seed: "SSSniperWolf-Lia", female: true, bg: GIRL_BG, hair: "long18", skinColor: "ecad80", hairColor: "592454", eyes: "variant20" },
  { name: "Emma", slug: "emma", seed: "Emma-Chamberlain", female: true, bg: GIRL_BG, hair: "long06", skinColor: "f2d3b1", hairColor: "592454", eyes: "variant15" },
  { name: "Nikkie", slug: "nikkie", seed: "NikkieTutorials", female: true, bg: GIRL_BG, hair: "long04", glasses: "variant05", skinColor: "f2d3b1", hairColor: "e5d7a3", eyes: "variant16" },
  { name: "Safiya", slug: "safiya", seed: "Safiya-Nygaard", female: true, bg: GIRL_BG, hair: "long26", glasses: "variant02", skinColor: "9e5622", hairColor: "0e0e0e", eyes: "variant15" },
  { name: "Rosanna", slug: "rosanna", seed: "Rosanna-Pansino", female: true, bg: GIRL_BG, hair: "long25", skinColor: "f2d3b1", hairColor: "ab2a18", eyes: "variant18" },
  { name: "Charli", slug: "charli", seed: "Charli-DAmelio", female: true, bg: GIRL_BG, hair: "long10", skinColor: "f2d3b1", hairColor: "0e0e0e", eyes: "variant21" },
  { name: "Addison", slug: "addison", seed: "Addison-Rae", female: true, bg: GIRL_BG, hair: "long22", skinColor: "f2d3b1", hairColor: "592454", eyes: "variant11" },
  { name: "Lilly", slug: "lilly", seed: "Lilly-Singh-Superwoman", female: true, bg: GIRL_BG, hair: "long08", skinColor: "9e5622", hairColor: "0e0e0e", eyes: "variant12" },
  { name: "Liza", slug: "liza", seed: "Liza-Koshy", female: true, bg: GIRL_BG, hair: "long16", skinColor: "9e5622", hairColor: "592454", eyes: "variant17" },
  { name: "Jaiden", slug: "jaiden", seed: "Jaiden-Animations", female: true, bg: GIRL_BG, hair: "long12", skinColor: "f2d3b1", hairColor: "0e0e0e", eyes: "variant13" },
  { name: "Michelle", slug: "michelle", seed: "Michelle-Phan", female: true, bg: GIRL_BG, hair: "long24", skinColor: "ecad80", hairColor: "592454", eyes: "variant19" },
  { name: "Wengie", slug: "wengie", seed: "Wengie-Wendy", female: true, bg: GIRL_BG, hair: "long21", skinColor: "f2d3b1", hairColor: "6a4e35", eyes: "variant14" },
  { name: "Miranda", slug: "miranda", seed: "Miranda-Sings-Colleen", female: true, bg: GIRL_BG, hair: "long26", skinColor: "f2d3b1", hairColor: "e5d7a3", eyes: "variant12" },
  { name: "Bethany", slug: "bethany", seed: "Bethany-Mota", female: true, bg: GIRL_BG, hair: "long18", skinColor: "ecad80", hairColor: "b9a05f", eyes: "variant20" },
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
