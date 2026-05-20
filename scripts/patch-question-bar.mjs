import fs from "fs";
import path from "path";

const root = path.join(import.meta.dirname, "..");

const NEW = `      <div id="question-panel" class="question-bar hidden" aria-live="polite">
        <div class="question-bar-ask">
          <p class="question-bar-label" data-i18n="askQuestionShort">Stel je vraag (tegenstander antwoordt):</p>
          <div class="question-input-row">
            <input type="text" id="question-input" class="question-input" maxlength="100"
              placeholder="Bijv. Is het een jongen?" autocomplete="off" />
            <button type="button" id="btn-send-question" class="btn-send-question" data-i18n="btnAsk">Vraag</button>
          </div>
        </div>
        <div class="question-bar-answer">
          <p class="opponent-question-text"></p>
          <div class="answer-row">
            <button type="button" class="answer-chip" data-answer="yes">JA</button>
            <button type="button" class="answer-chip" data-answer="no">NEE</button>
          </div>
        </div>
      </div>`;

const fixed = NEW.replace(/<\/?motion/g, (m) => (m.startsWith("</") ? "</div" : "<div")).replace(
  /motion class/g,
  "motion class"
);

const re = /<div id="question-panel" class="question-panel hidden"[\s\S]*?<\/div>\s*\n\s*<div id="win-overlay"/;

for (const file of ["preview.html", "index.html"]) {
  let c = fs.readFileSync(path.join(root, file), "utf8");
  c = c.replace(re, fixed + "\n\n      <div id=\"win-overlay\"");
  if (!c.includes("question-input")) {
    console.error("fail", file);
    continue;
  }
  if (!c.includes("askQuestionShort")) {
    c = c.replace(
      'askQuestion: "Stel 1 vraag — tegenstander moet antwoorden",',
      `askQuestion: "Stel 1 vraag — tegenstander moet antwoorden",
        askQuestionShort: "Stel je vraag (tegenstander antwoordt):",
        btnAsk: "Vraag",`
    );
    c = c.replace(
      'askQuestion: "Ask 1 question — opponent must answer",',
      `askQuestion: "Ask 1 question — opponent must answer",
        askQuestionShort: "Ask your question (opponent answers):",
        btnAsk: "Ask",`
    );
  }
  fs.writeFileSync(path.join(root, file), c);
  console.log("ok", file);
}
