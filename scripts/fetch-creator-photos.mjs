import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "assets", "creators");

const FILES = [
  ["mrbeast", "MrBeast_2023_(cropped).jpg"],
  ["pewdiepie", "Pewdiepie_head_shot_(cropped).jpg"],
  ["markiplier", "Markiplier_in_2017.jpg"],
  ["jacksepticeye", "Jacksepticeye_(cropped).png"],
  ["ksi", "JJ_Olatunji_(KSI)_6_(cropped).jpg"],
  ["mkbhd", "Marques_Brownlee_cropped.jpg"],
  ["dantdm", "DanTDM_in_2015.jpg"],
  ["ninja", "Ninja_(Tyler_Blevins)_2018.jpg"],
  ["ludwig", "Ludwig_Ahgren_in_2021.jpg"],
  ["pokimane", "Pokimane_at_TwitchCon_2019.jpg"],
  ["ijustine", "iJustine_by_Gage_Skidmore.jpg"],
  ["rosanna", "Rosanna_Pansino_by_Gage_Skidmore.jpg"],
  ["nikkie", "Nikkie_de_Jonge,_2011.jpg"],
  ["emma", "Emma_Chamberlain_in_2019.jpg"],
  ["ishowspeed", "IShowSpeed_in_2022.jpg"],
  ["enzo", "Enzo_Knol_(2016).jpg"],
  ["xqc", "xQc_in_2021.jpg"],
  ["safiya", "Safiya_Nygaard_by_Gage_Skidmore.jpg"],
  ["zoella", "Zoella_by_Gage_Skidmore.jpg"],
];

async function wikiThumb(fileName, width = 320) {
  const title = encodeURIComponent("File:" + fileName);
  const api =
    "https://commons.wikimedia.org/w/api.php?action=query&titles=" +
    title +
    "&prop=imageinfo&iiprop=url&iiurlwidth=" +
    width +
    "&format=json";
  const res = await fetch(api, { headers: { "User-Agent": "WieIsHetOnline/1.0 (educational game)" } });
  const data = await res.json();
  const pages = data.query?.pages || {};
  const page = Object.values(pages)[0];
  if (page?.missing) return null;
  return page.imageinfo?.[0]?.thumburl || page.imageinfo?.[0]?.url || null;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

fs.mkdirSync(outDir, { recursive: true });
const manifest = {};

for (const [slug, file] of FILES) {
  await sleep(2200);
  try {
    const url = await wikiThumb(file);
    if (!url) {
      console.log("MISS", slug, file);
      continue;
    }
    const ext = path.extname(file).toLowerCase() || ".jpg";
    const dest = path.join(outDir, slug + ext);
    const img = await fetch(url, { headers: { "User-Agent": "WieIsHetOnline/1.0" } });
    if (!img.ok) {
      console.log("FAIL", slug, img.status);
      continue;
    }
    fs.writeFileSync(dest, Buffer.from(await img.arrayBuffer()));
    manifest[slug] = "assets/creators/" + slug + ext;
    console.log("OK", slug, "->", manifest[slug]);
  } catch (err) {
    console.log("ERR", slug, err.message);
  }
}

fs.writeFileSync(path.join(outDir, "manifest.json"), JSON.stringify(manifest, null, 2));
console.log("Done:", Object.keys(manifest).length, "photos");
