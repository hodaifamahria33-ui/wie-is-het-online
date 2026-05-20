const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const t = "div";
const O = (a) => "<" + t + (a ? " " + a : "") + ">";
const C = () => "</" + t + ">";

function patch(file) {
  const p = path.join(root, file);
  let c = fs.readFileSync(p, "utf8");

  if (!c.includes("game-play.css")) {
    c = c.replace(
      '<link rel="stylesheet" href="assets/game/premium-game.css" />',
      '<link rel="stylesheet" href="assets/game/premium-game.css" />\n  <link rel="stylesheet" href="assets/game/game-play.css" />'
    );
  }

  if (!c.includes("game-play.js")) {
    c = c.replace(
      "</main>\n\n  <script>",
      '</main>\n\n  <script src="assets/game/game-play.js"></script>\n\n  <script>'
    );
  }

  if (!c.includes("player-play-area")) {
    const z0 = c.indexOf('class="player-zone"');
    const f0 = c.indexOf('class="player-figure"', z0);
    if (z0 < 0 || f0 < 0) {
      console.warn("markers missing in", file);
    } else {
      const lineStart = c.lastIndexOf("\n", z0) + 1;
      const lineFig = c.lastIndexOf("\n", f0) + 1;
      const newZone = [
        "        <p id=\"game-turn-banner\" class=\"game-turn-banner hidden\" aria-live=\"polite\"></p>",
        "",
        "        " + O('class="player-zone"'),
        "          " + O('class="player-play-area"'),
        "            " + O('class="board-stand board-stand--player"'),
        "              " + O('class="board-tray board-tray--player"'),
        "                " +
          O('class="player-board" id="player-board" aria-label="Jouw bord"'),
        "              " + C(),
        "              " +
          O('class="board-base board-base--player" aria-hidden="true"'),
        "            " + C(),
        "            <aside id=\"secret-card-slot\" class=\"secret-card-slot\" aria-label=\"Jouw geheim personage\"></aside>",
        "          " + C(),
        c.slice(lineFig),
      ].join("\n");
      c = c.slice(0, lineStart) + newZone;
    }
  }

  if (!c.includes("phasePickSecret")) {
    c = c.replace(
      'btnGiveUp: "OPGEVEN",',
      'btnGiveUp: "OPGEVEN",\n        phasePickSecret: "Kies jouw geheime personage",\n        phaseOpponentPick: "Tegenstander kiest…",\n        turnPlayer: "Jouw beurt — klik een kaart om weg te halen",\n        turnOpponent: "Beurt van de tegenstander",'
    );
    c = c.replace(
      'btnGiveUp: "GIVE UP",',
      'btnGiveUp: "GIVE UP",\n        phasePickSecret: "Pick your secret character",\n        phaseOpponentPick: "Opponent is choosing…",\n        turnPlayer: "Your turn — tap a card to eliminate",\n        turnOpponent: "Opponent\'s turn",'
    );
  }

  c = c.replace(
    /for \(let i = 0; i < 24; i\+\+\) \{\s*const down = i % 7 === 3 \|\| i % 11 === 5;\s*\n/g,
    "for (let i = 0; i < 24; i++) {\n"
  );

  if (!c.includes("WieIsHetPlay.init")) {
    c = c.replace(
      "function startGameSession() {\n      buildGameBoards();\n      runCountdownThenTable();\n    }",
      `function initGamePlay() {
      if (!window.WieIsHetPlay) return;
      WieIsHetPlay.init({
        t,
        cardNames: CARD_NAMES,
        cardAvatarUrl,
        screenGame,
        turnBanner: document.getElementById("game-turn-banner"),
        secretSlot: document.getElementById("secret-card-slot"),
        opponentZone: document.querySelector(".opponent-zone"),
      });
    }

    function startGameSession() {
      buildGameBoards();
      if (window.WieIsHetPlay) WieIsHetPlay.wireBoards();
      runCountdownThenTable();
    }`
    );

    c = c.replace(
      "gameTable.classList.remove(\"hidden\");\n            countdownTimeout = null;\n          }, 700);",
      `gameTable.classList.remove("hidden");
            countdownTimeout = null;
            initGamePlay();
            if (window.WieIsHetPlay) WieIsHetPlay.beginPickSecretPhase();
          }, 700);`
    );

    c = c.replace(
      `function resetGameScreen() {
      clearCountdown();
      gameCountdown.classList.add("hidden");
      gameTable.classList.add("hidden");
    }`,
      `function resetGameScreen() {
      clearCountdown();
      gameCountdown.classList.add("hidden");
      gameTable.classList.add("hidden");
      if (window.WieIsHetPlay) WieIsHetPlay.reset();
    }`
    );
  }

  fs.writeFileSync(p, c);
  console.log("patched", file, c.includes("WieIsHetPlay"), c.includes("player-play-area"));
}

patch("preview.html");
patch("index.html");
