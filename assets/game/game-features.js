/**
 * Extra spelplezier: tutorial, stats, daily challenge, bot-tips, emotes.
 */
(function () {
  const TUTORIAL_KEY = "wieTutorialDone_v1";
  const BOT_GAMES_KEY = "wieBotGamesPlayed";
  const STATS_KEY = "wiePlayerStats_v1";
  const CARD_MODE_KEY = "wieCardMode";

  let cardMode = "full";
  let tutorialStep = 0;
  let tutorialOnDone = null;

  function t(key) {
    return typeof window.wieMsg === "function" ? window.wieMsg(key) : key;
  }

  function hashDate(d) {
    const s = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }

  function pickDailyIndices(len, count, seed) {
    const indices = [];
    let x = seed || 1;
    const used = new Set();
    while (indices.length < count && indices.length < len) {
      x = (x * 1103515245 + 12345) >>> 0;
      const idx = x % len;
      if (!used.has(idx)) {
        used.add(idx);
        indices.push(idx);
      }
    }
    for (let i = 0; indices.length < count && i < len; i++) {
      if (!used.has(i)) indices.push(i);
    }
    return indices;
  }

  function getStats() {
    try {
      const raw = localStorage.getItem(STATS_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {
      /* ignore */
    }
    return { wins: 0, losses: 0, played: 0 };
  }

  function saveStats(s) {
    localStorage.setItem(STATS_KEY, JSON.stringify(s));
  }

  function mountTutorial() {
    if (document.getElementById("tutorial-overlay")) return;
    const el = document.createElement("div");
    el.id = "tutorial-overlay";
    el.className = "tutorial-overlay hidden";
    el.setAttribute("role", "dialog");
    el.setAttribute("aria-modal", "true");
    el.innerHTML =
      '<div class="tutorial-card">' +
      '<div class="tutorial-step-dots" aria-hidden="true">' +
      '<span class="tutorial-dot" data-step="0"></span>' +
      '<span class="tutorial-dot" data-step="1"></span>' +
      '<span class="tutorial-dot" data-step="2"></span>' +
      "</div>" +
      '<p class="tutorial-icon" id="tutorial-icon">🎴</p>' +
      '<h2 class="tutorial-title" id="tutorial-title"></h2>' +
      '<p class="tutorial-text" id="tutorial-text"></p>' +
      '<div class="tutorial-actions">' +
      '<button type="button" class="tutorial-btn tutorial-btn--primary" id="tutorial-next"></button>' +
      '<button type="button" class="tutorial-btn tutorial-btn--ghost" id="tutorial-skip"></button>' +
      "</div></div>";
    document.body.appendChild(el);
    document.getElementById("tutorial-next").addEventListener("click", () => {
      if (window.WieSounds) WieSounds.play("ui");
      if (tutorialStep < 2) {
        tutorialStep++;
        renderTutorialStep();
      } else {
        finishTutorial();
      }
    });
    document.getElementById("tutorial-skip").addEventListener("click", () => {
      if (window.WieSounds) WieSounds.play("ui");
      finishTutorial();
    });
  }

  const TUTORIAL_STEPS = [
    { icon: "🎴", title: "tutorialStep1Title", text: "tutorialStep1Text" },
    { icon: "❓", title: "tutorialStep2Title", text: "tutorialStep2Text" },
    { icon: "🏆", title: "tutorialStep3Title", text: "tutorialStep3Text" },
  ];

  function renderTutorialStep() {
    const step = TUTORIAL_STEPS[tutorialStep];
    const icon = document.getElementById("tutorial-icon");
    const title = document.getElementById("tutorial-title");
    const text = document.getElementById("tutorial-text");
    const next = document.getElementById("tutorial-next");
    if (icon) icon.textContent = step.icon;
    if (title) title.textContent = t(step.title);
    if (text) text.textContent = t(step.text);
    if (next) {
      next.textContent = tutorialStep < 2 ? t("tutorialNext") : t("tutorialStart");
    }
    document.querySelectorAll(".tutorial-dot").forEach((dot) => {
      const n = parseInt(dot.getAttribute("data-step"), 10);
      dot.classList.toggle("is-active", n === tutorialStep);
    });
    const skip = document.getElementById("tutorial-skip");
    if (skip) skip.textContent = t("tutorialSkip");
  }

  function finishTutorial() {
    localStorage.setItem(TUTORIAL_KEY, "1");
    const overlay = document.getElementById("tutorial-overlay");
    if (overlay) overlay.classList.add("hidden");
    const cb = tutorialOnDone;
    tutorialOnDone = null;
    if (typeof cb === "function") cb();
  }

  function mountCoachTip() {
    const sg = document.getElementById("screen-game");
    if (!sg || document.getElementById("game-coach-tip")) return;
    const tip = document.createElement("p");
    tip.id = "game-coach-tip";
    tip.className = "game-coach-tip hidden";
    tip.setAttribute("aria-live", "polite");
    sg.appendChild(tip);
  }

  function mountSoundToggle() {
    if (document.getElementById("btn-sound-toggle")) return;
    const btn = document.createElement("button");
    btn.type = "button";
    btn.id = "btn-sound-toggle";
    btn.className = "sound-toggle";
    btn.setAttribute("aria-label", t("soundToggleAria"));
    function refresh() {
      const on = window.WieSounds && WieSounds.isEnabled();
      btn.textContent = on ? "🔊" : "🔇";
    }
    btn.addEventListener("click", () => {
      if (!window.WieSounds) return;
      WieSounds.setEnabled(!WieSounds.isEnabled());
      refresh();
      if (WieSounds.isEnabled()) WieSounds.play("ui");
    });
    document.body.appendChild(btn);
    refresh();
  }

  function mountLobbyEmotes() {
    const panels = document.querySelectorAll(".lobby-chat-panel");
    const emotes = ["👍", "😂", "🔥", "👋"];
    panels.forEach((panel) => {
      if (panel.querySelector(".lobby-emotes")) return;
      const bar = document.createElement("div");
      bar.className = "lobby-emotes";
      bar.setAttribute("aria-label", t("lobbyEmotesLabel"));
      emotes.forEach((emo) => {
        const b = document.createElement("button");
        b.type = "button";
        b.className = "lobby-emote-btn";
        b.textContent = emo;
        b.addEventListener("click", () => {
          if (window.WieSounds) WieSounds.play("ui");
          if (window.WieLobby && WieLobby.sendMessage) WieLobby.sendMessage(emo);
        });
      });
      const form = panel.querySelector(".lobby-chat-form");
      if (form) panel.insertBefore(bar, form);
      else panel.appendChild(bar);
    });
  }

  function updateModeStatsUI() {
    const el = document.getElementById("mode-stats-line");
    if (!el) return;
    const s = getStats();
    if (s.played < 1) {
      el.classList.add("hidden");
      return;
    }
    el.classList.remove("hidden");
    el.textContent = t("modeStatsLine")
      .replace("{wins}", String(s.wins))
      .replace("{losses}", String(s.losses))
      .replace("{played}", String(s.played));
  }

  window.WieGameFeatures = {
    init() {
      cardMode = localStorage.getItem(CARD_MODE_KEY) || "full";
      document.documentElement.classList.toggle(
        "wie-daily-challenge",
        cardMode === "daily"
      );
      mountTutorial();
      mountCoachTip();
      mountSoundToggle();
      mountLobbyEmotes();
      updateModeStatsUI();
      const skip = document.getElementById("tutorial-skip");
      if (skip && !skip.textContent) skip.textContent = t("tutorialSkip");
    },

    setCardMode(mode) {
      cardMode = mode === "daily" ? "daily" : "full";
      localStorage.setItem(CARD_MODE_KEY, cardMode);
      document.documentElement.classList.toggle(
        "wie-daily-challenge",
        cardMode === "daily"
      );
    },

    getCardMode() {
      return cardMode;
    },

    getActiveCardNames(fullList) {
      const list = fullList && fullList.length ? fullList.slice() : [];
      if (cardMode !== "daily" || list.length < 17) return list;
      const h = hashDate(new Date());
      const idx = pickDailyIndices(list.length, 16, h);
      const picked = idx.map((i) => list[i]).filter(Boolean);
      return picked.length >= 16 ? picked.slice(0, 16) : list;
    },

    getDailyCardNames(fullList) {
      const prev = cardMode;
      cardMode = "daily";
      const names = this.getActiveCardNames(fullList);
      cardMode = prev;
      return names;
    },

    getDailyLabel() {
      const d = new Date();
      return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
    },

    shouldShowTutorial() {
      return localStorage.getItem(TUTORIAL_KEY) !== "1";
    },

    maybeShowTutorial(onDone) {
      if (!this.shouldShowTutorial()) {
        if (typeof onDone === "function") onDone();
        return;
      }
      tutorialStep = 0;
      tutorialOnDone = onDone;
      const overlay = document.getElementById("tutorial-overlay");
      if (!overlay) {
        if (typeof onDone === "function") onDone();
        return;
      }
      renderTutorialStep();
      overlay.classList.remove("hidden");
    },

    recordResult(won) {
      const s = getStats();
      s.played++;
      if (won) s.wins++;
      else s.losses++;
      saveStats(s);
      updateModeStatsUI();
    },

    recordBotGamePlayed() {
      const n = parseInt(localStorage.getItem(BOT_GAMES_KEY) || "0", 10) + 1;
      localStorage.setItem(BOT_GAMES_KEY, String(n));
      return n;
    },

    isFirstBotGame() {
      return parseInt(localStorage.getItem(BOT_GAMES_KEY) || "0", 10) < 1;
    },

    showBotTip(phase) {
      if (!this.isFirstBotGame()) return;
      const tip = document.getElementById("game-coach-tip");
      if (!tip) return;
      const keys = {
        pick: "botTipPick",
        ask: "botTipAsk",
        guess: "botTipGuess",
      };
      const key = keys[phase];
      if (!key) {
        tip.classList.add("hidden");
        return;
      }
      tip.textContent = t(key);
      tip.classList.remove("hidden");
    },

    hideBotTip() {
      const tip = document.getElementById("game-coach-tip");
      if (tip) tip.classList.add("hidden");
    },

    onGameEnd(won) {
      this.recordResult(won);
      this.hideBotTip();
      if (won && document.getElementById("screen-game")) {
        document.getElementById("screen-game").classList.add("game-win-flash");
        window.setTimeout(() => {
          document.getElementById("screen-game")?.classList.remove("game-win-flash");
        }, 600);
      }
    },

    refreshLobbyEmotes: mountLobbyEmotes,
    updateModeStatsUI,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => WieGameFeatures.init());
  } else {
    WieGameFeatures.init();
  }
})();
