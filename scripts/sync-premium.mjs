import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const headInsert = `  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@600;700;800&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="assets/game/premium-game.css" />
`;

const ambientBlock = `    <div class="game-ambient" aria-hidden="true"></motion>
    <div class="game-vignette" aria-hidden="true"></motion>
`.replace(/<\/motion>/g, "</div>");

let c = fs.readFileSync(path.join(root, "index.html"), "utf8");
if (!c.includes("premium-game.css")) {
  c = c.replace("<title>Wie Is Het? Online</title>\n", "<title>Wie Is Het? Online</title>\n" + headInsert);
}
if (!c.includes("game-ambient")) {
  c = c.replace(
    '<main id="screen-game" class="screen screen-game-view hidden">\n    <span class="glow"',
    `<main id="screen-game" class="screen screen-game-view hidden">\n${ambientBlock}    <span class="glow"`
  );
}
c = c.replace(/notionists/g, "lorelei").replace(/size=96/g, "size=128");
fs.writeFileSync(path.join(root, "index.html"), c);
console.log("done", c.includes("premium-game.css"), c.includes("game-ambient"));
