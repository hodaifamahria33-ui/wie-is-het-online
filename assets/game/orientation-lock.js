/**
 * Mobiel: landscape tijdens spel; na potje terug naar portrait (menu/lobby).
 * Lobby vóór het spel: geen draai-overlay.
 */
(function () {
  const PHONE_SHORT_SIDE_PX = 520;
  const LANDSCAPE_STABLE_MS = 280;

  let screenGame = null;
  let overlay = null;
  let pendingStarts = [];
  let landscapeStableTimer = null;
  let pendingPortraitReturn = false;
  let chestHomeParent = null;
  let chestHomeBefore = null;

  function isGameScreenActive() {
    return screenGame && !screenGame.classList.contains("hidden");
  }

  function isPhoneLike() {
    const shortSide = Math.min(window.innerWidth, window.innerHeight);
    if (shortSide > PHONE_SHORT_SIDE_PX) return false;
    if (window.matchMedia("(pointer: coarse)").matches) return true;
    return window.matchMedia("(max-width: 600px)").matches;
  }

  function isLandscapeLike() {
    if (window.matchMedia("(orientation: landscape)").matches) return true;
    if (window.matchMedia("(orientation: portrait)").matches) return false;
    return window.innerWidth > window.innerHeight;
  }

  function needsRotateToLandscape() {
    return isGameScreenActive() && isPhoneLike() && !isLandscapeLike();
  }

  function needsRotateToPortrait() {
    return (
      pendingPortraitReturn &&
      !isGameScreenActive() &&
      isPhoneLike() &&
      isLandscapeLike()
    );
  }

  function t(key) {
    return typeof window.wieMsg === "function" ? window.wieMsg(key) : key;
  }

  function applyOverlayCopy(mode) {
    if (!overlay) return;
    const titleEl = document.getElementById("orientation-lock-title");
    const subEl = overlay.querySelector(".orientation-lock-sub");
    if (mode === "portrait") {
      if (titleEl) titleEl.textContent = t("rotatePhoneBackTitle");
      if (subEl) subEl.textContent = t("rotatePhoneBackSub");
    } else {
      if (titleEl) titleEl.textContent = t("rotatePhoneTitle");
      if (subEl) subEl.textContent = t("rotatePhoneSub");
    }
  }

  function onGameScreenVisibilityChange() {
    if (!screenGame) return;
    if (isGameScreenActive()) {
      pendingPortraitReturn = false;
      return;
    }
    if (!isPhoneLike()) {
      pendingPortraitReturn = false;
      return;
    }
    if (isLandscapeLike()) {
      pendingPortraitReturn = true;
    } else {
      pendingPortraitReturn = false;
    }
  }

  function flushPendingStarts() {
    if (needsRotateToLandscape()) return;
    const run = pendingStarts.splice(0);
    run.forEach((fn) => {
      try {
        fn();
      } catch (err) {
        console.warn("orientation start", err);
      }
    });
  }

  function scheduleLandscapeReady() {
    clearTimeout(landscapeStableTimer);
    if (!isGameScreenActive() || !isPhoneLike()) {
      flushPendingStarts();
      return;
    }
    if (!isLandscapeLike()) return;
    landscapeStableTimer = window.setTimeout(() => {
      if (isGameScreenActive() && isPhoneLike() && isLandscapeLike()) {
        flushPendingStarts();
      }
      update();
    }, LANDSCAPE_STABLE_MS);
  }

  function cancelPendingStarts() {
    pendingStarts = [];
    clearTimeout(landscapeStableTimer);
    landscapeStableTimer = null;
  }

  function waitForLandscape(cb) {
    if (typeof cb !== "function") return;
    if (!isPhoneLike() || isLandscapeLike()) {
      cb();
      return;
    }
    pendingStarts.push(cb);
    update();
  }

  function syncOpponentChestDock() {
    const chest = document.getElementById("opponent-chest");
    const giveUp = document.getElementById("btn-give-up");
    if (!chest || !screenGame) return;

    const home = document.querySelector("#game-table .player-play-area");
    const boardFront = home && home.querySelector(".board-stand--front");

    if (isPhoneLike()) {
      if (!chestHomeParent && home && boardFront) {
        chestHomeParent = home;
        chestHomeBefore = boardFront;
      }
      if (chest.parentElement !== screenGame) {
        if (giveUp) screenGame.insertBefore(chest, giveUp);
        else screenGame.appendChild(chest);
      }
      chest.classList.add("opponent-chest--phone-dock");
    } else {
      if (chestHomeParent && chestHomeBefore && chest.parentElement !== chestHomeParent) {
        chestHomeParent.insertBefore(chest, chestHomeBefore);
      }
      chest.classList.remove("opponent-chest--phone-dock");
    }
  }

  function update() {
    if (!overlay) return;

    syncOpponentChestDock();

    if (pendingPortraitReturn && !isLandscapeLike()) {
      pendingPortraitReturn = false;
    }

    const toLandscape = needsRotateToLandscape();
    const toPortrait = needsRotateToPortrait();
    const lock = toLandscape || toPortrait;
    const landscapeGame =
      isGameScreenActive() && isPhoneLike() && isLandscapeLike();

    overlay.classList.remove(
      "orientation-lock--to-landscape",
      "orientation-lock--to-portrait"
    );
    if (toLandscape) {
      overlay.classList.add("orientation-lock--to-landscape");
      applyOverlayCopy("landscape");
    } else if (toPortrait) {
      overlay.classList.add("orientation-lock--to-portrait");
      applyOverlayCopy("portrait");
    }

    overlay.classList.toggle("hidden", !lock);
    overlay.setAttribute("aria-hidden", lock ? "false" : "true");
    document.documentElement.classList.toggle("wie-game-portrait-lock", toLandscape);
    document.documentElement.classList.toggle(
      "wie-phone-landscape-game",
      landscapeGame
    );
    document.documentElement.classList.toggle(
      "wie-phone-portrait-return-lock",
      toPortrait
    );

    if (!toLandscape && landscapeGame) {
      scheduleLandscapeReady();
    } else if (!toLandscape && !landscapeGame) {
      flushPendingStarts();
    }
  }

  function hookShowOnly() {
    const prev = window.wieShowOnly;
    if (!prev || prev.__wieOrientHook) return;
    window.wieShowOnly = function (screenId) {
      prev(screenId);
      onGameScreenVisibilityChange();
      window.setTimeout(update, 0);
      window.setTimeout(update, 200);
      window.setTimeout(update, 450);
    };
    window.wieShowOnly.__wieOrientHook = true;
  }

  function init() {
    screenGame = document.getElementById("screen-game");
    overlay = document.getElementById("orientation-lock");
    if (!overlay) return;

    if (overlay.parentElement !== document.body) {
      document.body.appendChild(overlay);
    }

    hookShowOnly();

    window.addEventListener("orientationchange", () => {
      window.setTimeout(update, 40);
      window.setTimeout(update, 200);
      window.setTimeout(update, 450);
    });
    window.addEventListener("resize", update);
    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", update);
    }

    if (window.screen && window.screen.orientation && window.screen.orientation.addEventListener) {
      window.screen.orientation.addEventListener("change", update);
    }

    if (screenGame) {
      const obs = new MutationObserver(() => {
        onGameScreenVisibilityChange();
        update();
      });
      obs.observe(screenGame, { attributes: true, attributeFilter: ["class"] });
    }

    update();
    window.setInterval(update, 800);
  }

  window.WieOrientationLock = {
    refresh: update,
    waitForLandscape,
    cancelPendingStarts,
    requestPortraitReturn: function () {
      if (isPhoneLike() && isLandscapeLike() && !isGameScreenActive()) {
        pendingPortraitReturn = true;
        update();
      }
    },
    isPhoneLike,
    isLandscapeLike,
    needsRotateLock: needsRotateToLandscape,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
