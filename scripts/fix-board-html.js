const fs = require("fs");
const path = require("path");

function fixBoardHtml(file) {
  const p = path.join(__dirname, "..", file);
  let c = fs.readFileSync(p, "utf8");
  const start = c.indexOf('class="board-tray board-tray--player"');
  const end = c.indexOf('<aside id="secret-card-slot"', start);
  if (start < 0 || end < 0) return console.log("skip", file);
  const lineStart = c.lastIndexOf("\n", start) + 1;
  const d = "div";
  const block =
    "              " +
    `<${d} class="board-tray board-tray--player">` +
    "\n                " +
    `<${d} class="player-board" id="player-board" aria-label="Jouw bord"></${d}>` +
    "\n              " +
    `</${d}>` +
    "\n              " +
    `<${d} class="board-base board-base--player" aria-hidden="true"></${d}>` +
    "\n            " +
    `</${d}>` +
    "\n            ";
  c = c.slice(0, lineStart) + block + c.slice(end);
  fs.writeFileSync(p, c);
  console.log("board ok", file);
}

function patchJs(from, to) {
  const src = fs.readFileSync(path.join(__dirname, "..", from), "utf8");
  let dst = fs.readFileSync(path.join(__dirname, "..", to), "utf8");

  if (!dst.includes("game-play.js")) {
    dst = dst.replace(
      "</main>\n\n  <script>",
      '</main>\n\n  <script src="assets/game/game-play.js"></script>\n\n  <script>'
    );
  }

  const i18nBlock = src.match(
    /phasePickSecret:[\s\S]*?turnOpponent:[^\n]+\n/
  );
  if (i18nBlock && !dst.includes("phasePickSecret")) {
    dst = dst.replace(
      'btnGiveUp: "OPGEVEN",\n',
      'btnGiveUp: "OPGEVEN",\n        ' +
        i18nBlock[0].split("\n").slice(0, 4).join("\n        ") +
        "\n"
    );
    dst = dst.replace(
      'btnGiveUp: "GIVE UP",\n',
      'btnGiveUp: "GIVE UP",\n        ' +
        i18nBlock[0]
          .split("\n")
          .slice(4)
          .join("\n        ") +
        "\n"
    );
  }

  const buildStart = src.indexOf("function buildGameBoards()");
  const buildEnd = src.indexOf("function runCountdownThenTable()");
  const buildBlock = src.slice(buildStart, buildEnd);

  const playStart = src.indexOf("function initGamePlay()");
  const playEnd = src.indexOf("async function copyPotCode");
  const playBlock = src.slice(playStart, playEnd);

  const runOld = /function runCountdownThenTable\(\)[\s\S]*?function (initGamePlay|startGameSession)/;
  const runNew = src.slice(
    src.indexOf("function runCountdownThenTable()"),
    src.indexOf("function initGamePlay()")
  );

  if (dst.includes("function buildGameBoards()")) {
    dst = dst.replace(
      /function buildGameBoards\(\)[\s\S]*?function runCountdownThenTable\(\)/,
      buildBlock + "function runCountdownThenTable()"
    );
  }

  if (!dst.includes("function initGamePlay()")) {
    dst = dst.replace(
      /function startGameSession\(\)[\s\S]*?async function copyPotCode/,
      playBlock + "async function copyPotCode"
    );
    dst = dst.replace(runOld, runNew + "function initGamePlay()");
  }

  fs.writeFileSync(path.join(__dirname, "..", to), dst);
  console.log("js ok", to, dst.includes("WieIsHetPlay"));
}

fixBoardHtml("index.html");
patchJs("preview.html", "index.html");
