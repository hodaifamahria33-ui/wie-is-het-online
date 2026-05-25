/**
 * Zoekt een live signal/matchmaker server en zet WIE_ONLINE + WIE_RANKED.
 */
(function () {
  const DEFAULT_CANDIDATES = [
    "https://wieishet-online-signal.hodaifamahria33.workers.dev",
  ];

  function bases() {
    const cfg = window.WIE_ONLINE || {};
    const list = [];
    if (cfg.signalUrl) list.push(String(cfg.signalUrl).replace(/\/$/, ""));
    if (Array.isArray(cfg.signalUrlCandidates)) {
      cfg.signalUrlCandidates.forEach((u) => {
        if (u) list.push(String(u).replace(/\/$/, ""));
      });
    }
    DEFAULT_CANDIDATES.forEach((u) => list.push(u));
    return [...new Set(list.filter(Boolean))];
  }

  async function probe(base) {
    try {
      const res = await fetch(base + "/health", {
        cache: "no-store",
        mode: "cors",
      });
      if (!res.ok) return false;
      const data = await res.json().catch(() => ({}));
      return data && data.ok === true;
    } catch (_) {
      return false;
    }
  }

  async function discover() {
    window.WIE_ONLINE = window.WIE_ONLINE || {};
    window.WIE_RANKED = window.WIE_RANKED || {};
    const presetUrl = String(window.WIE_ONLINE.signalUrl || "").replace(/\/$/, "");
    const presetRanked = String(window.WIE_RANKED.matchmakerUrl || "").replace(/\/$/, "");

    const ordered = bases();
    for (const base of ordered) {
      if (await probe(base)) {
        window.WIE_ONLINE.signalUrl = base;
        window.WIE_RANKED.matchmakerUrl = base + "/ranked";
        window.WIE_ONLINE.__discovered = true;
        window.WIE_ONLINE.__signalLive = true;
        return base;
      }
    }

    if (presetUrl) {
      window.WIE_ONLINE.signalUrl = presetUrl;
      window.WIE_RANKED.matchmakerUrl =
        presetRanked || presetUrl + "/ranked";
    } else {
      window.WIE_ONLINE.signalUrl = "";
      window.WIE_RANKED.matchmakerUrl = "";
    }
    window.WIE_ONLINE.__discovered = false;
    window.WIE_ONLINE.__signalLive = false;
    return presetUrl || null;
  }

  window.WieOnlineConfig = {
    discover,
    probe,
    bases,
  };

  window.WIE_ONLINE = window.WIE_ONLINE || {
    signalUrl: "",
    signalUrlCandidates: DEFAULT_CANDIDATES.slice(),
  };
  window.WIE_RANKED = window.WIE_RANKED || { matchmakerUrl: "", queueTimeoutMs: 22000 };

  discover().catch(function () {});
})();
