import fs from "fs";
import path from "path";

const root = path.join(import.meta.dirname, "..");
const files = ["preview.html", "index.html"];

const CARD_BLOCK = `    const CARD_NAMES = [
      "Anne", "Max", "Tom", "Lisa", "Ben", "Sara", "Noah", "Emma",
      "Jack", "Mila", "Lucas", "Fleur", "Daan", "Evi", "Sam", "Nina",
      "Finn", "Lynn", "Tim", "Zoe", "Ole", "Ivy", "Raj", "Amy",
      "Erik", "Kim", "Jay", "Lea", "Fox", "Joy", "Ian", "Rio"
    ];`;

for (const file of files) {
  let c = fs.readFileSync(path.join(root, file), "utf8");

  if (!c.includes("peerjs.min.js")) {
    c = c.replace(
      '<script src="assets/game/game-play.js"></script>',
      `<script src="https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js"></script>
  <script src="assets/game/online-room.js"></script>
  <script src="assets/game/game-play.js"></script>`
    );
  }

  c = c.replace(/grid-template-columns: repeat\(6, 1fr\);/g, "grid-template-columns: repeat(4, 1fr);");

  c = c.replace(
    /const CARD_NAMES = \[[\s\S]*?\];/,
    CARD_BLOCK
  );

  c = c.replace(/for \(let i = 0; i < 24; i\+\+\)/g, "for (let i = 0; i < CARD_NAMES.length; i++)");

  if (!c.includes("phaseWaitOpponent")) {
    c = c.replace(
      'phaseOpponentPick: "Tegenstander kiest geheim personage",',
      `phaseOpponentPick: "Tegenstander kiest geheim personage",
        phaseWaitOpponent: "Wachten op tegenstander…",`
    );
    c = c.replace(
      'phaseOpponentPick: "Opponent is picking a secret",',
      `phaseOpponentPick: "Opponent is picking a secret",
        phaseWaitOpponent: "Waiting for opponent…",`
    );
  }

  if (!c.includes("let sessionMode")) {
    c = c.replace(
      "    const CARD_NAMES = [",
      `    let sessionMode = "solo";
    let sessionCode = "";
    let onlineGameUnsub = null;

    const CARD_NAMES = [`
    );
  }

  if (!c.includes("WieIsHetOnline.setupHost")) {
    c = c.replace(
      `          lobbyCode.textContent = code;
          screenHost.classList.add("hidden");`,
      `          lobbyCode.textContent = code.toUpperCase();
          sessionMode = "host";
          sessionCode = lobbyCode.textContent;
          if (window.WieIsHetOnline) {
            WieIsHetOnline.setupHost(sessionCode).catch(() => {
              sessionMode = "solo";
            });
          }
          screenHost.classList.add("hidden");`
    );

    c = c.replace(
      `      runJoinLoading(c, () => {
        screenJoined.classList.remove("hidden");
        screenJoined.classList.add("transition-active");
      });`,
      `      runJoinLoading(c, () => {
        sessionMode = "guest";
        sessionCode = c;
        if (window.WieIsHetOnline) {
          WieIsHetOnline.setupGuest(sessionCode).catch(() => {
            sessionMode = "solo";
          });
        }
        screenJoined.classList.remove("hidden");
        screenJoined.classList.add("transition-active");
        wireGuestOnline();
      });`
    );

    c = c.replace(
      `      runJoinLoading(code, () => {
        screenJoined.classList.remove("hidden");
      });`,
      `      runJoinLoading(code, () => {
        sessionMode = "guest";
        sessionCode = code.toUpperCase();
        joinedCode.textContent = sessionCode;
        if (window.WieIsHetOnline) {
          WieIsHetOnline.setupGuest(sessionCode).catch(() => {
            sessionMode = "solo";
          });
        }
        screenJoined.classList.remove("hidden");
        wireGuestOnline();
      });`
    );
  }

  if (!c.includes("function wireGuestOnline")) {
    c = c.replace(
      "    function startGameSession() {",
      `    function wireGuestOnline() {
      if (onlineGameUnsub) onlineGameUnsub();
      if (!window.WieIsHetOnline) return;
      onlineGameUnsub = WieIsHetOnline.onMessage((msg) => {
        if (msg.type !== "gameStart") return;
        [screenStart, screenMenu, screenHost, screenLobby, screenJoin, screenJoined].forEach((s) =>
          s.classList.add("hidden")
        );
        screenGame.classList.remove("hidden");
        startGameSession();
      });
    }

    function startGameSession() {`
    );
  }

  c = c.replace(
    `      WieIsHetPlay.init({
        t,
        cardNames: CARD_NAMES,
        cardAvatarUrl,
        screenGame,
        turnBanner: document.getElementById("game-turn-banner"),
        secretSlot: document.getElementById("secret-card-slot"),
        opponentZone: document.querySelector(".opponent-zone"),
      });`,
    `      WieIsHetPlay.init({
        t,
        screenGame,
        turnBanner: document.getElementById("game-turn-banner"),
        secretSlot: document.getElementById("secret-card-slot"),
        opponentZone: document.querySelector(".opponent-zone"),
        online: sessionMode !== "solo" && window.WieIsHetOnline && WieIsHetOnline.isOnline(),
        isHost: sessionMode === "host",
      });`
  );

  c = c.replace(
    `    document.getElementById("btn-start-game").addEventListener("click", () => {
      const c = lobbyCode.textContent.trim();
      if (!c || c === "-----") return;
      transition(screenLobby, screenGame, "transition-in-from-right");
      setTimeout(startGameSession, TRANSITION_MS + 50);
    });`,
    `    document.getElementById("btn-start-game").addEventListener("click", () => {
      const c = lobbyCode.textContent.trim();
      if (!c || c === "-----") return;
      if (window.WieIsHetOnline && sessionMode === "host") {
        WieIsHetOnline.broadcastGameStart();
      }
      transition(screenLobby, screenGame, "transition-in-from-right");
      setTimeout(startGameSession, TRANSITION_MS + 50);
    });`
  );

  c = c.replace(
    `    function resetGameScreen() {
      clearCountdown();
      gameCountdown.classList.add("hidden");
      gameTable.classList.add("hidden");
      if (window.WieIsHetPlay) WieIsHetPlay.reset();
    }`,
    `    function resetGameScreen() {
      clearCountdown();
      gameCountdown.classList.add("hidden");
      gameTable.classList.add("hidden");
      if (window.WieIsHetPlay) WieIsHetPlay.reset();
    }

    function leaveOnlineSession() {
      if (onlineGameUnsub) {
        onlineGameUnsub();
        onlineGameUnsub = null;
      }
      if (window.WieIsHetOnline) WieIsHetOnline.reset();
      sessionMode = "solo";
      sessionCode = "";
    }`
  );

  if (!c.includes("leaveOnlineSession()")) {
    c = c.replace(
      "      resetGameScreen();\n      transition(screenGame, screenLobby",
      "      resetGameScreen();\n      leaveOnlineSession();\n      transition(screenGame, screenLobby"
    );
  }

  c = c.replace(
    `    /* Klassiek Wie is het: blauw bord tegenstander */
    .board-tray--opponent {
      background: linear-gradient(180deg, #4d9bff 0%, #2563eb 28%, #1d4ed8 55%, #1e40af 100%);
    }

    /* Klassiek Wie is het: rood bord speler */
    .board-tray--player {
      background: linear-gradient(180deg, #ff6b7a 0%, #e11d48 28%, #be123c 55%, #9f1239 100%);
    }`,
    `    /* Rood = tegenstander (boven), blauw = speler (onder) — premium-game.css */
    .board-tray--opponent,
    .board-tray--player {
      background: unset;
    }`
  );

  c = c.replace(
    `.board-base--opponent {
      background: linear-gradient(180deg, #1e3a8a 0%, #172554 100%);
    }

    .board-base--player {
      background: linear-gradient(180deg, #881337 0%, #4c0519 100%);
    }`,
    `.board-base--opponent,
    .board-base--player {
      background: unset;
    }`
  );

  fs.writeFileSync(path.join(root, file), c);
  console.log("patched", file);
}
