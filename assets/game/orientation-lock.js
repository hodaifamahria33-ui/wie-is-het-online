/**
 * Mobiel: alleen tijdens het spel landscape; lobby/menu blijft vrij (elke stand).
 */
(function () {
  const PHONE_SHORT_SIDE_PX = 520;
  const LANDSCAPE_STABLE_MS = 280;

  let screenGame = null;
  let overlay = null;
  let pendingStarts = [];
  let landscapeStableTimer = null;

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

  function t(key) {
    return typeof window.wieMsg === "function" ? window.wieMsg(key) : key;
  }

  function applyOverlayCopy() {
    if (!overlay) return;
    const titleEl = document.getElementById("orientation-lock-title");
    const subEl = overlay.querySelector(".orientation-lock-sub");
    if (titleEl) titleEl.textContent = t("rotatePhoneTitle");
    if (subEl) subEl.textContent = t("rotatePhoneSub");
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

  function update() {
    if (!overlay) return;

    const toLandscape = needsRotateToLandscape();
    const landscapeGame =
      isGameScreenActive() && isPhoneLike() && isLandscapeLike();

    overlay.classList.remove("orientation-lock--to-portrait");
    overlay.classList.toggle("orientation-lock--to-landscape", toLandscape);
    if (toLandscape) applyOverlayCopy();

    overlay.classList.toggle("hidden", !toLandscape);
    overlay.setAttribute("aria-hidden", toLandscape ? "false" : "true");
    document.documentElement.classList.toggle("wie-game-portrait-lock", toLandscape);
    document.documentElement.classList.toggle(
      "wie-phone-landscape-game",
      landscapeGame
    );
    document.documentElement.classList.remove("wie-phone-portrait-return-lock");

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
      const obs = new MutationObserver(update);
      obs.observe(screenGame, { attributes: true, attributeFilter: ["class"] });
    }

    update();
    window.setInterval(update, 800);
  }

  window.WieOrientationLock = {
    refresh: update,
    waitForLandscape,
    cancelPendingStarts,
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
