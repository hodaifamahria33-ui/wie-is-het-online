/**
 * Mobiel: landscape om te spelen; na potje weer portrait voor menu.
 */
(function () {
  const LOCK_CLASS = "orientation-locked";
  const PHONE_SHORT_SIDE_PX = 520;

  let screenGame = null;
  let overlay = null;
  let pendingStarts = [];

  function isGameScreenActive() {
    return screenGame && !screenGame.classList.contains("hidden");
  }

  function isPhoneLike() {
    const shortSide = Math.min(window.innerWidth, window.innerHeight);
    if (shortSide > PHONE_SHORT_SIDE_PX) return false;
    if (window.matchMedia("(pointer: coarse)").matches) return true;
    return window.matchMedia("(max-width: 600px)").matches;
  }

  function isPortrait() {
    if (window.matchMedia("(orientation: portrait)").matches) return true;
    if (window.matchMedia("(orientation: landscape)").matches) return false;
    return window.innerHeight >= window.innerWidth;
  }

  function needsRotateToLandscape() {
    return isGameScreenActive() && isPhoneLike() && isPortrait();
  }

  function needsRotateToPortrait() {
    return !isGameScreenActive() && isPhoneLike() && !isPortrait();
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
    } else if (mode === "landscape") {
      if (titleEl) titleEl.textContent = t("rotatePhoneTitle");
      if (subEl) subEl.textContent = t("rotatePhoneSub");
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

  function cancelPendingStarts() {
    pendingStarts = [];
  }

  function waitForLandscape(cb) {
    if (typeof cb !== "function") return;
    if (!isPhoneLike() || !isPortrait()) {
      cb();
      return;
    }
    pendingStarts.push(cb);
    update();
  }

  function update() {
    if (!overlay) return;

    const toLandscape = needsRotateToLandscape();
    const toPortrait = needsRotateToPortrait();
    const lock = toLandscape || toPortrait;
    const landscapeGame =
      isGameScreenActive() && isPhoneLike() && !isPortrait();

    if (screenGame) {
      screenGame.classList.toggle(LOCK_CLASS, toLandscape);
    }

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

    if (toLandscape) flushPendingStarts();
  }

  function hookShowOnly() {
    const prev = window.wieShowOnly;
    if (!prev || prev.__wieOrientHook) return;
    window.wieShowOnly = function (screenId) {
      prev(screenId);
      window.setTimeout(update, 0);
      window.setTimeout(update, 200);
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
      window.setTimeout(update, 50);
      window.setTimeout(update, 350);
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
    needsRotateLock: needsRotateToLandscape,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
