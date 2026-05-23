/**
 * Ranked matchmaking — probeert echte speler, anders ranked bot.
 */
(function () {
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
    const url = cfg().matchmakerUrl;
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

    async function tryMatchmaker(onStatus) {
    const base = cfg().matchmakerUrl;
    if (!base || !window.WieRank) return null;

    const playerId = WieRank.getPlayerId();
    const profile = WieRank.loadProfile();
    const name =
      (typeof window.wieGetPlayerName === "function" && window.wieGetPlayerName()) ||
      localStorage.getItem("wiePlayerName") ||
      "Speler";

    abortCtrl = new AbortController();
    onStatus(t("rankQueueSearchingOnline"));

    let joinData = null;
    try {
      const joinRes = await fetch(base + "/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ playerId, name, rating: profile.rating }),
        signal: abortCtrl.signal,
      });
      if (joinRes.ok) joinData = await joinRes.json();
    } catch {
      return null;
    }

    if (joinData && joinData.status === "matched" && joinData.code) {
      return {
        code: String(joinData.code).toUpperCase().slice(0, 5),
        role: joinData.role === "host" ? "host" : "guest",
        opponentRating: joinData.opponentRating || 1000,
        opponentName: joinData.opponentName || t("rankOpponent"),
      };
    }

    const timeoutMs = cfg().queueTimeoutMs || 14000;
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
          const res = await fetch(
            base + "/status?playerId=" + encodeURIComponent(playerId),
            { signal: abortCtrl.signal }
          );
          if (!res.ok) return;
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
      }, 1200);
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
