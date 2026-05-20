import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const preview = fs.readFileSync(path.join(root, "preview.html"), "utf8");
let index = fs.readFileSync(path.join(root, "index.html"), "utf8");

// HTML block
const htmlOld = /<section id="game-countdown"[\s\S]*?<\/section>\s*\n\s*<div class="game-table"/;
const htmlNew = preview.match(htmlOld)?.[0];
if (htmlNew) {
  index = index.replace(htmlOld, htmlNew + "\n\n    <motion class=\"game-table\"");
  index = index.replace(
    /<motion class="game-table"/,
    '<motion class="game-table"'
  );
}

// Fix motion typo if any
index = index.replace(
  /<motion class="countdown-photos"[^>]*><\/motion>/g,
  '<div class="countdown-photos" id="countdown-photos" aria-hidden="true"></div>'
);
index = index.replace(
  /<section id="game-countdown"[\s\S]*?<p id="countdown-num" class="countdown-num">5<\/p>[\s\S]*?<\/section>/,
  preview.match(
    /<section id="game-countdown"[\s\S]*?<\/section>/
  )?.[0] || ""
);

// CSS block
const cssStart = "    .game-countdown.hidden { display: none; }";
const cssEnd = "    .countdown-label {";
const pCss = preview.indexOf(cssStart);
const pCssEnd = preview.indexOf(cssEnd, pCss);
if (pCss >= 0 && pCssEnd > pCss) {
  const block = preview.slice(pCss, pCssEnd);
  const iStart = index.indexOf(cssStart);
  const iEnd = index.indexOf(cssEnd, iStart);
  if (iStart >= 0 && iEnd > iStart) {
    index = index.slice(0, iStart) + block + index.slice(iEnd);
  }
}

// JS
index = index.replace(/const PHOTO_LOAD_MS = 1200;\n/, "const PHOTO_LOAD_MS = 1200;\n    const COUNTDOWN_SEC = 3;\n");
if (!index.includes("buildCountdownPhotos")) {
  const fn = preview.match(/function buildCountdownPhotos\(\)[\s\S]*?function runCountdownThenTable\(\)/)?.[0];
  if (fn) {
    index = index.replace(
      /function runCountdownThenTable\(\) \{\n      gameCountdown/,
      fn + " {\n      buildCountdownPhotos();\n      gameCountdown"
    );
    index = index.replace(/let n = 5;/, "let n = COUNTDOWN_SEC;");
  }
}

index = index.replace(/let n = 5;/g, "let n = COUNTDOWN_SEC;");
if (!index.includes("COUNTDOWN_SEC")) {
  index = index.replace(
    "const PHOTO_LOAD_MS = 1200;",
    "const PHOTO_LOAD_MS = 1200;\n    const COUNTDOWN_SEC = 3;"
  );
}

fs.writeFileSync(path.join(root, "index.html"), index);
console.log("synced index.html");
