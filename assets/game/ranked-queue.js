/**
 * Ranked matchmaking — probeert echte speler, anders ranked bot.
 */
(function () {
  const DEFAULT_MATCHMAKER =
    "https://wieishet-online-signal.hodaifamahria33.workers.dev/ranked";

  let active = false;
  let pollTimer = null;
  let searchTimer = null;
  let abortCtrl = null;

  function cfg() {
    return window.WIE_RANKED || {};
  }

  function t(key) {
    if (typeof window.wieT === "function") return window.wieT(key);
    return key;
  }

  function ensureMatchmakerUrl() {
    window.WIE_RANKED = window.WIE_RANKED || {};
    const ranked = window.WIE_RANKED;
    const preset = String(ranked.matchmakerUrl || "").replace(/\/$/, "");
    const signal = window.WIE_ONLINE && window.WIE_ONLINE.signalUrl
      ? String(window.WIE_ONLINE.signalUrl).replace(/\/$/, "") + "/ranked"
      : "";

    if (preset) {
      ranked.matchmakerUrl = preset;
      return preset;
    }
    if (signal) {
      ranked.matchmakerUrl = signal;
      return signal;
    }
    ranked.matchmakerUrl = DEFAULT_MATCHMAKER;
    return DEFAULT_MATCHMAKER;
  }

  function clearTimers() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
    if (searchTimer) {
      clearTimeout(searchTimer);
      searchTimer = null;
    }
    if (abortCtrl) {
      abortCtrl.abort();
      abortCtrl = null;
    }
  }

  function cancel() {
    active = false;
    clearTimers();
    const url = cfg().matchmakerUrl || DEFAULT_MATCHMAKER;
    if (url && window.WieRank) {
      fetch(url + "/leave?playerId=" + encodeURIComponent(WieRank.getPlayerId()), {
        method: "POST",
        keepalive: true,
      }).catch(() => {});
    }
  }

  function wait(ms) {
    return new Promise((resolve) => {
      searchTimer = setTimeout(resolve, ms);
    });
  }

  async function fetchRanked(path, options) {
    const base = ensureMatchmakerUrl();
    if (!base) return null;
    for (let i = 0; i < 3; i++) {
      try {
        const res = await fetch(base + path, options);
        if (res.ok) return res;
      } catch (e) {
        console.warn("ranked fetch", i + 1, path, e);
        if (i < 2) await wait(500 + i * 400);
      }
    }
    return null;
  }

  async function tryMatchmaker(onStatus) {
    if (!window.WieRank) return null;

    const playerId = WieRank.getPlayerId();
    const profile = WieRank.loadProfile();
    const name =
      (typeof window.wieGetPlayerName === "function" && window.wieGetPlayerName()) ||
      localStorage.getItem("wiePlayerName") ||
      "Speler";

    abortCtrl = new AbortController();
    onStatus(t("rankQueueSearchingOnline"));

    let joinData = null;
    const joinRes = await fetchRanked("/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ playerId, name, rating: profile.rating }),
      signal: abortCtrl.signal,
    });
    if (joinRes) joinData = await joinRes.json().catch(() => null);

    if (joinData && joinData.status === "matched" && joinData.code) {
      return {
        code: String(joinData.code).toUpperCase().slice(0, 5),
        role: joinData.role === "host" ? "host" : "guest",
        opponentRating: joinData.opponentRating || 1000,
        opponentName: joinData.opponentName || t("rankOpponent"),
      };
    }

    const timeoutMs = cfg().queueTimeoutMs || 28000;
    const started = Date.now();

    return new Promise((resolve) => {
      pollTimer = setInterval(async () => {
        if (!active) {
          clearTimers();
          resolve(null);
          return;
        }
        if (Date.now() - started > timeoutMs) {
          clearTimers();
          resolve(null);
          return;
        }
        try {
          const res = await fetchRanked(
            "/status?playerId=" + encodeURIComponent(playerId),
            { signal: abortCtrl.signal }
          );
          if (!res) return;
          const data = await res.json();
          if (data.status === "matched" && data.code) {
            clearTimers();
            resolve({
              code: String(data.code).toUpperCase().slice(0, 5),
              role: data.role === "host" ? "host" : "guest",
              opponentRating: data.opponentRating || 1000,
              opponentName: data.opponentName || t("rankOpponent"),
            });
          } else if (data.queueSize > 1) {
            onStatus(t("rankQueueAlmost"));
          }
        } catch {
          /* keep polling */
        }
      }, 900);
    });
  }

  async function simulatedSearch(onStatus) {
    const steps = [
      t("rankQueueSearching"),
      t("rankQueueChecking"),
      t("rankQueueSearchingOnline"),
    ];
    for (let i = 0; i < steps.length; i += 1) {
      if (!active) return;
      onStatus(steps[i]);
      await wait(900 + i * 400);
    }
    await wait(cfg().queueTimeoutMs || 3200);
  }

  async function start(onStatus, onMatched, onFallback) {
    cancel();
    active = true;

    if (window.WieOnlineConfig && typeof WieOnlineConfig.discover === "function") {
      await WieOnlineConfig.discover();
    }
    ensureMatchmakerUrl();

    let match = null;
    if (cfg().matchmakerUrl) {
      match = await tryMatchmaker(onStatus);
    } else {
      await simulatedSearch(onStatus);
    }

    if (!active) return;

    if (match) {
      active = false;
      clearTimers();
      onMatched(match);
      return;
    }

    active = false;
    clearTimers();
    onStatus(t("rankQueueFallback"));
    await wait(700);
    onFallback();
  }

  window.WieRankedQueue = { start, cancel, isActive: () => active };
})();
