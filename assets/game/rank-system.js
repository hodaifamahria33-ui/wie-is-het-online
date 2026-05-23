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

  function calcDelta(myRating, oppRating, won) {
    const K = 32;
    const score = won ? 1 : 0;
    return Math.round(K * (score - expectedScore(myRating, oppRating)));
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
    const delta = calcDelta(before, opponentRating || 1000, won);
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
    getBotRatingForDifficulty,
    getBotDifficultyForRating,
    applyMatchResult,
    formatDelta,
  };
})();
