import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const preview = fs.readFileSync(path.join(root, "preview.html"), "utf8");
let index = fs.readFileSync(path.join(root, "index.html"), "utf8");

const s = preview.indexOf("    .game-scene {");
const e = preview.indexOf("    .player-character-wrap {");
const css = preview.slice(s, e);

index = index.replace(
  /    \.game-scene \{[\s\S]*?    \.player-character-wrap \{/,
  css + "    .player-character-wrap {"
);

fs.writeFileSync(path.join(root, "index.html"), index);
console.log("css synced");
