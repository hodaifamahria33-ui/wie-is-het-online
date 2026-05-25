/**
 * Rank / ELO systeem — localStorage profiel + tiers.
 */
(function () {
  const STORAGE_KEY = "wieRankProfile";
  const PLAYER_ID_KEY = "wieRankPlayerId";

  const TIERS = [
    { id: "bronze", min: 0, icon: "🥉" },
    { id: "silver", min: 900, icon: "🥈" },
    { id: "gold", min: 1100, icon: "🥇" },
    { id: "platinum", min: 1300, icon: "💎" },
    { id: "diamond", min: 1500, icon: "👑" },
  ];

  const BOT_RATINGS = { easy: 850, medium: 1000, hard: 1200 };

  function uuid() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === "x" ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getPlayerId() {
    let id = localStorage.getItem(PLAYER_ID_KEY);
    if (!id) {
      id = uuid();
      localStorage.setItem(PLAYER_ID_KEY, id);
    }
    return id;
  }

  function defaultProfile() {
    return {
      rating: 1000,
      peakRating: 1000,
      wins: 0,
      losses: 0,
      rankedWins: 0,
      rankedLosses: 0,
      streak: 0,
      bestStreak: 0,
    };
  }

  function loadProfile() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultProfile();
      return { ...defaultProfile(), ...JSON.parse(raw) };
    } catch {
      return defaultProfile();
    }
  }

  function saveProfile(profile) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  }

  function getTier(rating) {
    let tier = TIERS[0];
    for (const t of TIERS) {
      if (rating >= t.min) tier = t;
    }
    return tier;
  }

  function getNextTier(tierId) {
    const i = TIERS.findIndex((t) => t.id === tierId);
    return i >= 0 && i < TIERS.length - 1 ? TIERS[i + 1] : null;
  }

  function getTierProgress(rating) {
    const tier = getTier(rating);
    const next = getNextTier(tier.id);
    if (!next) {
      return { tier, next: null, current: rating, min: tier.min, max: rating, pct: 100 };
    }
    const span = next.min - tier.min;
    const pct = span > 0 ? Math.min(100, Math.max(0, ((rating - tier.min) / span) * 100)) : 0;
    return { tier, next, current: rating, min: tier.min, max: next.min, pct };
  }

  function tierName(tierId, tFn) {
    const key = "rankTier_" + tierId;
    if (typeof tFn === "function") {
      const label = tFn(key);
      if (label !== key) return label;
    }
    return tierId;
  }

  function expectedScore(myRating, oppRating) {
    return 1 / (1 + Math.pow(10, (oppRating - myRating) / 400));
  }

  /** 0 = laag rank, 1 = hoog rank (minder winst, meer verlies). */
  function rankPressure(rating) {
    const prog = getTierProgress(rating);
    const tierIdx = TIERS.findIndex((t) => t.id === prog.tier.id);
    const tierT = tierIdx / Math.max(1, TIERS.length - 1);
    let withinT = 1;
    if (prog.next && prog.max > prog.min) {
      withinT = (rating - prog.min) / (prog.max - prog.min);
    }
    return Math.min(1, Math.max(0, tierT * 0.8 + withinT * 0.2));
  }

  /** Ranked: winst = plus, verlies = min; hoog rank = kleine plus, grote min. */
  function calcRankedDelta(myRating, oppRating, won) {
    const pressure = rankPressure(myRating);
    const opp = oppRating || 1000;
    const expected = expectedScore(myRating, opp);

    if (won) {
      const winCeiling = Math.round(36 - pressure * 26);
      const winFloor = Math.round(10 - pressure * 5);
      const surprise = 0.45 + (1 - expected) * 0.85;
      let gain = winCeiling * surprise;
      gain = Math.round(Math.max(winFloor, Math.min(winCeiling, gain)));
      return Math.max(5, gain);
    }

    const lossFloor = Math.round(-14 - pressure * 6);
    const lossCeiling = Math.round(-28 - pressure * 18);
    const shock = 0.5 + expected * 0.9;
    let loss = lossFloor + (lossCeiling - lossFloor) * shock;
    loss = Math.round(Math.min(-8, Math.max(lossCeiling, loss)));
    return Math.min(-8, loss);
  }

  function calcDelta(myRating, oppRating, won) {
    return calcRankedDelta(myRating, oppRating, won);
  }

  function getBotRatingForDifficulty(difficulty) {
    return BOT_RATINGS[difficulty] || BOT_RATINGS.medium;
  }

  function getBotDifficultyForRating(rating) {
    if (rating < 950) return "easy";
    if (rating < 1180) return "medium";
    return "hard";
  }

  function applyMatchResult(won, opponentRating, options) {
    const opts = options || {};
    const profile = loadProfile();
    const before = profile.rating;
    const delta = opts.ranked
      ? calcRankedDelta(before, opponentRating || 1000, won)
      : calcDelta(before, opponentRating || 1000, won);
    profile.rating = Math.max(0, before + delta);
    profile.peakRating = Math.max(profile.peakRating, profile.rating);

    if (won) {
      profile.wins += 1;
      profile.streak += 1;
      profile.bestStreak = Math.max(profile.bestStreak, profile.streak);
      if (opts.ranked) profile.rankedWins += 1;
    } else {
      profile.losses += 1;
      profile.streak = 0;
      if (opts.ranked) profile.rankedLosses += 1;
    }

    saveProfile(profile);
    const tier = getTier(profile.rating);
    const prevTier = getTier(before);

    return {
      delta,
      before,
      after: profile.rating,
      tier,
      tierUp: tier.id !== getTier(before).id && profile.rating > before,
      tierDown: tier.id !== prevTier.id && profile.rating < before,
      profile,
    };
  }

  function formatDelta(delta, tFn) {
    if (delta > 0) return "+" + delta;
    if (delta < 0) return String(delta);
    return typeof tFn === "function" ? tFn("rankNoChange") : "0";
  }

  window.WieRank = {
    TIERS,
    getPlayerId,
    loadProfile,
    saveProfile,
    getTier,
    getNextTier,
    getTierProgress,
    tierName,
    calcDelta,
    calcRankedDelta,
    rankPressure,
    getBotRatingForDifficulty,
    getBotDifficultyForRating,
    applyMatchResult,
    formatDelta,
  };
})();
