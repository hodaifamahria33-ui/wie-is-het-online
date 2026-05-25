/**
 * Dagelijkse challenges: apart scherm met opdrachten + speeltimer.
 */
(function () {
  const STORAGE_KEY = "wieDailyMissions_v2";
  const MISSIONS_PER_DAY = 3;

  const MISSION_POOL = [
    {
      id: "win_3",
      type: "wins_today",
      target: 3,
      icon: "🏆",
      titleKey: "dmWin3Title",
      descKey: "dmWin3Desc",
      bot: "medium",
    },
    {
      id: "win_1",
      type: "wins_today",
      target: 1,
      icon: "✨",
      titleKey: "dmWin1Title",
      descKey: "dmWin1Desc",
      bot: "medium",
    },
    {
      id: "win_fast",
      type: "win_under_ms",
      target: 180000,
      icon: "⚡",
      titleKey: "dmWinFastTitle",
      descKey: "dmWinFastDesc",
      bot: "medium",
    },
    {
      id: "guess_30",
      type: "guess_under_ms",
      target: 30000,
      icon: "🎯",
      titleKey: "dmGuess30Title",
      descKey: "dmGuess30Desc",
      bot: "medium",
    },
    {
      id: "win_hard",
      type: "win_hard",
      target: 1,
      icon: "🔥",
      titleKey: "dmWinHardTitle",
      descKey: "dmWinHardDesc",
      bot: "hard",
    },
    {
      id: "play_5",
      type: "plays_today",
      target: 5,
      icon: "🎮",
      titleKey: "dmPlay5Title",
      descKey: "dmPlay5Desc",
      bot: "easy",
    },
    {
      id: "streak_2",
      type: "win_streak",
      target: 2,
      icon: "💫",
      titleKey: "dmStreak2Title",
      descKey: "dmStreak2Desc",
      bot: "medium",
    },
  ];

  let state = null;
  let activeMissionId = null;
  let gameStartMs = 0;
  let guessPhaseStartMs = 0;
  let timerInterval = null;

  function t(key) {
    return typeof window.wieMsg === "function" ? window.wieMsg(key) : key;
  }

  function todayKey() {
    const d = new Date();
    return d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
  }

  function hashDate(d) {
    const s = d.getFullYear() + "-" + (d.getMonth() + 1) + "-" + d.getDate();
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return h;
  }

  function pickTodayMissionIds() {
    const featured = ["win_3", "guess_30", "win_fast"];
    const seed = hashDate(new Date());
    const pool = MISSION_POOL.map((m) => m.id);
    const picked = [];
    const used = new Set();
    featured.forEach((id) => {
      if (pool.indexOf(id) >= 0 && picked.length < MISSIONS_PER_DAY) {
        used.add(id);
        picked.push(id);
      }
    });
    let x = seed;
    while (picked.length < MISSIONS_PER_DAY && picked.length < pool.length) {
      x = (x * 1103515245 + 12345) >>> 0;
      const id = pool[x % pool.length];
      if (!used.has(id)) {
        used.add(id);
        picked.push(id);
      }
    }
    for (let i = 0; picked.length < MISSIONS_PER_DAY && i < pool.length; i++) {
      if (!used.has(pool[i])) picked.push(pool[i]);
    }
    return picked;
  }

  function loadState() {
    const today = todayKey();
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.date === today) {
          state = parsed;
          return state;
        }
      }
    } catch (e) {
      /* ignore */
    }
    state = {
      date: today,
      missionIds: pickTodayMissionIds(),
      winsToday: 0,
      playsToday: 0,
      winStreak: 0,
      completed: [],
    };
    saveState();
    return state;
  }

  function saveState() {
    if (!state) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      /* ignore */
    }
  }

  function getMissionById(id) {
    return MISSION_POOL.find((m) => m.id === id) || null;
  }

  function getTodayMissions() {
    loadState();
    return state.missionIds
      .map((id) => getMissionById(id))
      .filter(Boolean);
  }

  function isCompleted(id) {
    return state && state.completed.indexOf(id) >= 0;
  }

  function markCompleted(id) {
    if (!state || isCompleted(id)) return;
    state.completed.push(id);
    saveState();
    if (window.WieSounds) WieSounds.play("win");
    if (window.wieShowToast) {
      window.wieShowToast(t("dmMissionDone"));
    }
    renderMissionScreen();
  }

  function getProgress(mission) {
    if (!state || !mission) return 0;
    if (isCompleted(mission.id)) return mission.target;
    switch (mission.type) {
      case "wins_today":
        return Math.min(state.winsToday, mission.target);
      case "plays_today":
        return Math.min(state.playsToday, mission.target);
      case "win_streak":
        return Math.min(state.winStreak, mission.target);
      default:
        return activeMissionId === mission.id ? 0 : 0;
    }
  }

  function checkMissionProgress(opts) {
    if (!state || !activeMissionId) return;
    const mission = getMissionById(activeMissionId);
    if (!mission || isCompleted(mission.id)) return;

    let done = false;
    switch (mission.type) {
      case "wins_today":
        done = state.winsToday >= mission.target;
        break;
      case "plays_today":
        done = state.playsToday >= mission.target;
        break;
      case "win_streak":
        done = state.winStreak >= mission.target;
        break;
      case "win_under_ms":
        done = opts.won && opts.elapsedMs > 0 && opts.elapsedMs <= mission.target;
        break;
      case "guess_under_ms":
        done =
          opts.won &&
          opts.guessElapsedMs > 0 &&
          opts.guessElapsedMs <= mission.target;
        break;
      case "win_hard":
        done = opts.won && opts.botDifficulty === "hard";
        break;
      default:
        break;
    }
    if (done) markCompleted(mission.id);
  }

  function formatTime(ms) {
    const sec = Math.max(0, Math.floor(ms / 1000));
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return m + ":" + String(s).padStart(2, "0");
  }

  function formatProgressMeta(mission, progress, done) {
    if (done) return t("dmCompleted");
    switch (mission.type) {
      case "wins_today":
      case "plays_today":
      case "win_streak":
      case "win_hard":
        return t("dmProgress")
          .replace("{cur}", String(progress))
          .replace("{target}", String(mission.target));
      case "win_under_ms":
        return t("dmProgressTime").replace("{limit}", "3:00");
      case "guess_under_ms":
        return t("dmProgressTime").replace("{limit}", "0:30");
      default:
        return t("dmTapToPlay");
    }
  }

  function mountGameTimer() {
    if (document.getElementById("game-session-timer")) return;
    const el = document.createElement("div");
    el.id = "game-session-timer";
    el.className = "game-session-timer hidden";
    el.setAttribute("role", "timer");
    el.setAttribute("aria-live", "polite");
    el.setAttribute("data-i18n-aria", "gameTimerLabel");
    el.innerHTML =
      '<span class="game-session-timer-icon" aria-hidden="true">⏱</span>' +
      '<span id="game-session-timer-value" class="game-session-timer-value">0:00</span>';
    document.body.appendChild(el);
    if (typeof window.wieT === "function") {
      el.setAttribute("aria-label", window.wieT("gameTimerLabel"));
    }
  }

  function mountMissionHud() {
    if (document.getElementById("daily-mission-hud")) return;
    const el = document.createElement("div");
    el.id = "daily-mission-hud";
    el.className = "daily-mission-hud hidden";
    el.setAttribute("aria-live", "polite");
    el.innerHTML =
      '<span class="daily-mission-hud-icon" id="daily-mission-hud-icon" aria-hidden="true">📅</span>' +
      '<span id="daily-mission-hud-text" class="daily-mission-hud-text"></span>';
    document.body.appendChild(el);
  }

  function startTimer() {
    stopTimer();
    gameStartMs = Date.now();
    guessPhaseStartMs = 0;
    const box = document.getElementById("game-session-timer");
    const val = document.getElementById("game-session-timer-value");
    if (box) box.classList.remove("hidden");
    function tick() {
      if (!val || !gameStartMs) return;
      val.textContent = formatTime(Date.now() - gameStartMs);
    }
    tick();
    timerInterval = window.setInterval(tick, 250);
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    gameStartMs = 0;
    const box = document.getElementById("game-session-timer");
    if (box) box.classList.add("hidden");
    hideMissionHud();
  }

  function showMissionHud() {
    const mission = activeMissionId ? getMissionById(activeMissionId) : null;
    const hud = document.getElementById("daily-mission-hud");
    const icon = document.getElementById("daily-mission-hud-icon");
    const text = document.getElementById("daily-mission-hud-text");
    if (!hud || !mission) {
      hideMissionHud();
      return;
    }
    if (icon) icon.textContent = mission.icon;
    if (text) text.textContent = t(mission.titleKey);
    hud.classList.remove("hidden");
  }

  function hideMissionHud() {
    const hud = document.getElementById("daily-mission-hud");
    if (hud) hud.classList.add("hidden");
  }

  function renderMissionScreen() {
    const list = document.getElementById("daily-missions-list");
    const dateEl = document.getElementById("daily-missions-date");
    const summaryEl = document.getElementById("daily-missions-summary");
    if (!list) return;
    loadState();
    const missions = getTodayMissions();
    const doneCount = missions.filter((m) => isCompleted(m.id)).length;

    if (dateEl) {
      const d = new Date();
      const lang = localStorage.getItem("wieIsHetLang") === "en" ? "en" : "nl";
      dateEl.textContent = d.toLocaleDateString(lang === "en" ? "en" : "nl", {
        weekday: "long",
        day: "numeric",
        month: "long",
      });
    }
    if (summaryEl) {
      summaryEl.textContent = t("dmSummary")
        .replace("{done}", String(doneCount))
        .replace("{total}", String(missions.length));
    }

    list.innerHTML = "";
    missions.forEach((mission) => {
      const done = isCompleted(mission.id);
      const progress = getProgress(mission);
      let pct = 0;
      if (done) pct = 100;
      else if (
        mission.type === "wins_today" ||
        mission.type === "plays_today" ||
        mission.type === "win_streak" ||
        mission.type === "win_hard"
      ) {
        pct = Math.min(100, Math.round((progress / mission.target) * 100));
      }

      const card = document.createElement("button");
      card.type = "button";
      card.className = "daily-mission-card" + (done ? " is-done" : "");
      card.disabled = done;
      card.innerHTML =
        '<span class="daily-mission-card-icon" aria-hidden="true">' +
        mission.icon +
        "</span>" +
        '<span class="daily-mission-card-body">' +
        '<span class="daily-mission-card-title">' +
        t(mission.titleKey) +
        "</span>" +
        '<span class="daily-mission-card-desc">' +
        t(mission.descKey) +
        "</span>" +
        '<span class="daily-mission-card-progress">' +
        '<span class="daily-mission-card-bar" style="width:' +
        pct +
        '%"></span>' +
        "</span>" +
        '<span class="daily-mission-card-meta">' +
        formatProgressMeta(mission, progress, done) +
        "</span>" +
        "</span>" +
        (done
          ? '<span class="daily-mission-card-check" aria-hidden="true">✓</span>'
          : '<span class="daily-mission-card-play" aria-hidden="true">▶</span>');

      card.addEventListener("click", () => startMission(mission.id));
      list.appendChild(card);
    });
  }

  function openMissionScreen() {
    if (window.WieGameFeatures) WieGameFeatures.setCardMode("full");
    renderMissionScreen();
    if (window.wieShowScreen) {
      window.wieShowScreen("screen-mode", "screen-daily-missions");
    } else {
      const from = document.getElementById("screen-mode");
      const to = document.getElementById("screen-daily-missions");
      if (from) from.classList.add("hidden");
      if (to) to.classList.remove("hidden");
    }
  }

  function startMission(missionId) {
    const mission = getMissionById(missionId);
    if (!mission || isCompleted(missionId)) return;
    if (window.WieSounds) WieSounds.play("ui");
    activeMissionId = missionId;
    loadState();
    if (window.WieGameFeatures) WieGameFeatures.setCardMode("full");
    document.documentElement.classList.remove("wie-daily-challenge");

    const diff = mission.bot || "medium";
    if (typeof window.wieStartBotGame === "function") {
      window.wieStartBotGame(diff);
      return;
    }
    if (window.wieApp && window.wieApp.startBotGame) {
      window.wieApp.startBotGame(diff);
    }
  }

  window.WieDailyMissions = {
    init() {
      mountGameTimer();
      mountMissionHud();
      loadState();
    },

    open: openMissionScreen,
    render: renderMissionScreen,
    startMission,

    getActiveMissionId() {
      return activeMissionId;
    },

    onGameStart() {
      startTimer();
      loadState();
      state.playsToday = (state.playsToday || 0) + 1;
      saveState();
      if (!activeMissionId) {
        hideMissionHud();
        return;
      }
      showMissionHud();
    },

    refreshTimerAria() {
      const box = document.getElementById("game-session-timer");
      if (box && typeof window.wieT === "function") {
        box.setAttribute("aria-label", window.wieT("gameTimerLabel"));
      }
    },

    onGameStop() {
      stopTimer();
      activeMissionId = null;
    },

    onGuessPhaseStart() {
      guessPhaseStartMs = Date.now();
    },

    onGameEnd(won, opts) {
      opts = opts || {};
      const elapsedMs = gameStartMs ? Date.now() - gameStartMs : 0;
      let guessElapsedMs = 0;
      if (guessPhaseStartMs && won) {
        guessElapsedMs = Date.now() - guessPhaseStartMs;
      }

      loadState();
      if (won) {
        state.winsToday = (state.winsToday || 0) + 1;
        state.winStreak = (state.winStreak || 0) + 1;
      } else {
        state.winStreak = 0;
      }
      saveState();

      checkMissionProgress({
        won,
        elapsedMs,
        guessElapsedMs,
        botDifficulty: opts.botDifficulty || "medium",
      });

      stopTimer();
      renderMissionScreen();
    },

    getElapsedMs() {
      return gameStartMs ? Date.now() - gameStartMs : 0;
    },
  };

  window.wieOpenDaily = function (ev) {
    if (ev && ev.preventDefault) ev.preventDefault();
    if (ev && ev.stopPropagation) ev.stopPropagation();
    if (!window.wieSavedName || !window.wieSavedName()) {
      window.wiePendingDaily = true;
      if (window.wieGoBegin) window.wieGoBegin();
      return;
    }
    openMissionScreen();
  };

  window.wieStartDaily = window.wieOpenDaily;

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => WieDailyMissions.init());
  } else {
    WieDailyMissions.init();
  }
})();
