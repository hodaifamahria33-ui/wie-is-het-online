import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const newLoop = `        const down = i % 7 === 3 || i % 11 === 5;
        const name = CARD_NAMES[i];

        const well = document.createElement("motion");
        well.className = "card-well";
        const tile = document.createElement("motion");
        tile.className = "card-tile" + (down ? " is-down" : "");
        const face = document.createElement("motion");
        face.className = "card-face";
        const photoWrap = document.createElement("motion");
        photoWrap.className = "card-photo";
        const img = document.createElement("img");
        img.className = "card-img";
        img.src = cardAvatarUrl(name);
        img.alt = name;
        img.loading = "lazy";
        img.onerror = function () {
          const ph = document.createElement("span");
          ph.className = "face-ph";
          ph.setAttribute("aria-hidden", "true");
          this.replaceWith(ph);
        };
        photoWrap.appendChild(img);
        const label = document.createElement("span");
        label.className = "card-name";
        label.textContent = name;
        face.append(photoWrap, label);
        tile.appendChild(face);
        well.appendChild(tile);
        player.appendChild(well);

        const oppWell = document.createElement("motion");
        oppWell.className = "card-well";
        const oppTile = document.createElement("motion");
        oppTile.className = "card-tile card-tile--opp" + (down ? " is-down" : "");
        const back = document.createElement("motion");
        back.className = "card-back-face";
        back.setAttribute("aria-hidden", "true");
        oppTile.appendChild(back);
        oppWell.appendChild(oppTile);
        opponent.appendChild(oppWell);`.replace(/createElement\("motion"\)/g, 'createElement("div")');

const avatarFn = `    function cardAvatarUrl(name) {
      return (
        "https://api.dicebear.com/7.x/notionists/png?seed=" +
        encodeURIComponent(name) +
        "&size=96&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf"
      );
    }

`;

const re =
  /const down = i % 7 === 3 \|\| i % 11 === 5;[\s\S]*?opponent\.appendChild\(oppWell\);/;

for (const file of ["preview.html", "index.html"]) {
  const p = path.join(root, file);
  let c = fs.readFileSync(p, "utf8");

  if (!c.includes("function cardAvatarUrl")) {
    if (c.includes("const CARD_NAMES")) {
      c = c.replace(
        /const CARD_NAMES = \[[\s\S]*?\];\s*\n\s*function buildGameBoards/,
        (m) => m.replace("function buildGameBoards", avatarFn + "function buildGameBoards")
      );
    } else {
      c = c.replace(
        "function buildGameBoards() {",
        avatarFn + "function buildGameBoards() {"
      );
    }
  }

  if (!re.test(c)) {
    console.log("skip loop (no match):", file);
    continue;
  }
  c = c.replace(re, newLoop);
  fs.writeFileSync(p, c);
  console.log("ok", file);
}
