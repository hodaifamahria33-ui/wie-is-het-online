import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const html = `        <div class="question-bar-post hidden">
          <p id="post-answer-label" class="post-answer-label"></p>
          <p id="post-answer-timer" class="post-answer-timer" aria-live="polite">10</p>
          <motion class="post-answer-actions">
            <button type="button" id="btn-switch-turn" class="btn-switch-turn" data-i18n="btnSwitch">SWITCH</button>
            <button type="button" id="btn-end-flip-phase" class="btn-end-flip-phase hidden" data-i18n="btnEndTurn">Volgende beurt</button>
          </div>
        </div>
`.replace(/<motion class="post-answer-actions">/, '<motion class="post-answer-actions">'.replace("motion", "motion"))
  .replace('<motion class="post-answer-actions">', '<div class="post-answer-actions">');

function patch(file) {
  const p = path.join(root, file);
  let c = fs.readFileSync(p, "utf8");
  if (c.includes("question-bar-post")) {
    console.log(file, "already patched");
    return;
  }
  const block = `        <div class="question-bar-post hidden">
          <p id="post-answer-label" class="post-answer-label"></p>
          <p id="post-answer-timer" class="post-answer-timer" aria-live="polite">10</p>
          <div class="post-answer-actions">
            <button type="button" id="btn-switch-turn" class="btn-switch-turn" data-i18n="btnSwitch">SWITCH</button>
            <button type="button" id="btn-end-flip-phase" class="btn-end-flip-phase hidden" data-i18n="btnEndTurn">Volgende beurt</button>
          </div>
        </div>
`;
  const re = /(<motion class="question-bar-answer">[\s\S]*?<\/div>\s*)<\/div>\s*\r?\n\s*<div id="win-overlay"/;
  const re2 = /(<div class="question-bar-answer">[\s\S]*?<\/div>\s*)<\/motion>\s*\r?\n\s*<div id="win-overlay"/;
  const re3 = /(<div class="question-bar-answer">[\s\S]*?<\/div>\s*)<\/div>\s*\r?\n\s*<div id="win-overlay"/;
  for (const re of [re3, re2]) {
    if (re.test(c)) {
      c = c.replace(re, `$1${block}      </div>\n\n      <div id="win-overlay"`);
      fs.writeFileSync(p, c);
      console.log(file, "patched");
      return;
    }
  }
  console.log(file, "FAILED");
}

patch("preview.html");
patch("index.html");
