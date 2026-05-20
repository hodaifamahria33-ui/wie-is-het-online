import fs from "fs";
import path from "path";

const root = path.join(import.meta.dirname, "..");

const chestBlock = `            <div class="player-play-area">
              <button type="button" class="opponent-chest" id="opponent-chest" aria-label="Tegenstander schat">
                <div class="chest-visual">
                  <img class="chest-avatar" src="assets/game/opponent-face.png" alt=""
                    onerror="this.src='https://api.dicebear.com/7.x/lorelei/png?seed=Opponent&size=128'" />
                </div>
                <span class="chest-label" data-i18n="chestLabel">Tegenstander</span>
                <span class="chest-hint" data-i18n="chestHint">Klik om te raden</span>
                <span id="opponent-answer" class="opponent-answer hidden" aria-live="polite"></span>
              </button>
              <div class="board-stand board-stand--player board-stand--front">
                <div class="board-tray board-tray--player">
                  <div class="player-board" id="player-board" aria-label="Jouw bord"></div>
                </div>
                <div class="board-base board-base--player" aria-hidden="true"></div>
              </div>
              <aside id="secret-card-slot" class="secret-card-slot" aria-label="Jouw geheim personage"></aside>
            </div>`;

const chestFixed = chestBlock.replace(/<\/?motion/g, (m) =>
  m.startsWith("</") ? "</div" : "<div"
).replace(/motion class/g, "div class");

const overlayBlock = `
      <div id="question-panel" class="question-panel hidden" aria-live="polite">
        <p class="question-title"></p>
        <p class="opponent-question-text"></p>
        <div class="question-chips">
          <button type="button" class="question-chip" data-question-id="boy" data-question-text="Is het een jongen?">Is het een jongen?</button>
          <button type="button" class="question-chip" data-question-id="girl" data-question-text="Is het een meisje?">Is het een meisje?</button>
          <button type="button" class="question-chip" data-question-id="short" data-question-text="Heeft de naam 3 letters?">Heeft de naam 3 letters?</button>
          <button type="button" class="question-chip" data-question-id="long" data-question-text="Heeft de naam 4+ letters?">Heeft de naam 4+ letters?</button>
          <button type="button" class="question-chip" data-question-id="a-m" data-question-text="Begint de naam met A–M?">Begint de naam met A–M?</button>
          <button type="button" class="question-chip" data-question-id="n-z" data-question-text="Begint de naam met N–Z?">Begint de naam met N–Z?</button>
        </div>
        <div class="answer-row">
          <button type="button" class="answer-chip" data-answer="yes">JA</button>
          <button type="button" class="answer-chip" data-answer="no">NEE</button>
        </div>
      </div>

      <div id="win-overlay" class="win-overlay hidden" role="dialog" aria-modal="true">
        <div class="win-confetti" aria-hidden="true"></div>
        <div class="win-card">
          <p class="win-title">YOU WON!</p>
          <p class="win-sub" data-i18n="winSub">Je raadde het personage!</p>
        </div>
      </div>

`;

for (const file of ["preview.html", "index.html"]) {
  let c = fs.readFileSync(path.join(root, file), "utf8");

  if (!c.includes("game-extras.css")) {
    c = c.replace(
      'href="assets/game/game-layout.css" />',
      'href="assets/game/game-layout.css" />\n  <link rel="stylesheet" href="assets/game/game-extras.css" />'
    );
  }

  if (!c.includes("opponent-chest")) {
    const re =
      /            <div class="player-play-area">[\s\S]*?            <\/motion>\r?\n          <\/div>\r?\n          <div class="opponent-chair"/;
    const wrong = re.source.includes("motion");
    const re2 =
      /            <div class="player-play-area">[\s\S]*?<aside id="secret-card-slot"[\s\S]*?<\/aside>\r?\n            <\/div>\r?\n          <\/motion>/;
    const re3 =
      /            <div class="player-play-area">[\s\S]*?<aside id="secret-card-slot"[\s\S]*?<\/aside>\r?\n            <\/div>\r?\n          <\/div>/;
    if (re3.test(c)) {
      c = c.replace(re3, chestFixed.trimEnd() + "\n          </motion>");
      c = c.replace("\n          </motion>", "\n          </div>");
    } else if (re2.test(c)) {
      c = c.replace(re2, chestFixed.trimEnd() + "\n          </div>");
    } else {
      console.error("play-area block not found in", file);
    }
  }

  if (!c.includes("question-panel")) {
    c = c.replace(
      '        <p id="game-turn-banner" class="game-turn-banner hidden" aria-live="polite"></p>',
      overlayBlock + '        <p id="game-turn-banner" class="game-turn-banner hidden" aria-live="polite"></p>'
    );
  }

  if (!c.includes("askQuestion:")) {
    c = c.replace(
      '        turnOpponent: "Beurt van de tegenstander",',
      `        turnOpponent: "Beurt van de tegenstander",
        askQuestion: "Stel 1 vraag — tegenstander moet antwoorden",
        answerOpponentQuestion: "Tegenstander vraagt — jij antwoordt:",
        answerYes: "JA",
        answerNo: "NEE",
        opponentAnswered: "Antwoord:",
        guessPrompt: "Wie is het? Klik op een personage",
        guessWrong: "Fout! Dat was het niet…",
        youWon: "YOU WON!",
        youLost: "Helaas…",
        winSub: "Je raadde het personage!",
        chestLabel: "Tegenstander",
        chestHint: "Klik om te raden",`
    );
    c = c.replace(
      `        turnOpponent: "Opponent's turn",`,
      `        turnOpponent: "Opponent's turn",
        askQuestion: "Ask 1 question — opponent must answer",
        answerOpponentQuestion: "Opponent asks — you answer:",
        answerYes: "YES",
        answerNo: "NO",
        opponentAnswered: "Answer:",
        guessPrompt: "Who is it? Tap a character",
        guessWrong: "Wrong! That wasn't it…",
        youWon: "YOU WON!",
        youLost: "Game over",
        winSub: "You guessed the character!",
        chestLabel: "Opponent",
        chestHint: "Tap to guess",`
    );
  }

  if (!c.includes("opponentChest:")) {
    c = c.replace(
      "        opponentZone: document.querySelector(\".opponent-zone\"),",
      `        opponentZone: document.querySelector(".opponent-zone"),
        opponentChest: document.getElementById("opponent-chest"),
        opponentAnswerEl: document.getElementById("opponent-answer"),
        questionPanel: document.getElementById("question-panel"),
        winOverlay: document.getElementById("win-overlay"),`
    );
    c = c.replace(
      "        t,\n        screenGame,",
      "        t,\n        cardNames: CARD_NAMES,\n        screenGame,"
    );
  }

  fs.writeFileSync(path.join(root, file), c);
  console.log("ok", file, c.includes("opponent-chest"), c.includes("question-panel"));
}
